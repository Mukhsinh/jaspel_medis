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
    const res = await downloadAssessmentTemplate(selectedPeriod);
    if (res.success && res.data) {
      const blob = new Blob([new Uint8Array(res.data)], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = res.filename || "template_remunerasi.xlsx"; a.click();
      URL.revokeObjectURL(url);
      toast.success("Template berhasil diunduh");
    } else {
      toast.error(res.error || "Gagal mengunduh template");
    }
  };

  const handleImport = async () => {
    if (!importFile) return toast.error("Pilih file terlebih dahulu");
    if (!selectedPeriod) return toast.error("Pilih periode terlebih dahulu");
    setImporting(true);
    try {
      const buf = await importFile.arrayBuffer();
      const res = await importAssessments(Buffer.from(buf), selectedPeriod);
      if (res.success) {
        toast.success(`Berhasil import ${res.count} data penilaian`);
        if (res.errors?.length) toast.error(`${res.errors.length} baris gagal`);
        setImportDialogOpen(false);
        setImportFile(null);
        loadData(selectedPeriod);
      } else {
        toast.error(res.error || "Gagal import");
      }
    } catch (e: any) { toast.error(e.message); }
    finally { setImporting(false); }
  };

  const handleCalculate = async () => {
    if (!selectedPeriod) return toast.error("Pilih periode terlebih dahulu");
    setCalculating(true);
    const res = await calculateRemuneration(selectedPeriod);
    if (res.success) {
      toast.success(res.message || "Kalkulasi berhasil");
      setViewMode("results");
      loadData(selectedPeriod);
    } else {
      toast.error(res.error || "Gagal kalkulasi");
    }
    setCalculating(false);
  };

  const handleStatusChange = async (id: string, status: "draft" | "approved" | "paid") => {
    const res = await updateRemunerasiStatus(id, status);
    if (res.success) { toast.success("Status diupdate"); loadData(selectedPeriod); }
    else toast.error(res.error || "Gagal update status");
  };

  const toggleDoctor = async (doctorId: string) => {
    const s = new Set(expandedDoctors);
    if (s.has(doctorId)) {
      s.delete(doctorId);
    } else {
      s.add(doctorId);
      if (!penilaianDetail[doctorId]) {
        const res = await getPenilaianDetail(doctorId, selectedPeriod);
        if (res.success) setPenilaianDetail(prev => ({ ...prev, [doctorId]: res.data || [] }));
      }
    }
    setExpandedDoctors(s);
  };

  // Summary stats for results view
  const totalRemunerasi = results.reduce((s, r) => s + r.remunerasi_final, 0);
  const avgPir = results.length > 0 ? results[0].pir : 0;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-4">
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
          <div className="flex items-end gap-3 flex-wrap">
            <div>
              <Label className="text-xs text-slate-500 mb-1 block font-bold">Periode</Label>
              <Select value={selectedPeriod} onValueChange={v => setSelectedPeriod(v || "")}>
                <SelectTrigger className="w-40 bg-white border-slate-200">
                  <SelectValue placeholder="Pilih periode" />
                </SelectTrigger>
                <SelectContent className="bg-white">
                  {periods.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <Button variant="outline" onClick={handleDownloadTemplate} disabled={!selectedPeriod}
              className="gap-2 bg-amber-50 border-amber-200 text-amber-700 hover:bg-amber-100">
              <Download className="h-4 w-4" /> Template
            </Button>
            <Button variant="outline" onClick={() => setImportDialogOpen(true)} disabled={!selectedPeriod}
              className="gap-2 bg-violet-50 border-violet-200 text-violet-700 hover:bg-violet-100">
              <Upload className="h-4 w-4" /> Import Volume
            </Button>
            <Button onClick={handleCalculate} disabled={calculating || !selectedPeriod}
              className="gap-2 bg-gradient-to-r from-emerald-600 to-teal-600">
              {calculating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Calculator className="h-4 w-4" />}
              Hitung Remunerasi
            </Button>
          </div>
        </div>

        {/* View toggle */}
        <div className="flex gap-2">
          {(["doctors", "results"] as const).map(mode => (
            <button key={mode} onClick={() => setViewMode(mode)}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${viewMode === mode
                ? "bg-emerald-600 text-white shadow-sm"
                : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
                }`}>
              {mode === "doctors" ? `Daftar Dokter (${doctors.length})` : `Hasil Remunerasi (${results.length})`}
            </button>
          ))}
        </div>

        {/* Summary cards — results view */}
        {viewMode === "results" && results.length > 0 && (
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-white rounded-2xl border border-slate-200 p-5">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Total Remunerasi</p>
              <p className="text-xl font-black text-emerald-600">{fmt(totalRemunerasi)}</p>
            </div>
            <div className="bg-white rounded-2xl border border-slate-200 p-5">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">PIR (Nilai Konversi)</p>
              <p className="text-xl font-black text-blue-600">
                {new Intl.NumberFormat("id-ID", { maximumFractionDigits: 4 }).format(avgPir)}
              </p>
            </div>
            <div className="bg-white rounded-2xl border border-slate-200 p-5">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Jumlah Dokter</p>
              <p className="text-xl font-black text-slate-700">{results.length}</p>
            </div>
          </div>
        )}

        {/* Main table */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-6 w-6 animate-spin text-emerald-500" />
            </div>
          ) : viewMode === "doctors" ? (
            doctors.length === 0 ? (
              <div className="text-center py-20 text-slate-400">
                <FileSpreadsheet className="h-12 w-12 mx-auto mb-3 text-slate-300" />
                <p className="font-medium">Belum ada data dokter untuk periode ini</p>
                <p className="text-sm mt-1">Import data pooling pendapatan terlebih dahulu</p>
              </div>
            ) : (
              <Table>
                <TableHeader className="bg-slate-50">
                  <TableRow>
                    <TableHead className="w-10"></TableHead>
                    <TableHead className="font-bold text-slate-600">Dokter</TableHead>
                    <TableHead className="font-bold text-slate-600">Spesialisasi</TableHead>
                    <TableHead className="text-right font-bold text-slate-600">Pendapatan Klaim</TableHead>
                    <TableHead className="text-right font-bold text-slate-600">Pooling 17%</TableHead>
                    <TableHead className="text-center font-bold text-slate-600">Volume Input</TableHead>
                    <TableHead className="text-center font-bold text-slate-600">Hasil</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {doctors.map(doc => (
                    <Fragment key={doc.doctor_id}>
                      <TableRow className="hover:bg-emerald-50/30">
                        <TableCell>
                          <button onClick={() => toggleDoctor(doc.doctor_id)} className="text-slate-400 hover:text-emerald-600">
                            {expandedDoctors.has(doc.doctor_id)
                              ? <ChevronDown className="h-4 w-4" />
                              : <ChevronRight className="h-4 w-4" />}
                          </button>
                        </TableCell>
                        <TableCell className="font-semibold text-slate-900">{doc.doctor_name}</TableCell>
                        <TableCell className="text-slate-600 text-sm">{doc.spesialisasi}</TableCell>
                        <TableCell className="text-right font-semibold">{fmt(doc.pendapatan)}</TableCell>
                        <TableCell className="text-right text-emerald-600 font-semibold">{fmt(doc.pooling_medis)}</TableCell>
                        <TableCell className="text-center">
                          {doc.has_assessment
                            ? <CheckCircle className="h-4 w-4 text-emerald-500 mx-auto" />
                            : <span className="text-xs text-slate-400">Belum diisi</span>}
                        </TableCell>
                        <TableCell className="text-center">
                          {doc.has_hasil
                            ? <CheckCircle className="h-4 w-4 text-blue-500 mx-auto" />
                            : <span className="text-xs text-slate-400">Belum dihitung</span>}
                        </TableCell>
                      </TableRow>
                      {expandedDoctors.has(doc.doctor_id) && (
                        <TableRow>
                          <TableCell colSpan={7} className="bg-slate-50/60 p-4 pl-12">
                            {!penilaianDetail[doc.doctor_id] ? (
                              <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
                            ) : penilaianDetail[doc.doctor_id].length === 0 ? (
                              <p className="text-xs text-slate-400">Belum ada data penilaian. Download template dan import volume.</p>
                            ) : (
                              <div className="space-y-1">
                                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Detail Penilaian</p>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                                  {penilaianDetail[doc.doctor_id].map((p: any, i: number) => (
                                    <div key={i} className="p-2 bg-white rounded-lg border border-slate-200">
                                      <p className="text-[10px] text-emerald-600 font-bold uppercase">{(p.tarif as any)?.name || (p.indeks as any)?.nama || "—"}</p>
                                      <p className="text-[10px] text-slate-500 truncate">{p.patient_name ? `${p.patient_name} (${p.rm_no})` : "Tanpa Pasien"}</p>
                                      <div className="flex items-center justify-between mt-1 pt-1 border-t border-slate-50">
                                        <span className="text-xs text-slate-500">Vol: {p.volume ?? "—"}</span>
                                        <span className="text-xs font-bold text-emerald-600">{fmt(p.nilai)}</span>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                                <p className="text-xs text-slate-500 mt-2 font-semibold">
                                  Total Skor: {fmt(penilaianDetail[doc.doctor_id].reduce((s: number, p: any) => s + parseFloat(p.nilai || 0), 0))}
                                </p>
                              </div>
                            )}
                          </TableCell>
                        </TableRow>
                      )}
                    </Fragment>
                  ))}
                </TableBody>
              </Table>
            )
          ) : results.length === 0 ? (
            <div className="text-center py-20 text-slate-400">
              <Calculator className="h-12 w-12 mx-auto mb-3 text-slate-300" />
              <p className="font-medium">Belum ada hasil remunerasi</p>
              <p className="text-sm mt-1">Import volume aktivitas lalu klik Hitung Remunerasi</p>
            </div>
          ) : (
            <Table>
              <TableHeader className="bg-slate-50">
                <TableRow>
                  <TableHead className="font-bold text-slate-600">Dokter</TableHead>
                  <TableHead className="font-bold text-slate-600">Spesialisasi</TableHead>
                  <TableHead className="text-right font-bold text-slate-600">Total Skor</TableHead>
                  <TableHead className="text-right font-bold text-slate-600">PIR</TableHead>
                  <TableHead className="text-right font-bold text-slate-600">Remunerasi Final</TableHead>
                  <TableHead className="text-center font-bold text-slate-600">Status</TableHead>
                  <TableHead className="text-center font-bold text-slate-600">Ubah Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {results.map(r => (
                  <TableRow key={r.id} className="hover:bg-emerald-50/30">
                    <TableCell className="font-semibold text-slate-900">{r.doctor_name}</TableCell>
                    <TableCell className="text-slate-600 text-sm">{r.spesialisasi}</TableCell>
                    <TableCell className="text-right font-mono text-sm">{fmt(r.total_indeks)}</TableCell>
                    <TableCell className="text-right font-mono text-sm text-blue-600">
                      {new Intl.NumberFormat("id-ID", { maximumFractionDigits: 4 }).format(r.pir)}
                    </TableCell>
                    <TableCell className="text-right font-bold text-emerald-700 text-base">{fmt(r.remunerasi_final)}</TableCell>
                    <TableCell className="text-center">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${STATUS_STYLE[r.status] || STATUS_STYLE.draft}`}>
                        {r.status}
                      </span>
                    </TableCell>
                    <TableCell className="text-center">
                      <Select value={r.status} onValueChange={v => handleStatusChange(r.id, v as any)}>
                        <SelectTrigger className="h-7 w-28 text-xs bg-white border-slate-200">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-white">
                          <SelectItem value="draft">Draft</SelectItem>
                          <SelectItem value="approved">Approved</SelectItem>
                          <SelectItem value="paid">Paid</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      </div>

      {/* Import Dialog */}
      <Dialog open={importDialogOpen} onOpenChange={v => { setImportDialogOpen(v); if (!v) { setImportFile(null); if (fileInputRef.current) fileInputRef.current.value = ""; } }}>
        <DialogContent className="sm:max-w-[500px] p-0 border border-slate-200 shadow-2xl overflow-hidden bg-white">
          <div className="bg-gradient-to-r from-emerald-600 to-teal-600 p-6 text-white">
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              <Upload className="h-5 w-5" /> Import Volume Aktivitas
            </DialogTitle>
            <DialogDescription className="text-emerald-100 text-sm mt-1">
              Upload file Excel template yang sudah diisi volume per tindakan.
            </DialogDescription>
          </div>
          <div className="p-6 space-y-4 bg-white">
            <div className="flex items-start gap-2 p-3 rounded-lg bg-blue-50 border border-blue-100">
              <Info className="h-4 w-4 text-blue-500 shrink-0 mt-0.5" />
              <p className="text-xs text-blue-700">
                Isi kolom volume pada setiap tindakan. Sistem akan mengalikan volume × tarif jasa pelayanan medis untuk menghasilkan nilai skor.
              </p>
            </div>
            <div
              className="border-2 border-dashed border-slate-200 rounded-xl p-8 text-center cursor-pointer hover:border-emerald-400 hover:bg-emerald-50/30 transition-colors bg-white"
              onClick={() => fileInputRef.current?.click()}
            >
              <input ref={fileInputRef} type="file" accept=".xlsx,.xls" className="hidden"
                onChange={e => { if (e.target.files?.[0]) setImportFile(e.target.files[0]); }} />
              {importFile ? (
                <div className="flex items-center justify-center gap-3">
                  <FileSpreadsheet className="h-6 w-6 text-emerald-500" />
                  <div className="text-left">
                    <p className="text-sm font-bold text-slate-900">{importFile.name}</p>
                    <p className="text-xs text-slate-400">{(importFile.size / 1024).toFixed(1)} KB</p>
                  </div>
                  <button type="button" onClick={e => { e.stopPropagation(); setImportFile(null); if (fileInputRef.current) fileInputRef.current.value = ""; }}
                    className="ml-2 h-7 w-7 rounded-full hover:bg-slate-100 flex items-center justify-center">
                    <X className="h-4 w-4 text-slate-400" />
                  </button>
                </div>
              ) : (
                <>
                  <Upload className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                  <p className="text-sm font-bold text-slate-500">Klik untuk pilih file Excel</p>
                  <p className="text-xs text-slate-400 mt-1">.xlsx atau .xls</p>
                </>
              )}
            </div>
          </div>
          <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
            <Button variant="ghost" onClick={() => setImportDialogOpen(false)} disabled={importing} className="font-bold text-slate-400">Batal</Button>
            <Button onClick={handleImport} disabled={importing || !importFile}
              className="bg-emerald-600 hover:bg-emerald-700 font-bold shadow-lg shadow-emerald-100">
              {importing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              Import
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
