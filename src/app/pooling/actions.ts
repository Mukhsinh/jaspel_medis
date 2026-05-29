"use server";

import { supabaseAdmin } from "@/lib/supabase";
import { revalidatePath } from "next/cache";

export async function getPoolingConfig(month: number, year: number) {
    const { data, error } = await supabaseAdmin
        .from("pooling_configs")
        .select("*")
        .eq("month", month)
        .eq("year", year)
        .single();

    if (error && error.code !== "PGRST116") {
        return { success: false, error: error.message };
    }

    return {
        success: true,
        data: data ?? {
            month,
            year,
            incentive_pct: 17.00,
            sarana_pct: 40.00,
            medical_pct: 60.00,
            total_revenue: 0,
            total_sarana: 0,
            total_medical_pool: 0,
        },
    };
}

export async function savePoolingConfig(payload: {
    month: number;
    year: number;
    incentive_pct: number;
    sarana_pct: number;
    medical_pct: number;
    total_revenue: number;
    notes?: string;
}) {
    const total_sarana = payload.total_revenue * (payload.sarana_pct / 100);
    const net_revenue = payload.total_revenue - total_sarana;
    const total_medical_pool = net_revenue * (payload.incentive_pct / 100);

    const { data: existing } = await supabaseAdmin
        .from("pooling_configs")
        .select("id")
        .eq("month", payload.month)
        .eq("year", payload.year)
        .single();

    const upsertData = {
        month: payload.month,
        year: payload.year,
        incentive_pct: payload.incentive_pct,
        sarana_pct: payload.sarana_pct,
        medical_pct: payload.medical_pct,
        total_revenue: payload.total_revenue,
        total_sarana,
        total_medical_pool,
        notes: payload.notes ?? null,
        updated_at: new Date().toISOString(),
    };

    let result;
    if (existing) {
        result = await supabaseAdmin
            .from("pooling_configs")
            .update(upsertData)
            .eq("id", existing.id)
            .select()
            .single();
    } else {
        result = await supabaseAdmin
            .from("pooling_configs")
            .insert(upsertData)
            .select()
            .single();
    }

    if (result.error) return { success: false, error: result.error.message };

    revalidatePath("/pooling");
    return { success: true, data: result.data };
}

export async function getPoolingData(month: number, year: number) {
    const { data: config } = await supabaseAdmin
        .from("pooling_configs")
        .select("*")
        .eq("month", month)
        .eq("year", year)
        .single();

    const { data: claims } = await supabaseAdmin
        .from("bpjs_claims")
        .select("*, unit:units(name)")
        .gte("action_date", `${year}-${String(month).padStart(2, "0")}-01`)
        .lt("action_date", month === 12 ? `${year + 1}-01-01` : `${year}-${String(month + 1).padStart(2, "0")}-01`);

    const totalRevenue = config?.total_revenue ?? 0;
    const incentivePct = config?.incentive_pct ?? 17;
    const saranaPct = config?.sarana_pct ?? 40;
    const totalSarana = totalRevenue * (saranaPct / 100);
    const netRevenue = totalRevenue - totalSarana;
    const totalMedicalPool = config?.total_medical_pool ?? netRevenue * (incentivePct / 100);

    // Build unit distribution from claims or units
    const unitMap: Record<string, { name: string; claims: number; pool: number }> = {};
    (claims ?? []).forEach((c: any) => {
        const name = c.unit?.name ?? "Unknown";
        if (!unitMap[name]) unitMap[name] = { name, claims: 0, pool: 0 };
        unitMap[name].claims += 1;
        unitMap[name].pool += Number(c.medical_pool ?? 0);
    });

    const byUnit = Object.values(unitMap).sort((a, b) => b.pool - a.pool);

    return {
        success: true,
        data: {
            config: config ?? null,
            totalRevenue,
            totalSarana,
            netRevenue,
            totalMedicalPool,
            incentivePct,
            saranaPct,
            byUnit,
        },
    };
}

export async function deletePoolingConfig(id: string) {
    const { error } = await supabaseAdmin
        .from("pooling_configs")
        .delete()
        .eq("id", id);

    if (error) return { success: false, error: error.message };
    revalidatePath("/pooling");
    return { success: true };
}

export async function listPoolingConfigs() {
    const { data, error } = await supabaseAdmin
        .from("pooling_configs")
        .select("*")
        .order("year", { ascending: false })
        .order("month", { ascending: false });

    if (error) return { success: false, error: error.message };
    return { success: true, data };
}
