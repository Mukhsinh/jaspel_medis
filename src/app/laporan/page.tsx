"use client";

import { useState, useEffect, useMemo } from "react";
import { ChartWrapper } from "@/components/ui/chart-wrapper";

import DashboardLayout from "@/components/layout/dashboard-layout";
import { Button } from "@/components/ui/button";
import { FileText, Download, Calendar, Loader2, Search, BarChart3, ArrowUpRight } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getReportsData, generateReport } from "./actions";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";

function fmt(v: number) {
    if (!v) return "Rp 0";
    if (v >= 1e9) return `Rp ${(v / 1e9).toFixed(1)}M`;
    if (v >= 1e6) return `Rp ${(v / 1e6).toFixed(0)}jt`;
    return `Rp ${v.toLocaleString("id-ID")}`;
}

const statusMap: Record<string, { label: string; cls: string }> = {
    DRAFT: { label: "Draft", cls: "bg-slate-100 text-slate-600" },
    VERIFIED: { label: "Verified", cls: "bg-blue-50 text-blue-700" },
    APPROVED_KABID: { label: "Approved", cls: "bg-emerald-50 text-emerald-700" },
    APPROVED_DIREKTUR: { label: "Final", cls: "bg-violet-50 text-violet-700" },
    FINAL_LOCKED: { label: "Locked", cls: "bg-slate-900 text-white" },
};

export default function LaporanPage() {
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<any>(null);
    const [searchTerm, setSearchTerm] = useState("");

    const fetchData = async () => {
        setLoading(true);
        const result = await getReportsData();
        if (result.success) setData(result.data);
        else toast.error(result.error);
        setLoading(false);
    };

    useEffect(() => { fetchData(); }, []);

    const handleGenerate = async (periodId: string) => {
        const result = await generateReport(periodId);
        if (result.success) toast.success("Laporan berhasil di-generate");
        else toast.error(result.message || "Gagal generate laporan");
    };

    const periods = data?.periods ?? [
        { id: "1", month: 1, year: 2026, status: "FINAL_LOCKED", totalIncentive: 198500000 },
        { id: "2", month: 2, year: 2026, status: "FINAL_LOCKED", totalIncentive: 205300000 },
        { id: "3", month: 3, year: 2026, status: "APPROVED_DIREKTUR", totalIncentive: 189700000 },
        { id: "4", month: 4, year: 2026, status: "VERIFIED", totalIncentive: 212568000 },
        { id: "5", month: 5, year: 2026, status: "DRAFT", totalIncentive: 0 },
    ];

    const months = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Ags", "Sep", "Okt", "Nov", "Des"];

    const trendOptions = useMemo(() => ({
        chart: { type: "bar", toolbar: { show: false }, animations: { enabled: false } },
        colors: ["#3b82f6", "#10b981"],
        plotOptions: { bar: { borderRadius: 6, columnWidth: "45%", dataLabels: { position: "top" } } },
        dataLabels: { enabled: false },
        xaxis: { categories: periods.map((p: any) => months[p.month - 1] + " " + p.year), axisBorder: { show: false }, axisTicks: { show: false } },
        yaxis: { labels: { formatter: (v: number) => fmt(v) } },
        grid: { borderColor: "#f1f5f9", strokeDashArray: 4 },
        tooltip: { y: { formatter: (v: number) => fmt(v) } },
    }), [periods]);

    const trendSeries = useMemo(() => [{ name: "Total Insentif", data: periods.map((p: any) => p.totalIncentive) }], [periods]);

    const totalAll = periods.reduce((a: number, p: any) => a + p.totalIncentive, 0);
    const finalized = periods.filter((p: any) => p.status === "FINAL_LOCKED" || p.status === "APPROVED_DIREKTUR").length;

    const filtered = periods.filter((p: any) => {
        const label = `${months[p.month - 1]} ${p.year}`;
        return label.toLowerCase().includes(searchTerm.toLowerCase());
    });

    return (
        <DashboardLayout>
            <div className="space-y-6">
                {/* Page Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <span className="h-5 w-1 rounded-full bg-gradient-to-b from-blue-600 to-indigo-600 inline-block" />
                            <span className="text-xs font-bold text-blue-600 uppercase tracking-widest">Output & Laporan</span>
                        </div>
                        <h1 className="text-2xl font-black tracking-tight text-slate-900">Laporan Distribusi</h1>
                        <p className="text-sm text-slate-500 font-medium mt-1">Rekap historis periode payroll dan tren insentif jasa pelayanan.</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button variant="outline" className="gap-2 rounded-xl border-slate-200 text-slate-700 font-semibold h-9">
                            <Calendar className="h-3.5 w-3.5" /> Filter Periode
                        </Button>
                        <Button className="gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold h-9 shadow-md shadow-blue-200 hover:opacity-90">
                            <Download className="h-3.5 w-3.5" /> Export Excel
                        </Button>
                    </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {[
                        { title: "Total Periode", value: periods.length.toString(), icon: Calendar, gradient: "from-blue-500 to-indigo-600" },
                        { title: "Periode Finalized", value: finalized.toString(), icon: FileText, gradient: "from-emerald-500 to-teal-600" },
                        { title: "Total Distribusi", value: fmt(totalAll), icon: BarChart3, gradient: "from-violet-500 to-purple-600" },
                        { title: "Rata-rata/Periode", value: fmt(periods.length ? Math.round(totalAll / periods.length) : 0), icon: ArrowUpRight, gradient: "from-orange-500 to-red-500" },
                    ].map((s, i) => (
                        <div key={i} className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
                            <div className={`flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br ${s.gradient} shadow-md mb-3`}>
                                <s.icon className="h-4 w-4 text-white" />
                            </div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.1em]">{s.title}</p>
                            <p className="text-xl font-black text-slate-900 mt-1">{s.value}</p>
                        </div>
                    ))}
                </div>

                {/* Chart + Table */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                    {/* Trend Chart */}
                    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
                        <h2 className="text-base font-bold text-slate-900 mb-1">Tren Distribusi</h2>
                        <p className="text-sm text-slate-400 font-medium mb-4">Perbandingan total insensif per bulan.</p>
                        <ChartWrapper options={trendOptions} series={trendSeries} type="bar" height={260} />
                    </div>

                    {/* Table */}
                    <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                        <div className="flex items-center justify-between gap-4 px-5 py-4 border-b border-slate-100">
                            <h2 className="text-base font-bold text-slate-900">Riwayat Periode Payroll</h2>
                            <div className="relative w-52">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                                <Input
                                    placeholder="Cari periode..."
                                    value={searchTerm}
                                    onChange={e => setSearchTerm(e.target.value)}
                                    className="pl-9 h-9 rounded-xl border-slate-200 bg-slate-50 text-sm"
                                />
                            </div>
                        </div>

                        {loading ? (
                            <div className="flex items-center justify-center py-20 gap-3">
                                <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
                                <span className="text-sm text-slate-400 font-medium">Memuat data laporan...</span>
                            </div>
                        ) : (
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-slate-50/60 hover:bg-slate-50">
                                        <TableHead className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Periode</TableHead>
                                        <TableHead className="text-[10px] font-black text-slate-400 uppercase tracking-wider text-right">Total Insentif</TableHead>
                                        <TableHead className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Status</TableHead>
                                        <TableHead />
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filtered.map((p: any) => {
                                        const st = statusMap[p.status] ?? statusMap.DRAFT;
                                        return (
                                            <TableRow key={p.id} className="hover:bg-blue-50/20 transition-colors group">
                                                <TableCell>
                                                    <div className="flex items-center gap-2.5">
                                                        <div className="h-8 w-8 rounded-lg bg-slate-100 flex items-center justify-center">
                                                            <Calendar className="h-3.5 w-3.5 text-slate-500" />
                                                        </div>
                                                        <span className="text-sm font-bold text-slate-800">
                                                            {months[p.month - 1]} {p.year}
                                                        </span>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-right text-sm font-black text-slate-900">
                                                    {p.totalIncentive > 0 ? fmt(p.totalIncentive) : "—"}
                                                </TableCell>
                                                <TableCell>
                                                    <span className={`inline-flex items-center text-[10px] font-black px-2.5 py-1 rounded-lg ${st.cls}`}>
                                                        {st.label}
                                                    </span>
                                                </TableCell>
                                                <TableCell>
                                                    <button
                                                        onClick={() => handleGenerate(p.id)}
                                                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-slate-500 hover:text-blue-700 hover:bg-blue-50 transition-all opacity-0 group-hover:opacity-100"
                                                    >
                                                        <Download className="h-3 w-3" /> Generate
                                                    </button>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })}
                                </TableBody>
                            </Table>
                        )}
                        <div className="flex items-center justify-between px-5 py-3 border-t border-slate-100 bg-slate-50/40">
                            <p className="text-xs text-slate-400 font-medium">{filtered.length} periode ditampilkan</p>
                            <p className="text-xs font-black text-slate-700">Akumulasi: {fmt(totalAll)}</p>
                        </div>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}
