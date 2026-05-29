"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
const ReactApexChart = dynamic(() => import("react-apexcharts"), { ssr: false });

import DashboardLayout from "@/components/layout/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
    BarChart3,
    TrendingDown,
    TrendingUp,
    AlertTriangle,
    Info,
    Calendar,
    MoreHorizontal,
    ArrowRight,
    Target
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@/components/ui/table";

export default function BusinessAnalysisPage() {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    const comparisonData = [
        { diagnosis: "K-02-1 (Bedah Jantung)", claim: 25000000, cost: 22000000, margin: 3000000, status: "Positive" },
        { diagnosis: "M-04-2 (Saraf Ringan)", claim: 8500000, cost: 9200000, margin: -700000, status: "Negative" },
        { diagnosis: "I-05-3 (Persalinan Normal)", claim: 4500000, cost: 4200000, margin: 300000, status: "Positive" },
        { diagnosis: "J-01-1 (Penyakit Paru)", claim: 12000000, cost: 13500000, margin: -1500000, status: "Negative" },
        { diagnosis: "D-03-9 (Tumor Ganas)", claim: 45000000, cost: 38000000, margin: 7000000, status: "Positive" },
    ];

    const chartOptions: any = {
        chart: { type: 'bar', toolbar: { show: false } },
        plotOptions: {
            bar: {
                horizontal: false,
                columnWidth: '55%',
                endingShape: 'rounded',
                borderRadius: 4
            },
        },
        dataLabels: { enabled: false },
        stroke: { show: true, width: 2, colors: ['transparent'] },
        xaxis: {
            categories: ['Bedah', 'Penyakit Dalam', 'Anak', 'Obgyn', 'Saraf', 'Mata'],
        },
        yaxis: {
            title: { text: 'Miliar Rupiah' },
            labels: { formatter: (v: number) => `Rp ${v}M` }
        },
        fill: { opacity: 1 },
        colors: ['#2563eb', '#f43f5e'],
        tooltip: {
            y: { formatter: (val: number) => `Rp ${val} Miliar` }
        },
        grid: { borderColor: '#f1f5f9' },
        legend: { position: 'top', horizontalAlign: 'right' }
    };

    const chartSeries = [
        { name: 'Rata-rata Klaim', data: [44, 55, 41, 67, 22, 43] },
        { name: 'Rata-rata Biaya', data: [36, 61, 38, 58, 28, 35] }
    ];

    return (
        <DashboardLayout>
            <div className="flex flex-col gap-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Analisa Bisnis & Profitabilitas</h1>
                        <p className="text-slate-500">Evaluasi efisiensi layanan medis berdasakan perbandingan klaim BPJS dan biaya operasional.</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-lg border border-slate-200 shadow-sm text-sm font-semibold">
                            <Calendar className="h-4 w-4 text-blue-600" />
                            <span>Mei 2026</span>
                        </div>
                        <Button className="bg-blue-600 hover:bg-blue-700">Analisa Mendalam</Button>
                    </div>
                </div>

                {/* Insight Highlights */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Card className="border-none shadow-sm shadow-slate-200 bg-emerald-50/50">
                        <CardContent className="p-6">
                            <div className="flex items-center gap-4">
                                <div className="h-12 w-12 rounded-full bg-emerald-100 flex items-center justify-center">
                                    <TrendingUp className="h-6 w-6 text-emerald-600" />
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-emerald-700 uppercase">Margin Tertinggi</p>
                                    <h3 className="text-xl font-bold text-slate-900">K-02-1</h3>
                                    <p className="text-[10px] text-emerald-600 font-semibold">+ Rp 3.000.000 / Pasien</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-none shadow-sm shadow-slate-200 bg-rose-50/50">
                        <CardContent className="p-6">
                            <div className="flex items-center gap-4">
                                <div className="h-12 w-12 rounded-full bg-rose-100 flex items-center justify-center">
                                    <TrendingDown className="h-6 w-6 text-rose-600" />
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-rose-700 uppercase">Resiko Kerugian</p>
                                    <h3 className="text-xl font-bold text-slate-900">M-04-2</h3>
                                    <p className="text-[10px] text-rose-600 font-semibold">- Rp 700.000 / Pasien</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-none shadow-sm shadow-slate-200 bg-blue-50/50">
                        <CardContent className="p-6">
                            <div className="flex items-center gap-4">
                                <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                                    <Target className="h-6 w-6 text-blue-600" />
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-blue-700 uppercase">Efisiensi Rata-rata</p>
                                    <h3 className="text-xl font-bold text-slate-900">84.5%</h3>
                                    <p className="text-[10px] text-blue-600 font-semibold">Tercapai dari target 85%</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Chart Section */}
                    <Card className="border-none shadow-sm shadow-slate-200">
                        <CardHeader>
                            <CardTitle className="text-lg">Komparasi Klaim vs Biaya Per Departemen</CardTitle>
                            <CardDescription>Visualisasi distribusi pendapatan dan biaya sarana.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="h-[320px]">
                                {mounted && (
                                    <ReactApexChart options={chartOptions} series={chartSeries} type="bar" height="100%" />
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Table Section */}
                    <Card className="border-none shadow-sm shadow-slate-200">
                        <CardHeader className="flex flex-row items-center justify-between">
                            <div>
                                <CardTitle className="text-lg">Rincian Komparatif Diagnosa</CardTitle>
                                <CardDescription>Menampilkan diagnosa dengan margin operasional.</CardDescription>
                            </div>
                            <Badge variant="outline" className="text-rose-600 border-rose-200 bg-rose-50 font-bold">
                                2 Diagnosa Negatif
                            </Badge>
                        </CardHeader>
                        <CardContent className="p-0">
                            <Table>
                                <TableHeader className="bg-slate-50/50">
                                    <TableRow>
                                        <TableHead className="px-6">Diagnosa INACBG</TableHead>
                                        <TableHead className="text-right">Klaim</TableHead>
                                        <TableHead className="text-right">Biaya</TableHead>
                                        <TableHead className="text-right px-6">Margin</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {comparisonData.map((item, i) => (
                                        <TableRow key={i} className={item.status === 'Negative' ? 'bg-rose-50/20' : ''}>
                                            <TableCell className="px-6 font-semibold text-slate-700">
                                                {item.diagnosis}
                                                {item.status === 'Negative' && (
                                                    <div className="flex items-center gap-1 mt-1 text-[10px] text-rose-600">
                                                        <AlertTriangle className="h-3 w-3" /> Perlu Evaluasi Biaya (HP)
                                                    </div>
                                                )}
                                            </TableCell>
                                            <TableCell className="text-right font-medium">Rp {item.claim.toLocaleString('id-ID')}</TableCell>
                                            <TableCell className="text-right text-slate-500">Rp {item.cost.toLocaleString('id-ID')}</TableCell>
                                            <TableCell className={`text-right px-6 font-bold ${item.status === 'Negative' ? 'text-rose-600' : 'text-emerald-600'}`}>
                                                {item.margin < 0 ? '-' : '+'} Rp {Math.abs(item.margin).toLocaleString('id-ID')}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                            <div className="p-4 border-t">
                                <Button variant="ghost" size="sm" className="w-full text-slate-500 hover:text-blue-600">
                                    Muat Lebih Banyak Diagnosa <ArrowRight className="h-3 w-3 ml-2" />
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Footer Analysis */}
                <Card className="border-none shadow-sm shadow-slate-200 bg-white border-l-4 border-l-blue-600">
                    <CardContent className="p-6">
                        <div className="flex gap-4">
                            <div className="h-10 w-10 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
                                <Info className="h-5 w-5 text-blue-600" />
                            </div>
                            <div className="space-y-2">
                                <h4 className="text-sm font-bold text-slate-900">Analisa Sistem</h4>
                                <p className="text-xs text-slate-600 leading-relaxed">
                                    Berdasarkan data bulan ini, departemen <strong>Saraf</strong> mengalami defisit rata-rata sebesar <strong>12%</strong> per kasus.
                                    Hal ini disebabkan oleh tingginya penggunaan bahan habis pakai (BHP) pada diagnosa stroke ringan.
                                    Disarankan untuk meninjau kembali Formularium Rumah Sakit agar biaya sarana tetap berada di bawah plafon klaim INACBGs.
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </DashboardLayout>
    );
}
