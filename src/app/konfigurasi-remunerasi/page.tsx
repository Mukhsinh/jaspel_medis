"use client";

import { useState, useEffect } from "react";
import DashboardLayout from "@/components/layout/dashboard-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
    SlidersHorizontal, Save, Loader2, Info, RefreshCw,
    Settings2, Percent, Calculator, CheckCircle2,
    Plus, Trash2, LayoutList, Activity, Star,
    Download, FileText, ChevronRight, Edit3, MoreVertical
} from "lucide-react";
import { toast } from "sonner";
import {
    getRemunerationConfig,
    saveRemunerationConfig,
    listIndicators,
    saveIndicator,
    deleteIndicator,
    saveMeasurement,
    deleteMeasurement
} from "./actions";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";

export default function KonfigurasiRemunerasiPage() {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const [indicators, setIndicators] = useState<any[]>([]);
    const [cfg, setCfg] = useState({
        p1_weight: 30,
        p2_weight: 50,
        p3_weight: 20,
        p1_education: 30,
        p1_position: 40,
        p1_competency: 20,
        p1_certification: 10,
        p2_volume: 40,
        p2_productivity: 40,
        p2_logbook: 20,
        p3_attendance: 30,
        p3_discipline: 30,
        p3_managerial: 20,
        p3_strategic: 20,
        conversion_base: 17,
        notes: "",
    });

    // Modal States
    const [indicatorModalOpen, setIndicatorModalOpen] = useState(false);
    const [measurementModalOpen, setMeasurementModalOpen] = useState(false);
    const [editingIndicator, setEditingIndicator] = useState<any>(null);
    const [editingMeasurement, setEditingMeasurement] = useState<any>(null);
    const [activeIndicatorId, setActiveIndicatorId] = useState<string | null>(null);

    const [indicatorForm, setIndicatorForm] = useState({ name: "", weight: 1.0 });
    const [measurementForm, setMeasurementForm] = useState({
        name: "",
        method: "SKOR",
        weight: 1.0,
        minValue: undefined as number | undefined,
        maxValue: undefined as number | undefined
    });

    const fetchData = async () => {
        setLoading(true);
        const [configRes, indicatorRes] = await Promise.all([
            getRemunerationConfig(),
            listIndicators()
        ]);

        if (configRes.success && configRes.data) {
            setCfg(prev => ({ ...prev, ...configRes.data }));
        }

        if (indicatorRes.success) {
            setIndicators(indicatorRes.data || []);
        }
        setLoading(false);
    };

    useEffect(() => { fetchData(); }, []);

    const handleSaveIndicator = async () => {
        if (!indicatorForm.name) return toast.error("Nama indikator harus diisi");
        setSaving(true);
        const result = await saveIndicator({
            id: editingIndicator?.id,
            name: indicatorForm.name,
            weight: indicatorForm.weight
        });
        if (result.success) {
            toast.success(editingIndicator ? "Indikator diperbarui" : "Indikator ditambahkan");
            setIndicatorModalOpen(false);
            setEditingIndicator(null);
            setIndicatorForm({ name: "", weight: 1.0 });
            fetchData();
        } else {
            toast.error(result.error ?? "Gagal menyimpan");
        }
        setSaving(false);
    };

    const handleDeleteIndicator = async (id: string) => {
        if (!confirm("Hapus indikator ini? Seluruh pengukuran di dalamnya juga akan terhapus.")) return;
        const result = await deleteIndicator(id);
        if (result.success) {
            toast.success("Indikator dihapus");
            fetchData();
        } else {
            toast.error(result.error ?? "Gagal menghapus");
        }
    };

    const handleSaveMeasurement = async () => {
        if (!measurementForm.name) return toast.error("Nama pengukuran harus diisi");
        if (!activeIndicatorId && !editingMeasurement) return toast.error("Indikator tidak ditemukan");

        setSaving(true);
        const result = await saveMeasurement({
            id: editingMeasurement?.id,
            indicatorId: editingMeasurement?.indicatorId || activeIndicatorId!,
            name: measurementForm.name,
            method: measurementForm.method,
            weight: measurementForm.weight,
            minValue: measurementForm.minValue,
            maxValue: measurementForm.maxValue
        });
        if (result.success) {
            toast.success(editingMeasurement ? "Pengukuran diperbarui" : "Pengukuran ditambahkan");
            setMeasurementModalOpen(false);
            setEditingMeasurement(null);
            setMeasurementForm({ name: "", method: "SKOR", weight: 1.0, minValue: undefined, maxValue: undefined });
            fetchData();
        } else {
            toast.error(result.error ?? "Gagal menyimpan");
        }
        setSaving(false);
    };

    const handleDeleteMeasurement = async (id: string) => {
        if (!confirm("Hapus pengukuran ini?")) return;
        const result = await deleteMeasurement(id);
        if (result.success) {
            toast.success("Pengukuran dihapus");
            fetchData();
        } else {
            toast.error(result.error ?? "Gagal menghapus");
        }
    };

    const handleSaveConfig = async () => {
        setSaving(true);
        const result = await saveRemunerationConfig(cfg);
        if (result.success) {
            toast.success("Konfigurasi bobot berhasil disimpan");
        } else {
            toast.error(result.error ?? "Gagal menyimpan");
        }
        setSaving(false);
    };

    const handleDownloadPDF = () => {
        toast.info("Menyiapkan dokumen PDF...");
        // Future implementation for real PDF generation
        window.print();
    };

    const handleDownloadGuidelines = () => {
        toast.info("Mengunduh Pedoman Konfigurasi...");
        const content = "Pedoman Konfigurasi Remunerasi\n\n1. Indikator P1 difokuskan pada Jabatan...\n2. P2 difokuskan pada Kinerja...";
        const blob = new Blob([content], { type: "text/plain" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "Pedoman_Remunerasi.txt";
        a.click();
    };

    const totalPWeight = Number(cfg.p1_weight) + Number(cfg.p2_weight) + Number(cfg.p3_weight);

    if (loading) {
        return (
            <DashboardLayout>
                <div className="flex flex-col items-center justify-center py-40 gap-4">
                    <div className="h-12 w-12 rounded-full border-4 border-slate-100 border-t-violet-600 animate-spin" />
                    <p className="text-slate-400 font-bold animate-pulse">Menyiapkan Konfigurasi...</p>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout>
            <div className="max-w-[1400px] mx-auto space-y-8 pb-20">
                {/* Modern Header */}
                <div className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 p-8 text-white shadow-2xl">
                    <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div className="space-y-2">
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 backdrop-blur-md">
                                <span className="h-2 w-2 rounded-full bg-blue-400 animate-pulse" />
                                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-200">Remuneration Core v2</span>
                            </div>
                            <h1 className="text-4xl font-black tracking-tight bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
                                Konfigurasi Remunerasi
                            </h1>
                            <p className="text-slate-400 font-medium max-w-lg">
                                Kelola struktur indikator, bobot penilaian, dan metode pengukuran insentif secara terpusat dan profesional.
                            </p>
                        </div>
                        <div className="flex flex-wrap items-center gap-3">
                            <Button
                                variant="outline"
                                className="rounded-2xl border-slate-700 bg-slate-800/50 hover:bg-slate-700 text-white font-bold h-12 gap-2"
                                onClick={handleDownloadGuidelines}
                            >
                                <FileText className="h-4 w-4 text-blue-400" />
                                Pedoman
                            </Button>
                            <Button
                                variant="outline"
                                className="rounded-2xl border-slate-700 bg-slate-800/50 hover:bg-slate-700 text-white font-bold h-12 gap-2"
                                onClick={handleDownloadPDF}
                            >
                                <Download className="h-4 w-4 text-emerald-400" />
                                Unduh Konfigurasi
                            </Button>
                            <Button
                                className="rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-black h-12 px-6 shadow-xl shadow-violet-900/40 gap-2 hover:scale-[1.02] active:scale-[0.98] transition-all"
                                onClick={handleSaveConfig}
                                disabled={saving}
                            >
                                {saving ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />}
                                Simpan Bobot Utama
                            </Button>
                        </div>
                    </div>
                    {/* Abstract Shapes */}
                    <div className="absolute top-0 right-0 -mr-20 -mt-20 h-80 w-80 rounded-full bg-blue-600/10 blur-[100px]" />
                    <div className="absolute bottom-0 left-0 -ml-20 -mb-20 h-60 w-60 rounded-full bg-violet-600/10 blur-[80px]" />
                </div>

                {/* Main Settings Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                    {/* Left Panel: Primary Weights */}
                    <div className="lg:col-span-1 space-y-6">
                        <Card className="rounded-[2rem] border-slate-200 shadow-xl overflow-hidden bg-white/70 backdrop-blur-xl">
                            <CardHeader className="p-6 pb-0">
                                <div className="flex items-center gap-3">
                                    <div className="h-10 w-10 rounded-2xl bg-violet-100 flex items-center justify-center">
                                        <SlidersHorizontal className="h-5 w-5 text-violet-600" />
                                    </div>
                                    <div>
                                        <h3 className="font-black text-slate-800">Bobot Utama</h3>
                                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">P1 / P2 / P3 Ratio</p>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="p-6 space-y-6">
                                <div className="space-y-4">
                                    {[
                                        { label: "P1 - Position", color: "bg-blue-500", key: "p1_weight" },
                                        { label: "P2 - Performance", color: "bg-emerald-500", key: "p2_weight" },
                                        { label: "P3 - Behavior", color: "bg-amber-500", key: "p3_weight" }
                                    ].map((item) => (
                                        <div key={item.key} className="space-y-2">
                                            <div className="flex items-center justify-between text-[11px] font-black text-slate-500 uppercase tracking-widest px-1">
                                                <span>{item.label}</span>
                                                <span className="text-slate-900">{(cfg as any)[item.key]}%</span>
                                            </div>
                                            <div className="relative h-12 bg-slate-50 rounded-2xl border border-slate-100 flex items-center px-4">
                                                <Input
                                                    type="number"
                                                    value={(cfg as any)[item.key]}
                                                    onChange={e => setCfg({ ...cfg, [item.key]: Number(e.target.value) })}
                                                    className="bg-transparent border-none font-black text-lg focus-visible:ring-0 p-0 text-slate-800"
                                                />
                                                <div className={`h-1.5 rounded-full ${item.color} absolute bottom-0 left-4 right-4 mb-2 opacity-20`} />
                                                <span className="text-slate-400 font-bold ml-2">%</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <div className={`p-4 rounded-[1.5rem] border ${totalPWeight === 100 ? 'bg-emerald-50 border-emerald-100 text-emerald-700' : 'bg-rose-50 border-rose-100 text-rose-700'} flex flex-col items-center gap-2 transition-all`}>
                                    <div className="text-[10px] font-black uppercase tracking-widest">Total Akumulasi</div>
                                    <div className="text-3xl font-black">{totalPWeight}%</div>
                                    {totalPWeight !== 100 && <p className="text-[10px] font-bold">Harus tepat 100%</p>}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Conversion Base */}
                        <Card className="rounded-[2rem] border-slate-200 shadow-xl overflow-hidden bg-white/70 backdrop-blur-xl">
                            <CardContent className="p-6 space-y-4">
                                <div className="flex items-center gap-3">
                                    <div className="h-10 w-10 rounded-2xl bg-orange-100 flex items-center justify-center">
                                        <Calculator className="h-5 w-5 text-orange-600" />
                                    </div>
                                    <div>
                                        <h3 className="font-black text-slate-800">Conversion Base</h3>
                                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Pool allocation</p>
                                    </div>
                                </div>
                                <div className="relative h-14 bg-slate-50 rounded-2xl border border-slate-100 flex items-center px-4">
                                    <Input
                                        type="number"
                                        value={cfg.conversion_base}
                                        onChange={e => setCfg({ ...cfg, conversion_base: Number(e.target.value) })}
                                        className="bg-transparent border-none font-black text-xl focus-visible:ring-0 p-0 text-slate-800"
                                    />
                                    <span className="text-slate-400 font-black text-lg">%</span>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Right Panel: Hierarchical Indicators */}
                    <div className="lg:col-span-3 space-y-6">
                        <div className="flex items-center justify-between px-4">
                            <div className="flex items-center gap-2">
                                <div className="h-8 w-1 rounded-full bg-violet-600" />
                                <h3 className="font-black text-slate-800 text-xl tracking-tight">Hirarki Indikator & Pengukuran</h3>
                            </div>
                            <Button
                                onClick={() => {
                                    setEditingIndicator(null);
                                    setIndicatorForm({ name: "", weight: 1.0 });
                                    setIndicatorModalOpen(true);
                                }}
                                className="rounded-xl bg-slate-900 text-white font-bold h-10 gap-2 px-6 shadow-lg shadow-slate-200"
                            >
                                <Plus className="h-4 w-4" />
                                Tambah Indikator
                            </Button>
                        </div>

                        {indicators.map((ind, idx) => (
                            <Card key={ind.id} className="rounded-[2.5rem] border-slate-200 shadow-lg bg-white overflow-hidden group">
                                <div className="p-8 pb-4">
                                    <div className="flex items-started justify-between gap-4">
                                        <div className="flex gap-6 items-start">
                                            <div className="h-16 w-16 rounded-3xl bg-slate-50 border border-slate-100 flex items-center justify-center font-black text-2xl text-slate-300 group-hover:bg-violet-50 group-hover:text-violet-600 transition-colors">
                                                {String(idx + 1).padStart(2, '0')}
                                            </div>
                                            <div className="space-y-1">
                                                <div className="flex items-center gap-3">
                                                    <h4 className="text-xl font-black text-slate-800">{ind.name}</h4>
                                                    <Badge className="bg-slate-100 text-slate-500 border-none font-bold text-[10px]">Weight: {ind.weight}</Badge>
                                                </div>
                                                <p className="text-sm text-slate-400 font-medium">Berisi {ind.measurements?.length || 0} parameter pengukuran penilaian.</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-10 w-10 btn-pastel-blue rounded-xl"
                                                onClick={() => {
                                                    setEditingIndicator(ind);
                                                    setIndicatorForm({ name: ind.name, weight: ind.weight });
                                                    setIndicatorModalOpen(true);
                                                }}
                                            >
                                                <Edit3 className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-10 w-10 btn-pastel-red rounded-xl"
                                                onClick={() => handleDeleteIndicator(ind.id)}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                </div>

                                <div className="px-8 pb-8">
                                    <div className="rounded-[1.8rem] bg-slate-50/50 border border-slate-100 p-2">
                                        <div className="space-y-2">
                                            {ind.measurements?.length > 0 ? (
                                                ind.measurements.map((m: any) => (
                                                    <div key={m.id} className="flex items-center justify-between p-4 bg-white rounded-2xl border border-slate-100 hover:border-violet-100 hover:shadow-sm transition-all">
                                                        <div className="flex items-center gap-4">
                                                            <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${m.method === 'AKTIVITAS' ? 'bg-blue-50 text-blue-600' : 'bg-amber-50 text-amber-600'}`}>
                                                                {m.method === 'AKTIVITAS' ? <Activity className="h-5 w-5" /> : <Star className="h-5 w-5" />}
                                                            </div>
                                                            <div>
                                                                <p className="text-sm font-bold text-slate-700">{m.name}</p>
                                                                <div className="flex items-center gap-2 mt-0.5">
                                                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{m.method}</span>
                                                                    <span className="text-[10px] text-slate-300">•</span>
                                                                    <span className="text-[10px] font-bold text-violet-500">Bobot: {m.weight}</span>
                                                                    {m.method === 'SKOR' && (
                                                                        <span className="text-[10px] text-slate-500 ml-2 bg-slate-100 px-2 py-0.5 rounded-full">Range: {m.minValue}-{m.maxValue}</span>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-1">
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="h-8 w-8 rounded-lg text-slate-400 hover:text-blue-600"
                                                                onClick={() => {
                                                                    setEditingMeasurement(m);
                                                                    setMeasurementForm({
                                                                        name: m.name,
                                                                        method: m.method,
                                                                        weight: m.weight,
                                                                        minValue: m.minValue,
                                                                        maxValue: m.maxValue
                                                                    });
                                                                    setMeasurementModalOpen(true);
                                                                }}
                                                            >
                                                                <Edit3 className="h-3.5 w-3.5" />
                                                            </Button>
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="h-8 w-8 rounded-lg text-slate-400 hover:text-rose-600"
                                                                onClick={() => handleDeleteMeasurement(m.id)}
                                                            >
                                                                <Trash2 className="h-3.5 w-3.5" />
                                                            </Button>
                                                        </div>
                                                    </div>
                                                ))
                                            ) : (
                                                <div className="py-6 text-center">
                                                    <p className="text-xs text-slate-400 font-medium italic">Belum ada parameter pengukuran.</p>
                                                </div>
                                            )}

                                            <Button
                                                variant="ghost"
                                                className="w-full h-12 rounded-2xl border-dashed border-2 border-slate-200 text-slate-400 font-bold gap-2 hover:bg-violet-50 hover:border-violet-200 hover:text-violet-600 transition-all"
                                                onClick={() => {
                                                    setActiveIndicatorId(ind.id);
                                                    setEditingMeasurement(null);
                                                    setMeasurementForm({ name: "", method: "SKOR", weight: 1.0, minValue: undefined, maxValue: undefined });
                                                    setMeasurementModalOpen(true);
                                                }}
                                            >
                                                <Plus className="h-4 w-4" />
                                                Tambah Parameter Pengukuran
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </Card>
                        ))}

                        {indicators.length === 0 && (
                            <div className="py-20 flex flex-col items-center gap-4 text-center">
                                <div className="h-20 w-20 rounded-[2.5rem] bg-slate-50 flex items-center justify-center text-slate-200">
                                    <LayoutList className="h-10 w-10" />
                                </div>
                                <div>
                                    <h4 className="font-black text-slate-800">Struktur Kosong</h4>
                                    <p className="text-sm text-slate-400 font-medium">Mulai dengan menambahkan indikator penilaian baru.</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Modal: Indicator */}
            <Dialog open={indicatorModalOpen} onOpenChange={setIndicatorModalOpen}>
                <DialogContent className="rounded-[2.5rem] border-none shadow-2xl p-0 overflow-hidden max-w-md">
                    <div className="bg-gradient-to-r from-violet-600 to-indigo-600 p-8 text-white relative">
                        <DialogHeader>
                            <DialogTitle className="text-2xl font-black">{editingIndicator ? 'Edit Indikator' : 'Indikator Baru'}</DialogTitle>
                            <p className="text-violet-100 text-xs font-medium opacity-80 mt-1">Gunakan label yang merepresentasikan kategori penilaian.</p>
                        </DialogHeader>
                        <div className="absolute top-0 right-0 h-full flex items-center pr-8 opacity-10">
                            <SlidersHorizontal className="h-20 w-20" />
                        </div>
                    </div>
                    <div className="p-8 space-y-6 bg-white">
                        <div className="space-y-2">
                            <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Nama Indikator</Label>
                            <Input
                                placeholder="Contoh: Kinerja Medis"
                                value={indicatorForm.name}
                                onChange={e => setIndicatorForm({ ...indicatorForm, name: e.target.value })}
                                className="h-14 rounded-2xl border-slate-100 bg-slate-50 font-bold px-5 focus-visible:ring-violet-500"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Bobot (Index)</Label>
                            <Input
                                type="number"
                                step={0.1}
                                value={indicatorForm.weight}
                                onChange={e => setIndicatorForm({ ...indicatorForm, weight: Number(e.target.value) })}
                                className="h-14 rounded-2xl border-slate-100 bg-slate-50 font-bold px-5 focus-visible:ring-violet-500"
                            />
                        </div>
                        <DialogFooter className="pt-2">
                            <Button
                                variant="ghost"
                                onClick={() => setIndicatorModalOpen(false)}
                                className="h-14 rounded-2xl font-black uppercase text-[10px] tracking-widest"
                            >
                                Batal
                            </Button>
                            <Button
                                onClick={handleSaveIndicator}
                                disabled={saving}
                                className="h-14 px-8 rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 font-black text-white shadow-lg shadow-violet-200"
                            >
                                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Simpan Indikator'}
                            </Button>
                        </DialogFooter>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Modal: Measurement */}
            <Dialog open={measurementModalOpen} onOpenChange={setMeasurementModalOpen}>
                <DialogContent className="rounded-[2.5rem] border-none shadow-2xl p-0 overflow-hidden max-w-lg">
                    <div className="bg-gradient-to-r from-slate-900 to-slate-800 p-8 text-white">
                        <DialogHeader>
                            <DialogTitle className="text-2xl font-black">{editingMeasurement ? 'Edit Parameter' : 'Parameter Baru'}</DialogTitle>
                            <p className="text-slate-400 text-xs font-medium mt-1">Tentukan metode kalkulasi untuk parameter ini.</p>
                        </DialogHeader>
                    </div>
                    <div className="p-8 space-y-6 bg-white">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="col-span-2 space-y-2">
                                <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Nama Parameter</Label>
                                <Input
                                    placeholder="Contoh: Volume Operasi / Skor Kedisiplinan"
                                    value={measurementForm.name}
                                    onChange={e => setMeasurementForm({ ...measurementForm, name: e.target.value })}
                                    className="h-12 rounded-xl border-slate-100 bg-slate-50 font-bold"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Metode Pengukuran</Label>
                                <Select
                                    value={measurementForm.method}
                                    onValueChange={v => setMeasurementForm({ ...measurementForm, method: v || "" })}
                                >
                                    <SelectTrigger className="h-12 rounded-xl border-slate-100 bg-slate-50 font-bold">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="SKOR">Skala Skoring</SelectItem>
                                        <SelectItem value="AKTIVITAS">Aktivitas (Vol x Tarif)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Bobot Index</Label>
                                <Input
                                    type="number"
                                    step={0.1}
                                    value={measurementForm.weight}
                                    onChange={e => setMeasurementForm({ ...measurementForm, weight: Number(e.target.value) })}
                                    className="h-12 rounded-xl border-slate-100 bg-slate-50 font-bold"
                                />
                            </div>
                        </div>

                        {measurementForm.method === 'SKOR' && (
                            <div className="p-5 rounded-2xl bg-amber-50/50 border border-amber-100 space-y-4">
                                <div className="flex items-center gap-2">
                                    <Info className="h-4 w-4 text-amber-600" />
                                    <p className="text-xs font-black text-amber-700 uppercase tracking-widest">Range Nilai Skor</p>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <Label className="text-[10px] text-amber-600 font-bold">Min Value</Label>
                                        <Input
                                            type="number"
                                            value={measurementForm.minValue}
                                            onChange={e => setMeasurementForm({ ...measurementForm, minValue: Number(e.target.value) })}
                                            className="h-10 bg-white border-amber-100 font-bold"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <Label className="text-[10px] text-amber-600 font-bold">Max Value</Label>
                                        <Input
                                            type="number"
                                            value={measurementForm.maxValue}
                                            onChange={e => setMeasurementForm({ ...measurementForm, maxValue: Number(e.target.value) })}
                                            className="h-10 bg-white border-amber-100 font-bold"
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        {measurementForm.method === 'AKTIVITAS' && (
                            <div className="p-5 rounded-2xl bg-blue-50/50 border border-blue-100 flex items-start gap-4">
                                <div className="h-10 w-10 rounded-xl bg-blue-100 flex items-center justify-center shrink-0">
                                    <Calculator className="h-5 w-5 text-blue-600" />
                                </div>
                                <div>
                                    <p className="text-xs font-black text-blue-800 uppercase tracking-widest mb-1">Kalkulasi Otomatis</p>
                                    <p className="text-[10px] text-blue-600 font-medium leading-relaxed">
                                        Sistem akan mendeteksi volume tindakan dokter berdasarkan tarif pelayanan yang relevan.
                                        Hasil akhir: <span className="font-bold underline">Volume × Tarif Jaspel.</span>
                                    </p>
                                </div>
                            </div>
                        )}

                        <DialogFooter className="pt-2">
                            <Button
                                variant="ghost"
                                onClick={() => setMeasurementModalOpen(false)}
                                className="h-12 rounded-xl font-black uppercase text-[10px] tracking-widest"
                            >
                                Batal
                            </Button>
                            <Button
                                onClick={handleSaveMeasurement}
                                disabled={saving}
                                className="h-12 px-8 rounded-xl bg-slate-900 font-black text-white hover:bg-slate-800"
                            >
                                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Simpan Parameter'}
                            </Button>
                        </DialogFooter>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Custom Styles for Pastel Buttons */}
            <style jsx global>{`
                .btn-pastel-blue {
                    color: #3b82f6;
                    background-color: #eff6ff;
                    border: 1px solid #dbeafe;
                }
                .btn-pastel-blue:hover {
                    background-color: #dbeafe;
                    color: #2563eb;
                }
                .btn-pastel-red {
                    color: #ef4444;
                    background-color: #fef2f2;
                    border: 1px solid #fee2e2;
                }
                .btn-pastel-red:hover {
                    background-color: #fee2e2;
                    color: #dc2626;
                }
                @media print {
                    nav, sidebar, button { display: none !important; }
                    .dashboard-content { margin: 0 !important; width: 100% !important; }
                    .shadow-2xl, .shadow-xl, .shadow-lg { shadow: none !important; border: 1px solid #eee !important; }
                }
            `}</style>
        </DashboardLayout>
    );
}
