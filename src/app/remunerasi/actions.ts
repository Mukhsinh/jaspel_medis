"use server"

import { supabaseAdmin } from "@/lib/supabase"
import { revalidatePath } from "next/cache"

export async function getRemunerationData() {
    try {
        const { data: doctors, error: dError } = await supabaseAdmin
            .from("doctors")
            .select(`
                *,
                scores:remuneration_scores(
                    *,
                    indicatorScores:remuneration_indicator_scores(*)
                )
            `)
            .order("name", { ascending: true });

        if (dError) throw dError;

        const { data: indicators, error: iError } = await supabaseAdmin
            .from("remuneration_indicators")
            .select("*")
            .order("created_at", { ascending: true });

        if (iError) throw iError;

        return { success: true, data: { doctors, indicators } }
    } catch (error) {
        console.error("Failed to fetch remuneration data:", error)
        return { success: false, error: "Gagal mengambil data remunerasi" }
    }
}

export async function updateRemunerationScore(params: {
    doctorId: string,
    p1: number,
    p2: number,
    p3: number,
    indicatorScores?: { indicatorId: string, value: number }[]
}) {
    try {
        const { doctorId, p1, p2, p3, indicatorScores } = params;

        // Periode dinamis (Mei 2026 sesuai UI)
        const month = 5;
        const year = 2026;

        // Cari atau buat PayrollPeriod
        let { data: period, error: pError } = await supabaseAdmin
            .from("payroll_periods")
            .select("id")
            .eq("month", month)
            .eq("year", year)
            .single();

        if (!period) {
            const { data: newPeriod, error: npError } = await supabaseAdmin
                .from("payroll_periods")
                .insert({ month, year, total_incentive: 0, conversion_factor: 0 })
                .select("id")
                .single();
            if (npError) throw npError;
            period = newPeriod;
        }

        // Hitung total indeks: P1=30, P2=50, P3=20
        const totalIndex = (p1 * 0.3) + (p2 * 0.5) + (p3 * 0.2);

        // Upsert RemunerationScore
        const { data: score, error: sError } = await supabaseAdmin
            .from("remuneration_scores")
            .upsert({
                doctor_id: doctorId,
                period_id: period.id,
                p1, p2, p3,
                total_index: totalIndex,
                updated_at: new Date().toISOString()
            }, { onConflict: "doctor_id,period_id" })
            .select("id")
            .single();

        if (sError) throw sError;

        // Save individual indicator scores
        if (indicatorScores && indicatorScores.length > 0) {
            const indPayload = indicatorScores.map(ind => ({
                indicator_id: ind.indicatorId,
                score_id: score.id,
                value: ind.value
            }));

            const { error: insError } = await supabaseAdmin
                .from("remuneration_indicator_scores")
                .upsert(indPayload, { onConflict: "indicator_id,score_id" });

            if (insError) throw insError;
        }

        revalidatePath("/remunerasi");
        return { success: true };
    } catch (error: any) {
        console.error("Failed to update remuneration score:", error)
        return { success: false, error: error.message || "Gagal menyimpan skor remunerasi" }
    }
}

export async function batchCalculateRemuneration() {
    try {
        const { data: scores, error: sError } = await supabaseAdmin
            .from("remuneration_scores")
            .select("*");

        if (sError) throw sError;

        for (const score of scores) {
            const p1 = Number(score.p1 || 0);
            const p2 = Number(score.p2 || 0);
            const p3 = Number(score.p3 || 0);

            const totalIndex = (p1 * 0.3) + (p2 * 0.5) + (p3 * 0.2);

            await supabaseAdmin
                .from("remuneration_scores")
                .update({ total_index: totalIndex, updated_at: new Date().toISOString() })
                .eq("id", score.id);
        }

        revalidatePath("/remunerasi")
        return { success: true }
    } catch (error) {
        return { success: false, error: "Gagal melakukan kalkulasi massal" }
    }
}
