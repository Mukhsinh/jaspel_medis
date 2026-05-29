"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";

const ReactApexChart = dynamic(() => import("react-apexcharts"), { ssr: false });

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
    Activity,
    ArrowUpRight,
    ArrowDownRight,
    Users,
    Coins,
    Stethoscope,
    TrendingUp
} from "lucide-react";
import DashboardLayout from "@/components/layout/dashboard-layout";

export default function DashboardPage() {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    const statCards = [
        {
            title: "Total Klaim BPJS",
            value: "Rp 1.250.400.000",
            description: "+12.5% vs bulan lalu",
            icon: Coins,
            trend: "up",
            gradient: "from-blue-600 to-indigo-600",
            accent: "text-blue-600",
        },
        {
            title: "Alokasi Jasa Medis (17%)",
            value: "Rp 212.568.000",
            description: "Periode Mei 2026",
            icon: Activity,
            trend: "up",
            gradient: "from-emerald-600 to-teal-600",
            accent: "text-emerald-600",
        },
        {
            title: "Total Dokter Aktif",
            value: "142",
            description: "Spesialis & Umum",
            icon: Stethoscope,
            trend: "neutral",
            gradient: "from-violet-600 to-purple-600",
            accent: "text-purple-600",
        },
        {
            title: "Pajak PPh 21 (TER)",
            value: "Rp 18.245.000",
            description: "Estimasi bulan ini",
            icon: ArrowUpRight,
            trend: "down",
            gradient: "from-orange-500 to-red-500",
            accent: "text-orange-600",
        },
    ];

    const chartOptions: any = {
        chart: {
            type: 'area',
            toolbar: { show: false },
            zoom: { enabled: false }
        },
        colors: ['#2563eb', '#10b981'],
        dataLabels: { enabled: false },
        stroke: { curve: 'smooth', width: 2 },
        xaxis: {
            categories: ['Jan', 'Feb', 'Mar', 'Apr', 'Mei'],
            axisBorder: { show: false },
            axisTicks: { show: false }
        },
        yaxis: {
            labels: {
                formatter: (val: number) => `Rp ${(val / 1000000).toFixed(0)}jt`
            }
        },
        grid: {
            borderColor: '#f1f5f9',
            strokeDashArray: 4
        },
        fill: {
            type: 'gradient',
            gradient: {
                shadeIntensity: 1,
                opacityFrom: 0.45,
                opacityTo: 0.05,
                stops: [20, 100, 100, 100]
            }
        }
    };

    const chartSeries = [
        {
            name: 'Klaim BPJS',
            data: [850000000, 920000000, 880000000, 1100000000, 1250400000]
        },
        {
            name: 'Biaya Sarana',
            data: [350000000, 380000000, 360000000, 420000000, 480000000]
        }
    ];

    return (
        <DashboardLayout>
            <div className="flex flex-col gap-6">
                {/* Page Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <span className="h-5 w-1 rounded-full bg-gradient-to-b from-blue-600 to-indigo-600 inline-block" />
                            <span className="text-xs font-bold text-blue-600 uppercase tracking-widest">Dashboard Utama</span>
                        </div>
                        <h1 className="text-2xl font-black tracking-tight text-slate-900">Distribusi Insentif Medis</h1>
                        <p className="text-sm text-slate-500 font-medium mt-1">Ringkasan performa finansial & remunerasi Rumah Sakit.</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <button className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-all shadow-sm hover:shadow">
                            Unduh Laporan
                        </button>
                        <button className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl text-sm font-semibold text-white hover:opacity-90 transition-all shadow-md shadow-blue-300/40">
                            Proses Jaspel
                        </button>
                    </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {statCards.map((stat, i) => (
                        <div key={i} className="group relative bg-white rounded-2xl border border-slate-100 p-5 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 overflow-hidden">
                            <div className={`absolute -top-6 -right-6 h-20 w-20 rounded-full bg-gradient-to-br ${stat.gradient} opacity-[0.08] group-hover:opacity-[0.14] transition-opacity`} />
                            <div className="flex items-start justify-between mb-4">
                                <div className={`flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${stat.gradient} shadow-md`}>
                                    <stat.icon className="h-5 w-5 text-white" />
                                </div>
                                {stat.trend === 'up' && (
                                    <span className="flex items-center text-emerald-700 text-[10px] font-black bg-emerald-50 px-2 py-1 rounded-lg">
                                        <ArrowUpRight className="h-3 w-3 mr-0.5" />+12%
                                    </span>
                                )}
                                {stat.trend === 'down' && (
                                    <span className="flex items-center text-rose-600 text-[10px] font-black bg-rose-50 px-2 py-1 rounded-lg">
                                        <ArrowDownRight className="h-3 w-3 mr-0.5" />-4%
                                    </span>
                                )}
                                {stat.trend === 'neutral' && (
                                    <span className="text-slate-400 text-[10px] font-black bg-slate-50 px-2 py-1 rounded-lg">STABIL</span>
                                )}
                            </div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.1em] mb-1">{stat.title}</p>
                            <p className="text-xl font-black text-slate-900 tracking-tight">{stat.value}</p>
                            <p className="text-[10px] text-slate-400 mt-1 font-medium">{stat.description}</p>
                        </div>
                    ))}
                </div>

                {/* Main Charts Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                    {/* Main Chart */}
                    <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                        <div className="h-1 w-full bg-gradient-to-r from-blue-600 via-indigo-500 to-purple-500" />
                        <div className="flex items-center justify-between p-6 pb-2">
                            <div>
                                <h3 className="text-base font-bold text-slate-900">Analisis Klaim & Biaya</h3>
                                <p className="text-sm text-slate-400 font-medium mt-0.5">Tren klaim BPJS vs biaya sarana bulan ini.</p>
                            </div>
                            <div className="flex items-center gap-1 bg-slate-50 p-1 rounded-lg border border-slate-100">
                                <button className="px-3 py-1.5 text-xs font-bold bg-white rounded-md shadow-sm text-blue-600">Bulanan</button>
                                <button className="px-3 py-1.5 text-xs font-semibold text-slate-400 hover:text-slate-700 rounded-md transition-colors">Tahunan</button>
                            </div>
                        </div>
                        <div className="h-[280px] p-4">
                            {mounted && (
                                <ReactApexChart
                                    options={{
                                        ...chartOptions,
                                        grid: { ...chartOptions.grid, padding: { left: 0, right: 0 } }
                                    }}
                                    series={chartSeries}
                                    type="area"
                                    height="100%"
                                />
                            )}
                        </div>
                    </div>

                    {/* Side Rankings */}
                    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
                        <h3 className="text-base font-bold text-slate-900 mb-1">Unit Paling Produktif</h3>
                        <p className="text-sm text-slate-400 font-medium mb-5">Berdasarkan volume tindakan medis.</p>
                        <div className="space-y-5">
                            {[
                                { name: "Poli Jantung", value: 450, color: "bg-blue-600" },
                                { name: "Rawat Inap Paviliun", value: 380, color: "bg-emerald-500" },
                                { name: "Instalasi Bedah", value: 310, color: "bg-purple-500" },
                                { name: "Radiologi", value: 290, color: "bg-orange-500" },
                            ].map((unit, i) => (
                                <div key={i} className="space-y-1.5">
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm font-semibold text-slate-700">{unit.name}</span>
                                        <span className="text-sm font-bold text-slate-900">{unit.value}</span>
                                    </div>
                                    <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                                        <div
                                            className={`h-full rounded-full ${unit.color} transition-all duration-700`}
                                            style={{ width: `${(unit.value / 450) * 100}%` }}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                        <Link
                            href="/laporan"
                            className="flex items-center justify-center gap-1.5 w-full mt-6 py-2 bg-slate-50 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors border border-slate-100"
                        >
                            Lihat Semua Unit <TrendingUp className="h-3 w-3" />
                        </Link>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}
