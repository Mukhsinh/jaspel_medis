"use server"

import { supabaseAdmin } from "@/lib/supabase"
import { revalidatePath } from "next/cache"

export interface AppSettings {
    hospitalName: string
    govtName: string
    province: string
    address: string
    phone: string
    email: string
    footerText: string
    logoUrl: string
    poolPercent: number
    p1Weight: number
    p2Weight: number
    p3Weight: number
}

const DEFAULTS: AppSettings = {
    hospitalName: "RSUD Dr. Soegiri",
    govtName: "Pemerintah Kabupaten Lamongan",
    province: "Jawa Timur",
    address: "",
    phone: "",
    email: "",
    footerText: "© 2026 RSUD Dr. Soegiri — Sistem Jasa Pelayanan Medis",
    logoUrl: "",
    poolPercent: 17,
    p1Weight: 25,
    p2Weight: 55,
    p3Weight: 20,
}

async function upsertSetting(key: string, value: any) {
    const valString = typeof value === 'string' ? value : JSON.stringify(value);

    // Check if the key already exists
    const { data: existing } = await supabaseAdmin
        .from('app_settings')
        .select('id')
        .eq('key', key)
        .maybeSingle();

    if (existing) {
        // Update existing record
        const { error } = await supabaseAdmin
            .from('app_settings')
            .update({ value: valString, updated_at: new Date().toISOString() })
            .eq('key', key);
        if (error) throw new Error(`Failed to update setting "${key}": ${error.message}`);
    } else {
        // Insert new record
        const { error } = await supabaseAdmin
            .from('app_settings')
            .insert({ key, value: valString });
        if (error) throw new Error(`Failed to insert setting "${key}": ${error.message}`);
    }
}

export async function getSettings(): Promise<{ success: boolean; data: AppSettings }> {
    try {
        const settings: AppSettings = { ...DEFAULTS }

        const { data: allSettings, error } = await supabaseAdmin
            .from('app_settings')
            .select('key, value');

        if (error) {
            console.error("Failed to fetch settings:", error.message);
            return { success: true, data: DEFAULTS }
        }

        if (allSettings) {
            const settingsMap = new Map(allSettings.map((s: { key: string, value: string }) => [s.key, s.value]));

            for (const key of Object.keys(DEFAULTS) as (keyof AppSettings)[]) {
                const val = settingsMap.get(key);
                if (val !== undefined && val !== null) {
                    try {
                        (settings as any)[key] = JSON.parse(val as string);
                    } catch {
                        (settings as any)[key] = val;
                    }
                }
            }
        }
        return { success: true, data: settings }
    } catch (e: any) {
        console.error("getSettings error:", e);
        return { success: true, data: DEFAULTS }
    }
}

export async function updateSettings(newSettings: AppSettings): Promise<{ success: boolean; error?: string }> {
    try {
        for (const [key, value] of Object.entries(newSettings)) {
            await upsertSetting(key, value);
        }
        revalidatePath("/settings")
        revalidatePath("/dashboard")
        revalidatePath("/", "layout") // Revalidate global branding
        return { success: true }
    } catch (e: any) {
        console.error("updateSettings error:", e);
        return { success: false, error: e.message || "Gagal menyimpan pengaturan" }
    }
}

export async function uploadLogo(formData: FormData): Promise<{ success: boolean; url?: string; error?: string }> {
    try {
        const file = formData.get("logo") as File
        if (!file) return { success: false, error: "Tidak ada file" }

        const ext = file.name.split(".").pop()?.toLowerCase() || "png"
        const filename = `logo_rs.${ext}`

        // Upload to Supabase Storage
        const buffer = Buffer.from(await file.arrayBuffer())

        // Try creating bucket first (ignore if exists)
        await supabaseAdmin.storage.createBucket("public-assets", { public: true }).catch(() => { })

        const { error: uploadError } = await supabaseAdmin.storage
            .from("public-assets")
            .upload(filename, buffer, {
                contentType: file.type,
                upsert: true,
            })

        if (uploadError) {
            return { success: false, error: uploadError.message }
        }

        const { data: urlData } = supabaseAdmin.storage.from("public-assets").getPublicUrl(filename)
        const publicUrl = urlData.publicUrl

        // Save URL to settings via Supabase
        await upsertSetting("logoUrl", publicUrl)
        revalidatePath("/settings")

        return { success: true, url: publicUrl }
    } catch (e: any) {
        return { success: false, error: e.message }
    }
}

// Quick getter for layout components (non-form)
export async function getAppBranding(): Promise<{
    hospitalName: string; govtName: string; footerText: string; logoUrl: string
}> {
    try {
        const { data: allSettings } = await supabaseAdmin
            .from('app_settings')
            .select('key, value')
            .in('key', ['hospitalName', 'govtName', 'footerText', 'logoUrl']);

        const settingsMap = new Map((allSettings || []).map((s: { key: string, value: string }) => [s.key, s.value]));

        const parseVal = (key: string, fallback: string): string => {
            const val = settingsMap.get(key);
            if (val !== undefined && val !== null) {
                try { return JSON.parse(val); } catch { return val; }
            }
            return fallback;
        };

        return {
            hospitalName: parseVal("hospitalName", DEFAULTS.hospitalName),
            govtName: parseVal("govtName", DEFAULTS.govtName),
            footerText: parseVal("footerText", DEFAULTS.footerText),
            logoUrl: parseVal("logoUrl", ""),
        }
    } catch {
        return {
            hospitalName: DEFAULTS.hospitalName,
            govtName: DEFAULTS.govtName,
            footerText: DEFAULTS.footerText,
            logoUrl: ""
        }
    }
}
