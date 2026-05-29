"use server"

import { supabaseAdmin } from "@/lib/supabase"

export async function getReportsData() {
    try {
        const { data: periods, error } = await supabaseAdmin
            .from('payroll_periods')
            .select('*')
            .order('year', { ascending: false })
            .order('month', { ascending: false });

        if (error) throw error;

        // Get counts for each period
        const formattedReports = await Promise.all((periods || []).map(async (p: any) => {
            const { count: slipCount } = await supabaseAdmin
                .from('incentive_slips')
                .select('id', { count: 'exact', head: true })
                .eq('period_id', p.id);

            return {
                id: p.id.substring(0, 8).toUpperCase(),
                title: `Laporan Distribusi Jaspel - ${getMonthName(p.month)} ${p.year}`,
                type: "Distribusi",
                date: new Date(p.updated_at).toLocaleDateString('id-ID'),
                status: p.status,
                incentiveCount: slipCount || 0
            };
        }));

        const trendData = (periods || []).slice(0, 5).reverse().map((p: any) => ({
            month: getMonthName(p.month).substring(0, 3),
            amount: Number(p.total_incentive) / 1000000
        }));

        return {
            success: true,
            data: {
                reports: formattedReports,
                trend: {
                    categories: trendData.map((t: any) => t.month),
                    series: [{ name: "Total Distribusi", data: trendData.map((t: any) => t.amount) }]
                }
            }
        }
    } catch (error) {
        console.error("Failed to fetch reports data:", error)
        return { success: false, error: "Gagal mengambil data laporan" }
    }
}

function getMonthName(month: number) {
    const months = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
    return months[month - 1] || "Unknown";
}

export async function generateReport(periodId: string) {
    // Placeholder for actual PDF generation logic
    return { success: true, message: "Laporan sedang dihasilkan..." }
}
