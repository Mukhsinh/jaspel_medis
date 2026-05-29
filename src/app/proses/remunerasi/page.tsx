"use client";

import { useState, useEffect, useRef, useCallback, Fragment } from "react";
import DashboardLayout from "@/components/layout/dashboard-layout";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Download, Upload, Calculator, Loader2, FileSpreadsheet,
  CheckCircle, ChevronDown, ChevronRight, Save, X, Info,
} from "lucide-react";
import {
  getRemunerasiPeriods, getDoctorsForPeriod, downloadAssessmentTemplate,
  importAssessments, calculateRemuneration, getRemunerasiResults,
  updateRemunerasiStatus, getPenilaianDetail,
} from "./actions";
import { toast } from "sonner";

interface Doctor {
  doctor_id: string; doctor_name: string; spesialisasi: string;
  pendapatan: number; pooling_medis: number;
  has_assessment: boolean; has_hasil: boolean;
}
interface HasilRemunerasi {
  id: string; doctor_id: string; doctor_name: string; spesialisasi: string;
  pendapatan_dokter: number; total_indeks: number; pir: number;
  remunerasi_final: number; status: "draft" | "approved" | "paid";
}

const fmt = (v: number) =>
  new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(v || 0);

const STATUS_STYLE: Record<string, string> = {
  draft: "bg-slate-100 text-slate-600",
  approved: "bg-blue-100 text-blue-700",
  paid: "bg-emerald-100 text-emerald-700",
};

export default function RemunerasiPage() {
  const [periods, setPeriods] = useState<string[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState("");
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [results, setResults] = useState<HasilRemunerasi[]>([]);
  const [viewMode, setViewMode] = useState<"doctors" | "results">("doctors");
  const [loading, setLoading] = useState(false);
  const [calculating, setCalculating] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [expandedDoctors, setExpandedDoctors] = useState<Set<string>>(new Set());
  const [penilaianDetail, setPenilaianDetail] = useState<Record<string, any[]>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadData = useCallback(async (periode: string) => {
    setLoading(true);
    const [docRes, resRes] = await Promise.all([
      getDoctorsForPeriod(periode),
      getRemunerasiResults(periode),
    ]);
    if (docRes.success) setDoctors(docRes.data as Doctor[]);
    if (resRes.success) setResults(resRes.data as HasilRemunerasi[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    getRemunerasiPeriods().then(res => {
      if (res.success && res.data) {
        const list = res.data.map((p: any) => p.periode);
        setPeriods(list);
        if (list.length > 0) setSelectedPeriod(list[0]);
      }
    });
  }, []);

  useEffect(() => {
    if (selectedPeriod) loadData(selectedPeriod);
  }, [selectedPeriod, loadData]);

  const handleDownloadTemplate = async () => {
    if (!selectedPeriod) return toast.error("Pilih periode terlebih dahulu");
    setLoading(true);
    try {
      const res = await downloadAssessmentTemplate(selectedPeriod);
      if (res.success && res.data) {
        const blob = new Blob([new Uint8Array(res.data)], {
          type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = res.filename || `template_remunerasi_${selectedPeriod}.xlsx`;
        a.click();
        URL.revokeObjectURL(url);
        toast.success("Template berhasil diunduh");
      } else {
        toast.error(res.error || "Gagal mengunduh template");
      }
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleImport = async () => {
    if (!importFile) return toast.error("Pilih file terlebih dahulu");
    if (!selectedPeriod) return toast.error("Pilih periode terlebih dahulu");
    setImporting(true);
    try {
      const formData = new FormData();
      formData.append("file", importFile);

      const res = await importAssessments(formData, selectedPeriod);
      if (res.success) {
        toast.success(`Berhasil import ${res.count} data penilaian`);
        if (res.errors?.length) {
          res.errors.forEach((err: string) => toast.error(err, { duration: 5000 }));
        }
        setImportDialogOpen(false);
        setImportFile(null);
        loadData(selectedPeriod);
      } else {
        toast.error(res.error || "Gagal import");
      }
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setImporting(false);
    }
  };

  const handleCalculate = async () => {
    if (!selectedPeriod) return toast.error("Pilih periode terlebih dahulu");
    setCalculating(true);
    try {
      const res = await calculateRemuneration(selectedPeriod);
      if (res.success) {
        toast.success(res.message || "Kalkulasi berhasil");
        setViewMode("results");
        loadData(selectedPeriod);
      } else {
        toast.error(res.error || "Gagal kalkulasi");
      }
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setCalculating(false);
    }
  };

  const handleStatusChange = async (id: string, status: "draft" | "approved" | "paid") => {
    const res = await updateRemunerasiStatus(id, status);
    if (res.success) {
      toast.success("Status diupdate");
      loadData(selectedPeriod);
    } else {
      toast.error(res.error || "Gagal update status");
    }
  };

  const toggleDoctor = async (doctorId: string) => {
    const s = new Set(expandedDoctors);
    if (s.has(doctorId)) {
      s.delete(doctorId);
    } else {
      s.add(doctorId);
      if (!penilaianDetail[doctorId] || penilaianDetail[doctorId].length === 0) {
        const res = await getPenilaianDetail(doctorId, selectedPeriod);
        if (res.success) setPenilaianDetail(prev => ({ ...prev, [doctorId]: res.data || [] }));
      }
    }
    setExpandedDoctors(s);
  };

  const totalRemunerasi = results.reduce((s, r) => s + r.remunerasi_final, 0);
  const avgPir = results.length > 0 ? results[0].pir : 0;

  return (
    <DashboardLayout>
      <div className="space-y-6 pb-20">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="h-5 w-1 rounded-full bg-gradient-to-b from-emerald-500 to-teal-600 inline-block" />
              <span className="text-xs font-bold text-emerald-600 uppercase tracking-widest">Proses Jaspel</span>
            </div>
            <h1 className="text-2xl font-black tracking-tight text-slate-900">Remunerasi</h1>
            <p className="text-sm text-slate-500 font-medium mt-1">
              Input volume aktivitas → kalkulasi skor → PIR × skor = remunerasi per dokter
            </p>
          </div>
          <div className="flex flex-wrap items-end gap-3">
            <div className="w-full md:w-auto">
              <Label className="text-xs text-slate-500 mb-1 block font-bold">Periode</Label>
              <Select value={selectedPeriod} onValueChange={v => setSelectedPeriod(v || "")}>
                <SelectTrigger className="w-full md:w-40 bg-white border-slate-200">
                  <SelectValue placeholder="Pilih periode" />
                </SelectTrigger>
                <SelectContent className="bg-white">
                  {periods.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <Button variant="outline" onClick={handleDownloadTemplate} disabled={!selectedPeriod || loading}
              className="gap-2 bg-amber-50 border-amber-200 text-amber-700 hover:bg-amber-100 flex-1 md:flex-none h-10">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
              Template
            </Button>
            <Button variant="outline" onClick={() => setImportDialogOpen(true)} disabled={!selectedPeriod}
              className="gap-2 bg-violet-50 border-violet-200 text-violet-700 hover:bg-violet-100 flex-1 md:flex-none h-10">
              <Upload className="h-4 w-4" /> Import Volume
            </Button>
            <Button onClick={handleCalculate} disabled={calculating || !selectedPeriod}
              className="gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 w-full md:w-auto h-10 shadow-lg shadow-emerald-100">
              {calculating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Calculator className="h-4 w-4" />}
              Hitung Remunerasi
            </Button>
          </div>
        </div>

        <div className="flex gap-2 p-1 bg-slate-100 rounded-2xl w-fit overflow-x-auto max-w-full no-scrollbar">
          {(["doctors", "results"] as const).map(mode => (
            <button key={mode} onClick={() => setViewMode(mode)}
              className={`px-6 py-2 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${viewMode === mode
                ? "bg-white text-emerald-600 shadow-sm"
                : "text-slate-500 hover:text-slate-700"
                }`}>
              {mode === "doctors" ? `Daftar Dokter (${doctors.length})` : `Hasil Remunerasi (${results.length})`}
            </button>
          ))}
        </div>

        {viewMode === "results" && results.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="bg-white rounded-2xl border border-slate-200 p-6 flex flex-col justify-center">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Total Remunerasi</p>
              <p className="text-2xl font-black text-emerald-600 truncate">{fmt(totalRemunerasi)}</p>
            </div>
            <div className="bg-white rounded-2xl border border-slate-200 p-6 flex flex-col justify-center">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">PIR (Nilai Konversi)</p>
              <p className="text-2xl font-black text-blue-600">
                {new Intl.NumberFormat("id-ID", { maximumFractionDigits: 4, minimumFractionDigits: 4 }).format(avgPir)}
              </p>
            </div>
            <div className="bg-white rounded-2xl border border-slate-200 p-6 flex flex-col justify-center sm:col-span-2 lg:col-span-1">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Jumlah Dokter Terkalkulasi</p>
              <p className="text-2xl font-black text-slate-700">{results.length}</p>
            </div>
          </div>
        )}

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
            </div>
          ) : viewMode === "doctors" ? (
            doctors.length === 0 ? (
              <div className="text-center py-24 text-slate-400">
                <FileSpreadsheet className="h-16 w-16 mx-auto mb-4 text-slate-200" />
                <p className="font-bold text-lg text-slate-500">Belum ada data dokter</p>
                <p className="text-sm mt-1 max-w-sm mx-auto">Import data pooling pendapatan untuk periode ini terlebih dahulu sebelum memproses remunerasi.</p>
              </div>
            ) : (
              <div className="overflow-x-auto min-w-full">
                <Table>
                  <TableHeader className="bg-slate-50">
                    <TableRow>
                      <TableHead className="w-12 text-center"></TableHead>
                      <TableHead className="font-black text-slate-600 uppercase text-[10px] tracking-wider">Dokter</TableHead>
                      <TableHead className="font-black text-slate-600 uppercase text-[10px] tracking-wider hidden md:table-cell">Spesialisasi</TableHead>
                      <TableHead className="text-right font-black text-slate-600 uppercase text-[10px] tracking-wider">Pendapatan</TableHead>
                      <TableHead className="text-right font-black text-slate-600 uppercase text-[10px] tracking-wider hidden sm:table-cell">Pooling 17%</TableHead>
                      <TableHead className="text-center font-black text-slate-600 uppercase text-[10px] tracking-wider">Volume</TableHead>
                      <TableHead className="text-center font-black text-slate-600 uppercase text-[10px] tracking-wider">Hasil</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {doctors.map((doc, idx) => (
                      <Fragment key={`${doc.doctor_id || 'null'}-${idx}`}>
                        <TableRow className="hover:bg-emerald-50/40 transition-colors group">
                          <TableCell className="text-center">
                            <button onClick={() => toggleDoctor(doc.doctor_id)}
                              className="h-8 w-8 rounded-full border border-slate-200 flex items-center justify-center text-slate-400 hover:text-emerald-600 hover:border-emerald-200 hover:bg-emerald-50 transition-all">
                              {expandedDoctors.has(doc.doctor_id)
                                ? <ChevronDown className="h-4 w-4" />
                                : <ChevronRight className="h-4 w-4" />}
                            </button>
                          </TableCell>
                          <TableCell className="font-bold text-slate-900 leading-tight">
                            {doc.doctor_name}
                            <span className="block md:hidden text-[9px] text-slate-400 font-medium uppercase tracking-tighter mt-0.5">{doc.spesialisasi}</span>
                          </TableCell>
                          <TableCell className="text-slate-500 text-xs font-medium hidden md:table-cell">{doc.spesialisasi}</TableCell>
                          <TableCell className="text-right font-bold text-slate-900 whitespace-nowrap">{fmt(doc.pendapatan)}</TableCell>
                          <TableCell className="text-right text-emerald-600 font-bold hidden sm:table-cell">{fmt(doc.pooling_medis)}</TableCell>
                          <TableCell className="text-center">
                            {doc.has_assessment
                              ? <div className="h-6 w-6 rounded-full bg-emerald-100 flex items-center justify-center mx-auto"><CheckCircle className="h-3.5 w-3.5 text-emerald-600" /></div>
                              : <span className="text-[10px] font-bold text-slate-300 uppercase tracking-tighter">Empty</span>}
                          </TableCell>
                          <TableCell className="text-center">
                            {doc.has_hasil
                              ? <div className="h-6 w-6 rounded-full bg-blue-100 flex items-center justify-center mx-auto"><CheckCircle className="h-3.5 w-3.5 text-blue-600" /></div>
                              : <span className="text-[10px] font-bold text-slate-300 uppercase tracking-tighter">None</span>}
                          </TableCell>
                        </TableRow>
                        {expandedDoctors.has(doc.doctor_id) && (
                          <TableRow className="bg-slate-50/70 border-l-4 border-l-emerald-400">
                            <TableCell colSpan={7} className="p-0">
                              <div className="p-4 md:p-6 overflow-hidden">
                                {!penilaianDetail[doc.doctor_id] ? (
                                  <div className="flex items-center gap-2 text-slate-400 py-4 justify-center">
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    <span className="text-xs font-medium italic">Menghubungkan ke basis data untuk rincian...</span>
                                  </div>
                                ) : penilaianDetail[doc.doctor_id].length === 0 ? (
                                  <div className="bg-white p-6 rounded-2xl border border-dotted border-slate-300 text-center max-w-lg mx-auto my-2">
                                    <FileSpreadsheet className="h-8 w-8 text-slate-200 mx-auto mb-2" />
                                    <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">Detail Tidak Ditemukan</p>
                                    <p className="text-[10px] text-slate-400 mt-1">Belum ada rincian volume untuk dokter ini. Silakan gunakan fitur Import Volume dengan mengacu pada template yang disediakan.</p>
                                  </div>
                                ) : (
                                  <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Rincian Tindakan per Pasien</p>
                                      <Badge variant="outline" className="bg-white text-emerald-700 border-emerald-100 shadow-sm">
                                        Total Skor: {fmt(penilaianDetail[doc.doctor_id].reduce((s: number, p: any) => s + parseFloat(p.nilai || 0), 0))}
                                      </Badge>
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                                      {penilaianDetail[doc.doctor_id].map((p: any, i: number) => (
                                        <div key={`detail-${doc.doctor_id}-${i}`} className="p-3 bg-white rounded-xl border border-slate-200 shadow-sm hover:border-emerald-300 transition-colors group/card">
                                          <div className="flex justify-between items-start gap-2">
                                            <div>
                                              <p className="text-[10px] text-emerald-600 font-black uppercase leading-tight">
                                                {(p.tarif as any)?.name || (p.indeks as any)?.nama || "Aktivitas Medis"}
                                              </p>
                                              <p className="text-[11px] text-slate-900 font-bold mt-1 line-clamp-1">
                                                {p.patient_name || "Input Kolektif"}
                                              </p>
                                              {p.rm_no && <p className="text-[9px] text-slate-400 font-medium">REKAM MEDIS: {p.rm_no}</p>}
                                            </div>
                                            <div className="bg-emerald-50 px-2 py-1 rounded text-[10px] font-black text-emerald-700">
                                              vol {p.volume ?? 0}
                                            </div>
                                          </div>
                                          <div className="mt-3 pt-2 border-t border-slate-50 flex justify-between items-center text-right">
                                            <span className="text-[9px] text-slate-400 font-bold uppercase">Estimasi Jaspel</span>
                                            <span className="text-xs font-black text-slate-700 group-hover/card:text-emerald-600 transition-colors">{fmt(p.nilai)}</span>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        )}
                      </Fragment>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )
          ) : results.length === 0 ? (
            <div className="text-center py-24 text-slate-400">
              <Calculator className="h-16 w-16 mx-auto mb-4 text-slate-200" />
              <p className="font-bold text-lg text-slate-500">Hasil Belum Tersedia</p>
              <p className="text-sm mt-1 max-w-sm mx-auto">Input volume aktivitas dokter terlebih dahulu kemudian klik tombol Hitung untuk memproses nilai PIR.</p>
            </div>
          ) : (
            <div className="overflow-x-auto min-w-full">
              <Table>
                <TableHeader className="bg-slate-50">
                  <TableRow>
                    <TableHead className="font-black text-slate-600 uppercase text-[10px] tracking-wider">Dokter</TableHead>
                    <TableHead className="font-black text-slate-600 uppercase text-[10px] tracking-wider hidden md:table-cell">Spesialisasi</TableHead>
                    <TableHead className="text-right font-black text-slate-600 uppercase text-[10px] tracking-wider">Total Skor</TableHead>
                    <TableHead className="text-right font-black text-slate-600 uppercase text-[10px] tracking-wider hidden sm:table-cell">PIR</TableHead>
                    <TableHead className="text-right font-black text-slate-600 uppercase text-[10px] tracking-wider text-emerald-700">Remunerasi</TableHead>
                    <TableHead className="text-center font-black text-slate-600 uppercase text-[10px] tracking-wider">Status</TableHead>
                    <TableHead className="text-center font-black text-slate-600 uppercase text-[10px] tracking-wider">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {results.map((r, idx) => (
                    <TableRow key={`res-${r.id || idx}`} className="hover:bg-blue-50/40 transition-colors">
                      <TableCell className="font-bold text-slate-900">
                        {r.doctor_name}
                        <span className="block md:hidden text-[9px] text-slate-400 font-medium">{r.spesialisasi}</span>
                      </TableCell>
                      <TableCell className="text-slate-500 text-xs font-medium hidden md:table-cell">{r.spesialisasi}</TableCell>
                      <TableCell className="text-right font-mono text-xs font-bold text-slate-700">{fmt(r.total_indeks)}</TableCell>
                      <TableCell className="text-right font-mono text-xs font-black text-blue-600 hidden sm:table-cell">
                        {new Intl.NumberFormat("id-ID", { maximumFractionDigits: 4, minimumFractionDigits: 4 }).format(r.pir)}
                      </TableCell>
                      <TableCell className="text-right font-black text-emerald-700 text-base">{fmt(r.remunerasi_final)}</TableCell>
                      <TableCell className="text-center">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter ${STATUS_STYLE[r.status] || STATUS_STYLE.draft}`}>
                          {r.status}
                        </span>
                      </TableCell>
                      <TableCell className="text-center">
                        <Select value={r.status} onValueChange={v => handleStatusChange(r.id, v as any)}>
                          <SelectTrigger className="h-8 w-24 text-[10px] font-bold bg-white border-slate-200">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-white">
                            <SelectItem value="draft" className="text-xs font-bold uppercase tracking-widest text-slate-400">Draft</SelectItem>
                            <SelectItem value="approved" className="text-xs font-bold uppercase tracking-widest text-blue-500">Approve</SelectItem>
                            <SelectItem value="paid" className="text-xs font-bold uppercase tracking-widest text-emerald-600">Paid</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </div>

      <Dialog open={importDialogOpen} onOpenChange={v => { setImportDialogOpen(v); if (!v) { setImportFile(null); if (fileInputRef.current) fileInputRef.current.value = ""; } }}>
        <DialogContent className="sm:max-w-[500px] p-0 border border-slate-200 shadow-2xl overflow-hidden bg-white">
          <div className="bg-gradient-to-r from-emerald-600 to-teal-600 p-8 text-white text-center relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <Calculator className="h-24 w-24" />
            </div>
            <div className="h-12 w-12 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4 border border-white/30 backdrop-blur-sm relative z-10">
              <Upload className="h-6 w-6 text-white" />
            </div>
            <DialogTitle className="text-xl font-black relative z-10">Import Volume Aktivitas</DialogTitle>
            <DialogDescription className="text-emerald-100/80 text-xs mt-1 font-medium italic relative z-10">
              Input data kuantitas tindakan medis per dokter untuk kalkulasi insentif periode {selectedPeriod}.
            </DialogDescription>
          </div>
          <div className="p-6 space-y-6 bg-white">
            <div className="flex items-start gap-4 p-4 rounded-2xl bg-blue-50 border border-blue-100">
              <div className="h-7 w-7 rounded-lg bg-blue-600 flex items-center justify-center shrink-0 mt-0.5">
                <Info className="h-4 w-4 text-white" />
              </div>
              <p className="text-[11px] text-blue-800 font-bold leading-relaxed">
                DATA RINCI (PASIEN): Anda dapat menginput baris berulang untuk dokter yang sama dengan nama pasien berbeda. Sistem akan mengakumulasi seluruh tindakan tersebut sebagai total kinerja.
              </p>
            </div>
            <div
              className="border-2 border-dashed border-slate-200 rounded-2xl p-10 text-center cursor-pointer hover:border-emerald-400 hover:bg-emerald-50/50 transition-all bg-white group shadow-inner"
              onClick={() => fileInputRef.current?.click()}
            >
              <input ref={fileInputRef} type="file" accept=".xlsx,.xls" className="hidden"
                onChange={e => { if (e.target.files?.[0]) setImportFile(e.target.files[0]); }} />
              {importFile ? (
                <div className="flex flex-col items-center gap-2">
                  <div className="h-14 w-14 bg-emerald-50 rounded-full flex items-center justify-center mb-1">
                    <FileSpreadsheet className="h-8 w-8 text-emerald-500" />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-black text-slate-900 leading-tight">{importFile.name}</p>
                    <p className="text-[10px] text-slate-400 font-bold mt-1 uppercase tracking-widest">{(importFile.size / 1024).toFixed(1)} KB</p>
                  </div>
                  <button type="button" onClick={e => { e.stopPropagation(); setImportFile(null); if (fileInputRef.current) fileInputRef.current.value = ""; }}
                    className="mt-2 text-[10px] font-black text-red-500 uppercase hover:underline">Hapus File</button>
                </div>
              ) : (
                <>
                  <div className="h-14 w-14 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                    <Upload className="h-7 w-7 text-slate-300" />
                  </div>
                  <p className="text-sm font-black text-slate-600 uppercase tracking-tight">Unggah file Excel Volume</p>
                  <p className="text-[10px] text-slate-400 mt-1 font-bold">FORMAT .XLSX / .XLS MAKS 10MB</p>
                </>
              )}
            </div>
          </div>
          <div className="px-6 py-5 bg-slate-50 border-t border-slate-100 flex flex-col md:flex-row justify-end gap-3">
            <Button variant="outline" onClick={() => setImportDialogOpen(false)} disabled={importing} className="font-black text-slate-400 uppercase tracking-widest text-[10px]">Batal</Button>
            <Button onClick={handleImport} disabled={importing || !importFile}
              className="bg-emerald-600 hover:bg-emerald-700 font-black shadow-xl shadow-emerald-100 uppercase tracking-widest text-[10px] h-11 px-8">
              {importing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              Proses & Simpan
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
