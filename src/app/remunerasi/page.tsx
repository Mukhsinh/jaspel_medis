"use client";

import { useState, useEffect } from "react";
import DashboardLayout from "@/components/layout/dashboard-layout";
import { Button } from "@/components/ui/button";
import {
    Calculator, TrendingUp, UserCheck, Star, Edit2, Loader2, Search, CheckCircle2, Zap
} from "lucide-react";
import { Input } from "@/components/ui/input";
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from "@/components/ui/table";
import {
    getRemunerationData, updateRemunerationScore, batchCalculateRemuneration
} from "./actions";
import { toast } from "sonner";
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

const statCards = [
    { title: "Total Dokter", key: "totalDoctors", icon: UserCheck, gradient: "from-blue-500 to-blue-700", suffix: "" },
    { title: "Rerata Skor P1", key: "avgP1", icon: Star, gradient: "from-emerald-500 to-teal-600", suffix: "%" },
    { title: "Rerata Skor P2", key: "avgP2", icon: TrendingUp, gradient: "from-violet-500 to-purple-700", suffix: "%" },
    { title: "Rerata Total Index", key: "avgTotal", icon: Calculator, gradient: "from-orange-500 to-red-500", suffix: "" },
];

export default function RemunerationPage() {
    const [searchTerm, setSearchTerm] = useState("");
    const [loading, setLoading] = useState(true);
    const [doctors, setDoctors] = useState<any[]>([]);
    const [indicators, setIndicators] = useState<any[]>([]);
    const [indicatorScores, setIndicatorScores] = useState<{ [key: string]: number }>({});
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [selectedDoctor, setSelectedDoctor] = useState<any>(null);
    const [formData, setFormData] = useState({ p1: 0, p2: 0, p3: 0 });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isBatchRunning, setIsBatchRunning] = useState(false);

    const fetchData = async () => {
        setLoading(true);
        const result = await getRemunerationData();
        if (result.success && result.data) {
            setDoctors(result.data.doctors);
            setIndicators(result.data.indicators);
        }
        else toast.error("Gagal memuat data remunerasi");
        setLoading(false);
    };

    useEffect(() => { fetchData(); }, []);

    const handleEdit = (doc: any) => {
        setSelectedDoctor(doc);

        // Get current period score if exists
        const currentScore = doc.scores?.[0]; // Assumes latest score or appropriate period

        const initialP1 = currentScore?.p1 ?? 80;
        const initialP3 = currentScore?.p3 ?? 85;

        // Map indicator scores
        const scores: { [key: string]: number } = {};
        indicators.forEach(ind => {
            const found = currentScore?.indicatorScores?.find((s: any) => s.indicator_id === ind.id);
            scores[ind.id] = found ? parseFloat(found.value) : 0;
        });

        setIndicatorScores(scores);

        // Calculate initial P2 average
        const avgP2 = indicators.length > 0
            ? (Object.values(scores) as number[]).reduce((a: number, b: number) => a + b, 0) / indicators.length
            : 0;

        setFormData({ p1: initialP1, p2: Math.round(avgP2), p3: initialP3 });
        setIsDialogOpen(true);
    };

    const handleSaveScore = async () => {
        if (!selectedDoctor) return;
        setIsSubmitting(true);

        const payload = {
            doctorId: selectedDoctor.id,
            ...formData,
            indicatorScores: Object.entries(indicatorScores).map(([id, val]) => ({
                indicatorId: id,
                value: val
            }))
        };

        const result = await updateRemunerationScore(payload);
        if (result.success) {
            toast.success("Skor berhasil disimpan");
            setIsDialogOpen(false);
            fetchData();
        } else toast.error(result.error);
        setIsSubmitting(false);
    };

    const handleBatchCalc = async () => {
        setIsBatchRunning(true);
        const result = await batchCalculateRemuneration();
        if (result.success) toast.success(`Kalkulasi selesai: Dokter diproses`);
        else toast.error(result.error);
        setIsBatchRunning(false);
    };

    const filtered = doctors.filter(d =>
        d.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        d.specialization?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const stats = {
        totalDoctors: doctors.length,
        avgP1: doctors.length ? Math.round(doctors.reduce((a, d) => a + (Number(d.scores?.[0]?.p1) || 80), 0) / doctors.length) : 0,
        avgP2: doctors.length ? Math.round(doctors.reduce((a, d) => a + (Number(d.scores?.[0]?.p2) || 75), 0) / doctors.length) : 0,
        avgTotal: doctors.length ? (doctors.reduce((a, d) => a + (Number(d.scores?.[0]?.total_index) || 0), 0) / doctors.length).toFixed(2) : 0,
    };

    const getScoreColor = (score: number) => {
        if (score >= 90) return "text-emerald-700 bg-emerald-50";
        if (score >= 75) return "text-blue-700 bg-blue-50";
        if (score >= 60) return "text-orange-700 bg-orange-50";
        return "text-red-700 bg-red-50";
    };

    return (
        <DashboardLayout>
            <div className="space-y-6">
                {/* Page Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <span className="h-5 w-1 rounded-full bg-gradient-to-b from-violet-600 to-purple-600 inline-block" />
                            <span className="text-xs font-bold text-violet-600 uppercase tracking-widest">Proses Jaspel</span>
                        </div>
                        <h1 className="text-2xl font-black tracking-tight text-slate-900">Mesin Remunerasi</h1>
                        <p className="text-sm text-slate-500 font-medium mt-1">Kalkulasi skor P1, P2, P3 dan indeks konversi insentif dokter.</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            className="gap-2 rounded-xl border-slate-200 text-slate-700 hover:bg-slate-50 font-semibold h-9"
                            onClick={fetchData}
                        >
                            <Search className="h-3.5 w-3.5" />
                            Refresh Data
                        </Button>
                        <Button
                            className="gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 text-white font-semibold h-9 shadow-md shadow-purple-200 hover:opacity-90"
                            onClick={handleBatchCalc}
                            disabled={isBatchRunning}
                        >
                            {isBatchRunning ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Zap className="h-3.5 w-3.5" />}
                            Kalkulasi Batch
                        </Button>
                    </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {statCards.map((s) => (
                        <div key={s.key} className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
                            <div className={`flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br ${s.gradient} shadow-md mb-3`}>
                                <s.icon className="h-4 w-4 text-white" />
                            </div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.1em]">{s.title}</p>
                            <p className="text-2xl font-black text-slate-900 mt-1">{(stats as any)[s.key]}{s.suffix}</p>
                        </div>
                    ))}
                </div>

                {/* Table Card */}
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                    {/* Table Header */}
                    <div className="flex items-center justify-between gap-4 p-5 border-b border-slate-100">
                        <h2 className="text-base font-bold text-slate-900">Data Skor Dokter</h2>
                        <div className="relative w-64">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                            <Input
                                placeholder="Cari dokter atau spesialisasi..."
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                                className="pl-9 h-9 rounded-xl border-slate-200 bg-slate-50 text-sm focus-visible:ring-blue-400"
                            />
                        </div>
                    </div>

                    {loading ? (
                        <div className="flex items-center justify-center py-24 gap-3">
                            <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
                            <span className="text-sm text-slate-400 font-medium">Memuat data remunerasi...</span>
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-slate-50/60 hover:bg-slate-50">
                                    <TableHead className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Dokter</TableHead>
                                    <TableHead className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Spesialisasi</TableHead>
                                    <TableHead className="text-[10px] font-black text-slate-400 uppercase tracking-wider text-center">P1 (Jabatan)</TableHead>
                                    <TableHead className="text-[10px] font-black text-slate-400 uppercase tracking-wider text-center">P2 (Kinerja)</TableHead>
                                    <TableHead className="text-[10px] font-black text-slate-400 uppercase tracking-wider text-center">P3 (Perilaku)</TableHead>
                                    <TableHead className="text-[10px] font-black text-slate-400 uppercase tracking-wider text-center">Total Index</TableHead>
                                    <TableHead className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Status</TableHead>
                                    <TableHead />
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filtered.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={8} className="text-center py-16 text-slate-400 text-sm">
                                            Tidak ada data ditemukan.
                                        </TableCell>
                                    </TableRow>
                                ) : filtered.map((doc, i) => {
                                    const currentScore = doc.scores?.[0];
                                    const p1 = currentScore?.p1 ?? 80;
                                    const p2 = currentScore?.p2 ?? 75;
                                    const p3 = currentScore?.p3 ?? 85;
                                    const total = ((p1 * 0.3) + (p2 * 0.5) + (p3 * 0.2)).toFixed(2);
                                    return (
                                        <TableRow key={doc.id} className="hover:bg-blue-50/30 transition-colors group">
                                            <TableCell>
                                                <div className="flex items-center gap-3">
                                                    <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center text-white text-[10px] font-black shadow-sm">
                                                        {doc.name?.charAt(0) || "D"}
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-bold text-slate-800">{doc.name}</p>
                                                        <p className="text-[10px] text-slate-400">{doc.nip || "NIP -"}</p>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-sm text-slate-600 font-medium">{doc.specialization}</TableCell>
                                            <TableCell className="text-center">
                                                <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-black ${getScoreColor(p1)}`}>{p1}</span>
                                            </TableCell>
                                            <TableCell className="text-center">
                                                <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-black ${getScoreColor(p2)}`}>{p2}</span>
                                            </TableCell>
                                            <TableCell className="text-center">
                                                <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-black ${getScoreColor(p3)}`}>{p3}</span>
                                            </TableCell>
                                            <TableCell className="text-center">
                                                <span className="text-sm font-black text-slate-700">{total}</span>
                                            </TableCell>
                                            <TableCell>
                                                <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700">
                                                    <CheckCircle2 className="h-3 w-3" /> {currentScore ? "Dinilai" : "Belum Dinilai"}
                                                </span>
                                            </TableCell>
                                            <TableCell>
                                                <button
                                                    onClick={() => handleEdit(doc)}
                                                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-slate-500 hover:text-blue-700 hover:bg-blue-50 transition-all opacity-0 group-hover:opacity-100"
                                                >
                                                    <Edit2 className="h-3 w-3" /> Edit
                                                </button>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                    )}
                    <div className="flex items-center justify-between px-5 py-3 border-t border-slate-100 bg-slate-50/40">
                        <p className="text-xs text-slate-400 font-medium">{filtered.length} dari {doctors.length} dokter</p>
                        <p className="text-xs text-slate-400 font-medium">Periode: Mei 2026</p>
                    </div>
                </div>
            </div>

            {/* Edit Score Dialog */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="sm:max-w-xl rounded-2xl border-slate-100 max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="text-lg font-black text-slate-900">Penilaian Remunerasi Dokter</DialogTitle>
                        <DialogDescription className="text-slate-500 font-medium">
                            {selectedDoctor?.name} — {selectedDoctor?.specialization}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-6 py-4">
                        {/* P1 & P3 (Solid Inputs) */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2 p-4 bg-blue-50 rounded-2xl border border-blue-100">
                                <div className="flex items-center justify-between">
                                    <Label className="text-[11px] font-black text-blue-600 uppercase tracking-widest">P1 Jabatan</Label>
                                    <span className="text-[10px] font-black text-blue-700 bg-white px-2 py-0.5 rounded-full border border-blue-200">Bobot 30%</span>
                                </div>
                                <Input
                                    type="number" min={0} max={100}
                                    value={formData.p1}
                                    onChange={e => setFormData({ ...formData, p1: parseFloat(e.target.value) || 0 })}
                                    className="text-center font-black text-xl h-12 rounded-xl border-blue-200 bg-white"
                                />
                            </div>
                            <div className="space-y-2 p-4 bg-violet-50 rounded-2xl border border-violet-100">
                                <div className="flex items-center justify-between">
                                    <Label className="text-[11px] font-black text-violet-600 uppercase tracking-widest">P3 Perilaku</Label>
                                    <span className="text-[10px] font-black text-violet-700 bg-white px-2 py-0.5 rounded-full border border-violet-200">Bobot 20%</span>
                                </div>
                                <Input
                                    type="number" min={0} max={100}
                                    value={formData.p3}
                                    onChange={e => setFormData({ ...formData, p3: parseFloat(e.target.value) || 0 })}
                                    className="text-center font-black text-xl h-12 rounded-xl border-violet-200 bg-white"
                                />
                            </div>
                        </div>

                        {/* P2 Dynamic Indicators */}
                        <div className="space-y-3">
                            <div className="flex items-center justify-between px-1">
                                <div className="flex items-center gap-2">
                                    <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                                    <Label className="text-[11px] font-black text-slate-700 uppercase tracking-widest">P2 Kinerja — Indikator</Label>
                                </div>
                                <span className="text-[10px] font-black text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100 uppercase tracking-wider">Bobot 50%</span>
                            </div>

                            <div className="bg-slate-50 rounded-2xl border border-slate-100 p-4 space-y-4">
                                {indicators.length === 0 ? (
                                    <p className="text-xs text-slate-400 italic text-center py-4">Belum ada indikator yang dikonfigurasi.</p>
                                ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {indicators.map(ind => (
                                            <div key={ind.id} className="space-y-1.5">
                                                <div className="flex items-center justify-between">
                                                    <Label className="text-[10px] font-bold text-slate-500 uppercase leading-none">{ind.name}</Label>
                                                </div>
                                                <div className="relative">
                                                    <Input
                                                        type="number" min={0} max={100}
                                                        value={indicatorScores[ind.id] || 0}
                                                        onChange={e => {
                                                            const val = parseFloat(e.target.value) || 0;
                                                            const newScores = { ...indicatorScores, [ind.id]: val };
                                                            setIndicatorScores(newScores);

                                                            // Auto calc P2 average
                                                            const avg = (Object.values(newScores) as number[]).reduce((a: number, b: number) => a + b, 0) / indicators.length;
                                                            setFormData(prev => ({ ...prev, p2: Math.round(avg) }));
                                                        }}
                                                        className="h-9 text-right font-bold text-sm rounded-lg border-slate-200 bg-white"
                                                    />
                                                    <div className="absolute left-2.5 top-1/2 -translate-y-1/2">
                                                        {ind.type === "SKALA_SKORING" ? <Star className="h-3 w-3 text-amber-500" /> : <TrendingUp className="h-3 w-3 text-blue-500" />}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                <div className="pt-3 border-t border-slate-200 flex items-center justify-between">
                                    <span className="text-[10px] font-black text-slate-400 uppercase">Rerata Skor P2</span>
                                    <span className="text-lg font-black text-emerald-600">{formData.p2}</span>
                                </div>
                            </div>
                        </div>

                        {/* Summary */}
                        <div className="bg-slate-900 rounded-2xl p-5 flex items-center justify-between shadow-lg shadow-slate-200">
                            <div>
                                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-[0.2em]">Kalkulasi Index</span>
                                <p className="text-[10px] text-slate-500 font-medium">(P1×0.3) + (P2×0.5) + (P3×0.2)</p>
                            </div>
                            <div className="text-right">
                                <span className="text-3xl font-black text-white italic">
                                    {((formData.p1 * 0.3) + (formData.p2 * 0.5) + (formData.p3 * 0.2)).toFixed(2)}
                                </span>
                            </div>
                        </div>
                    </div>

                    <DialogFooter className="gap-2 mt-2">
                        <Button variant="outline" onClick={() => setIsDialogOpen(false)} className="rounded-xl font-semibold h-11 px-6">Batal</Button>
                        <Button
                            onClick={handleSaveScore}
                            disabled={isSubmitting}
                            className="rounded-xl bg-gradient-to-r from-blue-600 to-indigo-700 text-white font-black h-11 px-8 shadow-md shadow-blue-200 hover:opacity-90 active:scale-95 transition-all"
                        >
                            {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <CheckCircle2 className="h-4 w-4 mr-2" />}
                            Simpan Hasil Penilaian
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </DashboardLayout>
    );
}
