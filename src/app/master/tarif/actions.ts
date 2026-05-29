"use server";

import { supabaseAdmin } from "@/lib/supabase";
import { revalidatePath } from "next/cache";
import * as XLSX from "xlsx";

export async function getTariffs() {
    const { data, error } = await supabaseAdmin
        .from("tariffs")
        .select("*")
        .order("code", { ascending: true });
    if (error) return { success: false, error: error.message, data: [] };
    return { success: true, data: data ?? [] };
}

type TariffPayload = {
    code: string; name: string; category: string;
    base_amount: number;          // tarif total (auto = medis + non_medis + sarana)
    jasa_pelayanan_medis: number;
    jasa_pelayanan_non_medis: number;
    jasa_pelayanan: number;       // total jaspel = medis + non_medis
    jasa_sarana: number;
    jaspel_pct: number;           // medis / tarif_total * 100
    is_active: boolean;
};

export async function createTariff(payload: TariffPayload) {
    const { error } = await supabaseAdmin.from("tariffs").insert(payload);
    if (error) return { success: false, error: error.message };
    revalidatePath("/master/tarif");
    return { success: true };
}

export async function updateTariff(id: string, payload: TariffPayload) {
    const { error } = await supabaseAdmin
        .from("tariffs")
        .update({ ...payload, updated_at: new Date().toISOString() })
        .eq("id", id);
    if (error) return { success: false, error: error.message };
    revalidatePath("/master/tarif");
    return { success: true };
}

export async function deleteTariff(id: string) {
    const { error } = await supabaseAdmin.from("tariffs").delete().eq("id", id);
    if (error) return { success: false, error: error.message };
    revalidatePath("/master/tarif");
    return { success: true };
}

export async function importTariffs(fileData: number[]) {
    try {
        const workbook = XLSX.read(Buffer.from(fileData), { type: "buffer" });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const rawRows: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1 });

        if (rawRows.length < 2) return { success: false, error: "File tidak berisi data" };

        const headers = rawRows[0].map((h: any) => String(h || "").trim().toLowerCase());
        const dataRows = rawRows.slice(1).filter(r => r.some(c => c !== ""));

        const variations: Record<string, string[]> = {
            code: ["code", "kode", "kode_tarif", "kode tarif", "id"],
            name: ["name", "nama", "nama_tindakan", "nama tindakan", "tindakan"],
            category: ["category", "kategori", "unit", "ruangan"],
            jasa_pelayanan_medis: ["jasa_pelayanan_medis", "medis", "jp_medis", "jasa medis"],
            jasa_pelayanan_non_medis: ["jasa_pelayanan_non_medis", "non_medis", "jp_non_medis", "jasa non-medis"],
            jasa_sarana: ["jasa_sarana", "sarana", "js", "tarif sarana"],
        };

        const colMap: Record<string, number> = {};
        Object.keys(variations).forEach(key => {
            colMap[key] = headers.findIndex(h => variations[key].includes(h) || h === key);
        });

        if (colMap.code === -1 || colMap.name === -1) {
            return { success: false, error: "Kolom Kode dan Nama wajib ada." };
        }

        const payload = dataRows.map(r => {
            const getNum = (key: string) => {
                const idx = colMap[key];
                if (idx === -1 || r[idx] === undefined) return 0;
                const v = r[idx];
                if (typeof v === "number") return v;
                return parseFloat(String(v).replace(/[^0-9.-]/g, "")) || 0;
            };

            const getStr = (key: string) => {
                const idx = colMap[key];
                return idx !== -1 ? String(r[idx] || "").trim() : "";
            };

            const jp_medis = getNum("jasa_pelayanan_medis");
            const jp_non_medis = getNum("jasa_pelayanan_non_medis");
            const js = getNum("jasa_sarana");

            const total_jp = jp_medis + jp_non_medis;
            const tarif_total = total_jp + js;

            return {
                code: getStr("code"),
                name: getStr("name"),
                category: getStr("category") || "Umum",
                base_amount: tarif_total,
                jasa_pelayanan_medis: jp_medis,
                jasa_pelayanan_non_medis: jp_non_medis,
                jasa_pelayanan: total_jp,
                jasa_sarana: js,
                jaspel_pct: tarif_total > 0 ? (jp_medis / tarif_total) * 100 : 0,
                is_active: true,
            };
        }).filter(r => r.code && r.name);

        const { error } = await supabaseAdmin
            .from("tariffs")
            .upsert(payload, { onConflict: "code" });

        if (error) return { success: false, error: error.message };

        revalidatePath("/master/tarif");
        return { success: true, count: payload.length };
    } catch (err: any) {
        return { success: false, error: err.message };
    }
}
