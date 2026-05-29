"use server";

import { supabaseAdmin } from "@/lib/supabase";
import { revalidatePath } from "next/cache";

export async function getUnits() {
    const { data, error } = await supabaseAdmin
        .from("units")
        .select("*")
        .order("name", { ascending: true });
    if (error) return [];
    // Normalize snake_case ke camelCase untuk kompatibilitas dengan interface
    return (data ?? []).map((u: any) => ({
        id: u.id,
        name: u.name,
        installation: u.installation,
        room: u.room ?? null,
        createdAt: u.created_at,
        updatedAt: u.updated_at,
    }));
}

export async function createUnit(data: { name: string; installation: string; room?: string }) {
    const { error } = await supabaseAdmin.from("units").insert({
        name: data.name,
        installation: data.installation,
        room: data.room || null,
    });
    if (error) return { success: false, error: error.message };
    revalidatePath("/master/unit");
    return { success: true };
}

export async function updateUnit(id: string, data: { name: string; installation: string; room?: string }) {
    const { error } = await supabaseAdmin.from("units").update({
        name: data.name,
        installation: data.installation,
        room: data.room || null,
        updated_at: new Date().toISOString(),
    }).eq("id", id);
    if (error) return { success: false, error: error.message };
    revalidatePath("/master/unit");
    return { success: true };
}

export async function deleteUnit(id: string) {
    const { error } = await supabaseAdmin.from("units").delete().eq("id", id);
    if (error) return { success: false, error: error.message };
    revalidatePath("/master/unit");
    return { success: true };
}
