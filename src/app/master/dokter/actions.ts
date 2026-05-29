"use server";

import { supabaseAdmin } from "@/lib/supabase";
import { revalidatePath } from "next/cache";
import * as XLSX from "xlsx";

export async function getDoctors() {
    const { data, error } = await supabaseAdmin
        .from("doctors")
        .select("*")
        .order("name", { ascending: true });
    if (error) return { success: false, error: error.message, data: [] };
    const mapped = (data ?? []).map((d: any) => ({
        id: d.id,
        name: d.name,
        nip: d.nip ?? null,
        nik: d.nik,
        specialization: d.specialization,
        type: d.type,
        status: d.status,
        ptkp: d.ptkp ?? "TK/0",
        bank: d.bank ?? "",
        accountNumber: d.account_number ?? "",
        bankAccountName: d.bank_account_name ?? "",
        isActive: d.is_active,
        createdAt: d.created_at,
        updatedAt: d.updated_at,
    }));
    return { success: true, data: mapped };
}

type DoctorData = {
    name: string; nip: string; nik: string;
    specialization: string; type: string; status: string;
    ptkp: string;
    bank: string;
    accountNumber: string;
    bankAccountName: string;
    isActive: boolean;
};

export async function createDoctor(data: DoctorData) {
    const { error } = await supabaseAdmin.from("doctors").insert({
        name: data.name,
        nip: data.nip || null,
        nik: data.nik,
        specialization: data.specialization,
        type: data.type,
        status: data.status,
        ptkp: data.ptkp,
        bank: data.bank || null,
        account_number: data.accountNumber || null,
        bank_account_name: data.bankAccountName || null,
        is_active: data.isActive,
    });
    if (error) {
        if (error.code === "23505") return { success: false, error: "NIK atau NIP sudah terdaftar" };
        return { success: false, error: error.message };
    }
    revalidatePath("/master/dokter");
    return { success: true };
}

export async function updateDoctor(id: string, data: DoctorData) {
    const { error } = await supabaseAdmin.from("doctors").update({
        name: data.name,
        nip: data.nip || null,
        nik: data.nik,
        specialization: data.specialization,
        type: data.type,
        status: data.status,
        ptkp: data.ptkp,
        bank: data.bank || null,
        account_number: data.accountNumber || null,
        bank_account_name: data.bankAccountName || null,
        is_active: data.isActive,
        updated_at: new Date().toISOString(),
    }).eq("id", id);
    if (error) {
        if (error.code === "23505") return { success: false, error: "NIK atau NIP sudah terdaftar" };
        return { success: false, error: error.message };
    }
    revalidatePath("/master/dokter");
    return { success: true };
}

export async function deleteDoctor(id: string) {
    const { error } = await supabaseAdmin.from("doctors").delete().eq("id", id);
    if (error) return { success: false, error: error.message };
    revalidatePath("/master/dokter");
    return { success: true };
}

export async function downloadDoctorTemplate() {
    try {
        const wb = XLSX.utils.book_new();
        const wsData = [
            ["nama", "nip", "nik", "spesialisasi", "tipe", "status", "ptkp", "bank", "nomor_rekening", "nama_pemilik_rekening"],
            ["dr. Ahmad Syaifuddin, Sp.PD", "198501012010011001", "3201010101010001", "Spesialis Penyakit Dalam", "SPESIALIS", "PNS", "K/1", "BRI", "0123456789", "Ahmad Syaifuddin"],
            ["dr. Siti Aminah, Sp.OG", "", "3201010101010002", "Spesialis Kandungan", "SPESIALIS", "BLUD", "TK/0", "BNI", "9876543210", "Siti Aminah"],
        ];
        const ws = XLSX.utils.aoa_to_sheet(wsData);
        XLSX.utils.book_append_sheet(wb, ws, "Template Dokter");
        const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });
        return { success: true, data: Array.from(new Uint8Array(buf)), filename: "template_master_dokter.xlsx" };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function importDoctors(fileData: number[]) {
    try {
        const workbook = XLSX.read(Buffer.from(fileData), { type: "buffer" });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const rawRows: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1 });

        if (rawRows.length < 2) return { success: false, error: "File kosong" };

        const headers = rawRows[0].map((h: any) => String(h || "").trim().toLowerCase());
        const dataRows = rawRows.slice(1);

        const colMap: Record<string, number> = {};
        const variations: Record<string, string[]> = {
            name: ["nama", "nama dokter", "name", "doctor_name"],
            nip: ["nip", "nomor induk pegawai"],
            nik: ["nik", "nomor induk kependudukan", "no. ktp"],
            specialization: ["spesialisasi", "spesialis", "specialization"],
            type: ["tipe", "jenis", "type", "dokter_type"],
            status: ["status", "kepegawaian"],
            ptkp: ["ptkp"],
            bank: ["bank"],
            account_number: ["nomor_rekening", "no. rekening", "account_number"],
            bank_account_name: ["nama_pemilik_rekening", "nama rekening", "bank_account_name"],
        };

        Object.keys(variations).forEach(key => {
            colMap[key] = headers.findIndex(h => variations[key].includes(h) || h === key);
        });

        if (colMap.name === -1 || colMap.nik === -1) {
            return { success: false, error: "Kolom Nama dan NIK wajib ada (gunakan template)." };
        }

        const payload = dataRows.map((r, i) => {
            const getField = (key: string) => colMap[key] !== -1 ? r[colMap[key]] : null;

            return {
                name: String(getField("name") || ""),
                nip: getField("nip") ? String(getField("nip")) : null,
                nik: String(getField("nik") || ""),
                specialization: String(getField("specialization") || "Umum"),
                type: String(getField("type") || "SPESIALIS").toUpperCase(),
                status: String(getField("status") || "PNS").toUpperCase(),
                ptkp: String(getField("ptkp") || "TK/0"),
                bank: getField("bank") ? String(getField("bank")) : null,
                account_number: getField("account_number") ? String(getField("account_number")) : null,
                bank_account_name: getField("bank_account_name") ? String(getField("bank_account_name")) : null,
                is_active: true,
            };
        }).filter(r => r.name && r.nik);

        if (payload.length === 0) return { success: false, error: "Tidak ada data valid untuk di-import" };

        const { error } = await supabaseAdmin
            .from("doctors")
            .upsert(payload, { onConflict: "nik" });

        if (error) return { success: false, error: error.message };

        revalidatePath("/master/dokter");
        return { success: true, count: payload.length };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}
