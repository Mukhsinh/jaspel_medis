"use server"

import { prisma } from "@/lib/prisma"

export async function getReportsData() {
    try {
        const periods = await prisma.payrollPeriod.findMany({
            orderBy: [
                { year: 'desc' },
                { month: 'desc' }
            ],
            include: {
                _count: {
                    select: { scores: true, incentiveSlips: true }
                }
            }
        })

        const formattedReports = periods.map(p => ({
            id: p.id.substring(0, 8).toUpperCase(),
            title: `Laporan Distribusi Jaspel - ${getMonthName(p.month)} ${p.year}`,
            type: "Distribusi",
            date: p.updatedAt.toLocaleDateString('id-ID'),
            status: p.status,
            incentiveCount: p._count.incentiveSlips
        }))

        // Mock trend for now but can be derived from totalIncentive
        const trendData = periods.slice(0, 5).reverse().map(p => ({
            month: getMonthName(p.month).substring(0, 3),
            amount: Number(p.totalIncentive) / 1000000
        }))

        return {
            success: true,
            data: {
                reports: formattedReports,
                trend: {
                    categories: trendData.map(t => t.month),
                    series: [{ name: "Total Distribusi", data: trendData.map(t => t.amount) }]
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
