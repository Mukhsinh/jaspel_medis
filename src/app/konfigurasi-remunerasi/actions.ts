"use server";

import { supabaseAdmin } from "@/lib/supabase";
import { revalidatePath } from "next/cache";

export async function getRemunerationConfig() {
    const { data, error } = await supabaseAdmin
        .from("remuneration_configs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

    if (error && error.code !== "PGRST116") {
        return { success: false, error: error.message };
    }

    return { success: true, data: data ?? null };
}

export async function saveRemunerationConfig(payload: {
    p1_weight: number;
    p2_weight: number;
    p3_weight: number;
    p1_education: number;
    p1_position: number;
    p1_competency: number;
    p1_certification: number;
    p2_volume: number;
    p2_productivity: number;
    p2_logbook: number;
    p3_attendance: number;
    p3_discipline: number;
    p3_managerial: number;
    p3_strategic: number;
    conversion_base: number;
    notes?: string;
}) {
    const { data: existing } = await supabaseAdmin
        .from("remuneration_configs")
        .select("id")
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

    const upsertData = {
        ...payload,
        updated_at: new Date().toISOString(),
    };

    let result;
    if (existing) {
        result = await supabaseAdmin
            .from("remuneration_configs")
            .update(upsertData)
            .eq("id", existing.id)
            .select()
            .single();
    } else {
        result = await supabaseAdmin
            .from("remuneration_configs")
            .insert(upsertData)
            .select()
            .single();
    }

    if (result.error) return { success: false, error: result.error.message };

    revalidatePath("/konfigurasi-remunerasi");
    return { success: true, data: result.data };
}

export async function listIndicators() {
    const { data, error } = await supabaseAdmin
        .from("remuneration_indicators")
        .select(`
            *,
            measurements:remuneration_measurements(*)
        `)
        .order("created_at", { ascending: true });

    if (error) return { success: false, error: error.message };
    return { success: true, data };
}

export async function saveIndicator(payload: { id?: string; name: string; weight: number }) {
    let result;
    if (payload.id) {
        result = await supabaseAdmin
            .from("remuneration_indicators")
            .update({ name: payload.name, weight: payload.weight, updated_at: new Date().toISOString() })
            .eq("id", payload.id)
            .select()
            .single();
    } else {
        result = await supabaseAdmin
            .from("remuneration_indicators")
            .insert({ name: payload.name, weight: payload.weight })
            .select()
            .single();
    }

    if (result.error) return { success: false, error: result.error.message };
    revalidatePath("/konfigurasi-remunerasi");
    return { success: true, data: result.data };
}

export async function deleteIndicator(id: string) {
    const { error } = await supabaseAdmin
        .from("remuneration_indicators")
        .delete()
        .eq("id", id);

    if (error) return { success: false, error: error.message };
    revalidatePath("/konfigurasi-remunerasi");
    return { success: true };
}

export async function saveMeasurement(payload: {
    id?: string;
    indicatorId: string;
    name: string;
    method: string;
    weight: number;
    minValue?: number;
    maxValue?: number;
}) {
    const data = {
        indicatorId: payload.indicatorId,
        name: payload.name,
        method: payload.method,
        weight: payload.weight,
        minValue: payload.minValue,
        maxValue: payload.maxValue,
        updated_at: new Date().toISOString()
    };

    let result;
    if (payload.id) {
        result = await supabaseAdmin
            .from("remuneration_measurements")
            .update(data)
            .eq("id", payload.id)
            .select()
            .single();
    } else {
        result = await supabaseAdmin
            .from("remuneration_measurements")
            .insert(data)
            .select()
            .single();
    }

    if (result.error) return { success: false, error: result.error.message };
    revalidatePath("/konfigurasi-remunerasi");
    return { success: true, data: result.data };
}

export async function deleteMeasurement(id: string) {
    const { error } = await supabaseAdmin
        .from("remuneration_measurements")
        .delete()
        .eq("id", id);

    if (error) return { success: false, error: error.message };
    revalidatePath("/konfigurasi-remunerasi");
    return { success: true };
}
