"use server";

import { prisma } from "@/lib/prisma";
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
            const admissionDate = new Date(row['Tgl. Masuk'] || row['tgl_masuk'] || Date.now());
            const dischargeDate = row['Tgl. Keluar'] ? new Date(row['Tgl. Keluar']) : null;
            const inacbgCode = String(row['Kode INA-CBG'] || row['inacbg'] || "");
            const claimAmount = parseFloat(row['Biaya Klaim'] || row['tarif_inacbg'] || "0");

            await prisma.$transaction(async (tx) => {
                const patientCase = await tx.patientCase.upsert({
                    where: { sepNumber },
                    update: {
                        patientName,
                        rmNo,
                        admissionDate,
                        dischargeDate,
                    },
                    create: {
                        sepNumber,
                        patientName,
                        rmNo,
                        admissionDate,
                        dischargeDate
                    }
                });

                // Check if claim exists for this case
                const existingClaim = await tx.claimCase.findFirst({
                    where: { caseId: patientCase.id }
                });

                if (existingClaim) {
                    await tx.claimCase.update({
                        where: { id: existingClaim.id },
                        data: {
                            inacbgCode,
                            claimAmount,
                            status: "PENDING"
                        }
                    });
                } else {
                    await tx.claimCase.create({
                        data: {
                            caseId: patientCase.id,
                            inacbgCode,
                            claimAmount,
                            status: "PENDING"
                        }
                    });
                }
            });

            importedCount++;
        }

        revalidatePath("/proses/klaim");
        return { success: true, imported: importedCount, skipped: skippedCount };
    } catch (error: any) {
        console.error("Import Error:", error);
        return { success: false, error: error.message };
    }
}
