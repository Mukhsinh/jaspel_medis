"use server"

import { revalidatePath } from "next/cache"

// Mock persistence for settings since no table exists yet
// In a real scenario, this would save to a 'settings' table or a JSON file
let globalSettings = {
    hospitalName: "RSUD Dr. Soegiri",
    province: "Jawa Timur",
    poolPercent: 17,
    p1Weight: 25,
    p2Weight: 55,
    p3Weight: 20,
}

export async function getSettings() {
    return { success: true, data: globalSettings }
}

export async function updateSettings(newSettings: typeof globalSettings) {
    try {
        globalSettings = { ...newSettings }
        revalidatePath("/settings")
        return { success: true }
    } catch (error) {
        return { success: false, error: "Gagal menyimpan pengaturan" }
    }
}
