"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
const ReactApexChart = dynamic(() => import("react-apexcharts"), { ssr: false });

import DashboardLayout from "@/components/layout/dashboard-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Coins, TrendingUp, Calculator, Percent, RefreshCw, Loader2,
    Settings2, Save, ChevronDown, ChevronUp, Info, Edit, Trash2, Calendar
} from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getPoolingData, savePoolingConfig, listPoolingConfigs, deletePoolingConfig } from "./actions";
import { toast } from "sonner";

const MONTHS = [
    "Januari", "Februari", "Maret", "April", "Mei", "Juni",
    "Juli", "Agustus", "September", "Oktober", "November", "Desember"
];

function fmt(v: number) {
    if (!v) return "Rp 0";
    if (v >= 1_000_000_000) return `Rp ${(v / 1_000_000_000).toFixed(2)}M`;
    if (v >= 1_000_000) return `Rp ${(v / 1_000_000).toFixed(1)}jt`;
    return `Rp ${v.toLocaleString("id-ID")}`;
}

export default function PoolingPage() {
    const now = new Date();
    const [month, setMonth] = useState(now.getMonth() + 1);
    const [year, setYear] = useState(now.getFullYear());
    const [mounted, setMounted] = useState(false);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [showConfig, setShowConfig] = useState(false);
    const [data, setData] = useState<any>(null);
    const [savedConfigs, setSavedConfigs] = useState<any[]>([]);

    // Config form state - potongan sarana dalam nominal rupiah
    const [cfg, setCfg] = useState({
        total_revenue: 0,
        incentive_pct: 17,
        potongan_sarana: 0,   // nominal rupiah
        notes: "",
    });

    const fetchData = async () => {
        setLoading(true);
        const [poolRes, listRes] = await Promise.all([
            getPoolingData(month, year),
            listPoolingConfigs()
        ]);

        if (poolRes.success) {
            setData(poolRes.data);
            const rev = poolRes.data.totalRevenue;
            const saranaPct = poolRes.data.saranaPct;
            setCfg({
                total_revenue: rev,
                incentive_pct: poolRes.data.incentivePct,
                potongan_sarana: rev * (saranaPct / 100),
                notes: poolRes.data.config?.notes ?? "",
            });
        }

        if (listRes.success) {
            setSavedConfigs(listRes.data || []);
        } else {
            toast.error("Gagal memuat history pooling");
        }
        setLoading(false);
    };

    const handleDeleteConfig = async (id: string) => {
        if (!confirm("Hapus data pooling ini?")) return;
        const res = await deletePoolingConfig(id);
        if (res.success) {
            toast.success("Data pooling dihapus");
            fetchData();
        } else {
            toast.error(res.error ?? "Gagal menghapus");
        }
    };

    useEffect(() => { setMounted(true); fetchData(); }, [month, year]);

    const handleSaveConfig = async () => {
        setSaving(true);
        // Konversi potongan nominal ke persentase untuk disimpan
        const sarana_pct = cfg.total_revenue > 0
            ? (cfg.potongan_sarana / cfg.total_revenue) * 100
            : 0;
        const result = await savePoolingConfig({
            month,
            year,
            total_revenue: cfg.total_revenue,
            incentive_pct: cfg.incentive_pct,
            sarana_pct,
            medical_pct: 100 - sarana_pct,
            notes: cfg.notes,
        });
        if (result.success) {
            toast.success("Konfigurasi pooling disimpan");
            fetchData();
        } else {
            toast.error(result.error ?? "Gagal menyimpan");
        }
        setSaving(false);
    };

    // Computed preview
    const previewNet = cfg.total_revenue - cfg.potongan_sarana;
    const previewPool = previewNet * (cfg.incentive_pct / 100);

    const byUnit = data?.byUnit ?? [];
    const totalPool = data?.totalMedicalPool ?? previewPool;

    const donutSeries = byUnit.map((u: any) => u.pool);
    const donutLabels = byUnit.map((u: any) => u.name);

    const donutOptions: any = {
        chart: { type: "donut", animations: { enabled: true }, background: "transparent" },
        labels: donutLabels.length ? donutLabels : ["Belum ada data"],
        colors: ["#3b82f6", "#10b981", "#8b5cf6", "#f59e0b", "#ef4444", "#06b6d4"],
        legend: { position: "bottom", fontSize: "11px" },
        plotOptions: { pie: { donut: { size: "65%", labels: { show: true, total: { show: true, label: "Total Pool", formatter: () => fmt(totalPool) } } } } },
        dataLabels: { enabled: false },
        stroke: { width: 2, colors: ["#fff"] },
        tooltip: { y: { formatter: (v: number) => fmt(v) } },
    };

    const years = Array.from({ length: 5 }, (_, i) => now.getFullYear() - 2 + i);

    return (
        <DashboardLayout>
            <div className="space-y-6">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <span className="h-5 w-1 rounded-full bg-gradient-to-b from-emerald-500 to-teal-600 inline-block" />
                            <span className="text-xs font-bold text-emerald-600 uppercase tracking-widest">Proses Jaspel</span>
                        </div>
                        <h1 className="text-2xl font-black tracking-tight text-slate-900">Pooling Pendapatan</h1>
                        <p className="text-sm text-slate-500 font-medium mt-1">Input pendapatan dan konfigurasi persentase insentif per periode.</p>
                    </div>
                    <Button
                        variant="outline"
                        size="sm"
                        className="gap-2 rounded-xl border-slate-200 h-9 font-semibold"
                        onClick={fetchData}
                        disabled={loading}
                    >
                        {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
                        Refresh
                    </Button>
                </div>

                {/* Config Panel — periode ada di dalam frame ini */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                    <button
                        className="w-full flex items-center justify-between px-6 py-4 hover:bg-slate-50 transition-colors"
                        onClick={() => setShowConfig(!showConfig)}
                    >
                        <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-sm">
                                <Settings2 className="h-4 w-4 text-white" />
                            </div>
                            <div className="text-left">
                                <p className="text-sm font-bold text-slate-900">Konfigurasi Pendapatan &amp; Persentase</p>
                                <p className="text-xs text-slate-400 font-medium">Pilih periode dan atur konstanta persentase insentif</p>
                            </div>
                        </div>
                        {showConfig ? <ChevronUp className="h-4 w-4 text-slate-400" /> : <ChevronDown className="h-4 w-4 text-slate-400" />}
                    </button>

                    {showConfig && (
                        <div className="px-6 pb-6 border-t border-slate-100 bg-white">
                            {/* Periode — di dalam frame konfigurasi */}
                            <div className="mt-5 space-y-2">
                                <Label className="text-xs font-bold text-slate-600 uppercase tracking-wider">0. Periode</Label>
                                <div className="flex items-center gap-3">
                                    <Select value={String(month)} onValueChange={v => setMonth(Number(v))}>
                                        <SelectTrigger className="w-44 h-10 rounded-xl border-slate-200 bg-white font-semibold text-sm">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent className="bg-white">
                                            {MONTHS.map((m, i) => (
                                                <SelectItem key={i + 1} value={String(i + 1)}>{m}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <Select value={String(year)} onValueChange={v => setYear(Number(v))}>
                                        <SelectTrigger className="w-28 h-10 rounded-xl border-slate-200 bg-white font-semibold text-sm">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent className="bg-white">
                                            {years.map(y => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            {/* Step 1: Pendapatan */}
                            <div className="mt-5 space-y-2">
                                <Label className="text-xs font-bold text-slate-600 uppercase tracking-wider">1. Total Pendapatan (Rp)</Label>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">Rp</span>
                                    <Input
                                        type="number"
                                        className="pl-10 h-11 rounded-xl border-slate-200 bg-white font-bold text-lg focus-visible:ring-emerald-400"
                                        value={cfg.total_revenue}
                                        onChange={e => setCfg({ ...cfg, total_revenue: parseFloat(e.target.value) || 0 })}
                                        placeholder="0"
                                    />
                                </div>
                            </div>

                            {/* Step 2: Potongan Sarana — nominal rupiah */}
                            <div className="mt-4 space-y-2">
                                <Label className="text-xs font-bold text-slate-600 uppercase tracking-wider">2. Potongan (Nominal Rupiah)</Label>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">Rp</span>
                                    <Input
                                        type="number"
                                        min={0}
                                        className="pl-10 h-11 rounded-xl border-slate-200 bg-white font-bold text-lg focus-visible:ring-emerald-400"
                                        value={cfg.potongan_sarana}
                                        onChange={e => setCfg({ ...cfg, potongan_sarana: parseFloat(e.target.value) || 0 })}
                                        placeholder="0"
                                    />
                                </div>
                                {cfg.total_revenue > 0 && (
                                    <p className="text-xs text-slate-400">
                                        = {((cfg.potongan_sarana / cfg.total_revenue) * 100).toFixed(1)}% dari total pendapatan
                                    </p>
                                )}
                            </div>

                            {/* Step 3: Pendapatan Netto (readonly preview) */}
                            <div className="mt-4 space-y-2">
                                <Label className="text-xs font-bold text-slate-600 uppercase tracking-wider">3. Pendapatan Netto (Otomatis)</Label>
                                <div className="h-11 rounded-xl border border-slate-200 bg-slate-50 flex items-center px-4">
                                    <span className="font-black text-slate-800 text-lg">{fmt(previewNet)}</span>
                                    <span className="ml-2 text-xs text-slate-400">(Pendapatan − Potongan)</span>
                                </div>
                            </div>

                            {/* Step 4: Konstanta Insentif */}
                            <div className="mt-4 space-y-2">
                                <Label className="text-xs font-bold text-slate-600 uppercase tracking-wider">4. Konstanta % Insentif dari Netto</Label>
                                <div className="relative">
                                    <Input
                                        type="number"
                                        min={0} max={100} step={0.5}
                                        className="h-11 rounded-xl border-slate-200 bg-white font-bold text-center text-lg focus-visible:ring-emerald-400 pr-8"
                                        value={cfg.incentive_pct}
                                        onChange={e => setCfg({ ...cfg, incentive_pct: parseFloat(e.target.value) || 0 })}
                                    />
                                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">%</span>
                                </div>
                            </div>

                            {/* Result */}
                            <div className="mt-5 p-4 rounded-xl bg-slate-900 grid grid-cols-3 gap-4">
                                <div className="text-center">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Potongan</p>
                                    <p className="text-base font-black text-white">{fmt(cfg.potongan_sarana)}</p>
                                    <p className="text-[10px] text-slate-500 mt-0.5">Nominal dikurangi</p>
                                </div>
                                <div className="text-center border-x border-slate-700">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Pendapatan Netto</p>
                                    <p className="text-base font-black text-white">{fmt(previewNet)}</p>
                                    <p className="text-[10px] text-slate-500 mt-0.5">Setelah dikurangi potongan</p>
                                </div>
                                <div className="text-center">
                                    <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider mb-1">Medical Pool</p>
                                    <p className="text-base font-black text-emerald-400">{fmt(previewPool)}</p>
                                    <p className="text-[10px] text-slate-500 mt-0.5">{cfg.incentive_pct}% × netto</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-2 mt-3">
                                <Info className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                                <p className="text-[11px] text-slate-400">Formula: Medical Pool = (Total Pendapatan − Potongan) × % Insentif</p>
                            </div>

                            <div className="flex justify-end mt-4">
                                <Button
                                    onClick={handleSaveConfig}
                                    disabled={saving}
                                    className="gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-bold h-10 shadow-md shadow-emerald-200 hover:opacity-90"
                                >
                                    {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                                    Simpan Konfigurasi
                                </Button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {[
                        { title: "Total Pendapatan", value: fmt(data?.totalRevenue ?? 0), icon: TrendingUp, gradient: "from-blue-500 to-indigo-600" },
                        { title: `Medical Pool (${data?.incentivePct ?? 17}%)`, value: fmt(data?.totalMedicalPool ?? 0), icon: Coins, gradient: "from-emerald-500 to-teal-600" },
                        { title: "Potongan", value: fmt(data?.totalSarana ?? 0), icon: Calculator, gradient: "from-orange-500 to-red-500" },
                        { title: "Net Revenue", value: fmt(data?.netRevenue ?? 0), icon: Percent, gradient: "from-violet-500 to-purple-700" },
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
                    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
                        <h2 className="text-base font-bold text-slate-900 mb-1">Distribusi Pool per Unit</h2>
                        <p className="text-xs text-slate-400 font-medium mb-4">Proporsi keterlibatan masing-masing unit.</p>
                        {mounted && (
                            <ReactApexChart
                                options={donutOptions}
                                series={donutSeries.length ? donutSeries : [1]}
                                type="donut"
                                height={280}
                            />
                        )}
                    </div>

                    <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
                            <h2 className="text-base font-bold text-slate-900">Detail Pool per Unit Layanan</h2>
                            <span className="text-xs font-bold text-slate-400 bg-slate-50 px-3 py-1 rounded-lg border border-slate-100">
                                {MONTHS[month - 1]} {year}
                            </span>
                        </div>

                        {loading ? (
                            <div className="flex items-center justify-center py-20 gap-3">
                                <Loader2 className="h-5 w-5 animate-spin text-emerald-500" />
                                <span className="text-sm text-slate-400 font-medium">Memuat data pooling...</span>
                            </div>
                        ) : byUnit.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-16 text-center">
                                <Coins className="h-10 w-10 text-slate-200 mb-3" />
                                <p className="text-sm font-bold text-slate-500">Belum ada data klaim untuk periode ini</p>
                                <p className="text-xs text-slate-400 mt-1">Konfigurasi pendapatan di atas untuk melihat kalkulasi</p>
                            </div>
                        ) : (
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-slate-50/60 hover:bg-slate-50">
                                        <TableHead className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Unit Layanan</TableHead>
                                        <TableHead className="text-[10px] font-black text-slate-400 uppercase tracking-wider text-right">Jml Klaim</TableHead>
                                        <TableHead className="text-[10px] font-black text-slate-400 uppercase tracking-wider text-right">Medical Pool</TableHead>
                                        <TableHead className="text-[10px] font-black text-slate-400 uppercase tracking-wider text-right">Proporsi</TableHead>
                                        <TableHead className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Share</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {byUnit.map((unit: any, i: number) => {
                                        const total = byUnit.reduce((a: number, u: any) => a + u.pool, 0);
                                        const pct = total > 0 ? ((unit.pool / total) * 100).toFixed(1) : "0.0";
                                        const colors = ["bg-blue-500", "bg-emerald-500", "bg-violet-500", "bg-amber-500", "bg-red-500", "bg-cyan-500"];
                                        return (
                                            <TableRow key={i} className="hover:bg-blue-50/20 transition-colors">
                                                <TableCell>
                                                    <div className="flex items-center gap-2.5">
                                                        <div className={`h-2 w-2 rounded-full ${colors[i % colors.length]}`} />
                                                        <span className="text-sm font-semibold text-slate-800">{unit.name}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-right text-sm font-bold text-slate-700">{unit.claims}</TableCell>
                                                <TableCell className="text-right text-sm font-black text-slate-900">{fmt(unit.pool)}</TableCell>
                                                <TableCell className="text-right text-sm font-bold text-slate-600">{pct}%</TableCell>
                                                <TableCell className="w-36">
                                                    <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                                                        <div className={`h-full rounded-full ${colors[i % colors.length]} transition-all duration-700`} style={{ width: `${pct}%` }} />
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })}
                                </TableBody>
                            </Table>
                        )}
                        <div className="flex items-center justify-between px-5 py-3 border-t border-slate-100 bg-slate-50/40">
                            <p className="text-xs text-slate-400 font-medium">{byUnit.length} unit layanan</p>
                            <p className="text-xs font-black text-slate-700">Total Pool: {fmt(totalPool)}</p>
                        </div>
                    </div>
                </div>
                {/* Data Preview Table */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden mt-6">
                    <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
                        <div className="flex items-center gap-2">
                            <div className="h-2 w-2 rounded-full bg-emerald-500" />
                            <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Histori Pooling Tersimpan</h2>
                        </div>
                        <p className="text-[10px] font-bold text-slate-400">Total {savedConfigs.length} Data</p>
                    </div>
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-white hover:bg-white text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
                                <TableHead className="px-6 py-4">Periode</TableHead>
                                <TableHead className="text-right">Total Pendapatan</TableHead>
                                <TableHead className="text-right">Potongan (Sarana)</TableHead>
                                <TableHead className="text-right">Medical Pool</TableHead>
                                <TableHead className="text-center">Konstanta %</TableHead>
                                <TableHead className="text-right px-6">Aksi</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {savedConfigs.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="h-32 text-center text-slate-400 font-medium italic">
                                        Belum ada history pooling tersimpan.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                savedConfigs.map((config) => (
                                    <TableRow key={config.id} className="group hover:bg-slate-50 transition-colors border-b border-slate-50">
                                        <TableCell className="px-6">
                                            <div className="flex flex-col">
                                                <span className="font-bold text-slate-800">{MONTHS[config.month - 1]}</span>
                                                <span className="text-[10px] font-black text-slate-400">{config.year}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right font-bold text-slate-900">{fmt(config.total_revenue)}</TableCell>
                                        <TableCell className="text-right font-bold text-rose-600 font-mono text-xs">{fmt(config.total_sarana)}</TableCell>
                                        <TableCell className="text-right font-black text-emerald-600 font-mono text-xs">{fmt(config.total_medical_pool)}</TableCell>
                                        <TableCell className="text-center">
                                            <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 font-black text-[10px] border border-blue-100 italic">
                                                {config.incentive_pct}%
                                            </span>
                                        </TableCell>
                                        <TableCell className="text-right px-6">
                                            <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-all">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 rounded-lg text-blue-400 hover:text-blue-600 hover:bg-blue-50"
                                                    onClick={() => {
                                                        setMonth(config.month);
                                                        setYear(config.year);
                                                        setShowConfig(true);
                                                        window.scrollTo({ top: 0, behavior: 'smooth' });
                                                    }}
                                                >
                                                    <Edit className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 rounded-lg text-rose-400 hover:text-rose-600 hover:bg-rose-50"
                                                    onClick={() => handleDeleteConfig(config.id)}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>
            </div>
        </DashboardLayout>
    );
}
