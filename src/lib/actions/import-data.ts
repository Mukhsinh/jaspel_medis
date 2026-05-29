"use server";

import { supabaseAdmin } from "@/lib/supabase";
import * as XLSX from "xlsx";
import { revalidatePath } from "next/cache";

export async function importSepData(base64Data: string) {
    try {
        const buffer = Buffer.from(base64Data, 'base64');
        const workbook = XLSX.read(buffer, { type: 'buffer' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const data = XLSX.utils.sheet_to_json(sheet) as any[];

        let importedCount = 0;
        let skippedCount = 0;

        for (const row of data) {
            const sepNumber = row['No. SEP'] || row['SEP'] || row['sep_number'];
            if (!sepNumber) {
                skippedCount++;
                continue;
            }

            const patientName = String(row['Nama Pasien'] || row['nama'] || "");
            const rmNo = String(row['No. RM'] || row['rm'] || "");
            const admissionDate = new Date(row['Tgl. Masuk'] || row['tgl_masuk'] || Date.now()).toISOString();
            const dischargeDate = row['Tgl. Keluar'] ? new Date(row['Tgl. Keluar']).toISOString() : null;
            const inacbgCode = String(row['Kode INA-CBG'] || row['inacbg'] || "");
            const claimAmount = parseFloat(row['Biaya Klaim'] || row['tarif_inacbg'] || "0");

            // Upsert patient case by SEP number
            const { data: existingCase } = await supabaseAdmin
                .from('patient_cases')
                .select('id')
                .eq('sep_number', sepNumber)
                .maybeSingle();

            let caseId: string;

            if (existingCase) {
                // Update existing
                await supabaseAdmin
                    .from('patient_cases')
                    .update({
                        patient_name: patientName,
                        rm_no: rmNo,
                        admission_date: admissionDate,
                        discharge_date: dischargeDate
                    })
                    .eq('id', existingCase.id);
                caseId = existingCase.id;
            } else {
                // Insert new
                const { data: newCase, error } = await supabaseAdmin
                    .from('patient_cases')
                    .insert({
                        sep_number: sepNumber,
                        patient_name: patientName,
                        rm_no: rmNo,
                        admission_date: admissionDate,
                        discharge_date: dischargeDate
                    })
                    .select('id')
                    .single();

                if (error) {
                    console.error("Insert patient case error:", error);
                    skippedCount++;
                    continue;
                }
                caseId = newCase.id;
            }

            // Check if claim exists for this case
            const { data: existingClaim } = await supabaseAdmin
                .from('claim_cases')
                .select('id')
                .eq('case_id', caseId)
                .maybeSingle();

            if (existingClaim) {
                await supabaseAdmin
                    .from('claim_cases')
                    .update({
                        inacbg_code: inacbgCode,
                        claim_amount: claimAmount,
                        status: "PENDING"
                    })
                    .eq('id', existingClaim.id);
            } else {
                await supabaseAdmin
                    .from('claim_cases')
                    .insert({
                        case_id: caseId,
                        inacbg_code: inacbgCode,
                        claim_amount: claimAmount,
                        status: "PENDING"
                    });
            }

            importedCount++;
        }

        revalidatePath("/proses/klaim");
        return { success: true, imported: importedCount, skipped: skippedCount };
    } catch (error: any) {
        console.error("Import Error:", error);
        return { success: false, error: error.message };
    }
}
