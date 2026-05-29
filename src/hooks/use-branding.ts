"use client"

import { useState, useEffect } from "react"
import { getAppBranding } from "@/app/settings/actions"

export function useBranding() {
    const [branding, setBranding] = useState({
        hospitalName: "RSUD Dr. Soegiri",
        govtName: "Pemerintah Kabupaten Lamongan",
        footerText: "© 2026 RSUD Dr. Soegiri — Sistem Jasa Pelayanan Medis",
        logoUrl: ""
    })

    useEffect(() => {
        let mounted = true

        const fetchData = async () => {
            try {
                const data = await getAppBranding()
                if (mounted) setBranding(data)
            } catch (e) {
                console.error("Failed to fetch branding", e)
            }
        }

        fetchData()

        const handleBrandingUpdate = () => fetchData()
        window.addEventListener("brandingUpdated", handleBrandingUpdate)

        return () => {
            mounted = false
            window.removeEventListener("brandingUpdated", handleBrandingUpdate)
        }
    }, [])

    return branding
}
