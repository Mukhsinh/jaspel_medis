"use client";

import { useState, useEffect, useRef } from "react";
import DashboardLayout from "@/components/layout/dashboard-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Download, Upload, Edit, Trash2, Loader2,
  ChevronDown, ChevronRight, FileSpreadsheet, Calculator,
  Search, ArrowUpDown, ArrowUp, ArrowDown, Info, Save, X
} from "lucide-react";
import {
  getPoolingData, getAvailablePeriods, getSpecializations,
  importPoolingData, exportPoolingData, calculatePooling,
  updatePoolingRecord, deletePoolingRecord, getDetailBiaya,
  downloadPoolingTemplate,
} from "./actions";
import { toast } from "sonner";

interface PoolingRecord {
  id: string;
  periode_layanan: string;
  status_klaim: string;
  doctor_name: string;
  spesialisasi: string;
  patient_name: string;
  rm_no: string;
  diagnosis_grouper: string;
  nilai_klaim_inacbgs: number;
  jasa_sarana: number;
  total_biaya: number;
  deficit: number;
  pooling_medis: number;
}

const MONTHS = [
  { value: 1, label: "Januari" }, { value: 2, label: "Februari" },
  { value: 3, label: "Maret" }, { value: 4, label: "April" },
  { value: 5, label: "Mei" }, { value: 6, label: "Juni" },
  { value: 7, label: "Juli" }, { value: 8, label: "Agustus" },
  { value: 9, label: "September" }, { value: 10, label: "Oktober" },
  { value: 11, label: "November" }, { value: 12, label: "Desember" },
];

const currentYear = new Date().getFullYear();
const YEARS = Array.from({ length: 5 }, (_, i) => currentYear - i);

const fmt = (v: number) => new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(v || 0);

export default function PoolingPendapatanPage() {
  const [records, setRecords] = useState<PoolingRecord[]>([]);
  const [periods, setPeriods] = useState<string[]>([]);
  const [specializations, setSpecializations] = useState<string[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState<string>("");
  const [selectedSpecialization, setSelectedSpecialization] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");

  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [importing, setImporting] = useState(false);
  const [calculating, setCalculating] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importBulan, setImportBulan] = useState<number>(new Date().getMonth() + 1);
  const [importTahun, setImportTahun] = useState<number>(currentYear);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [detailBiaya, setDetailBiaya] = useState<Record<string, any[]>>({});

  type SortKey = "doctor_name" | "nilai_klaim_inacbgs" | "total_biaya" | "deficit" | "pooling_medis";
  const [sortKey, setSortKey] = useState<SortKey | null>(null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  const [editingRecord, setEditingRecord] = useState<PoolingRecord | null>(null);
  const [formData, setFormData] = useState({
    periode_layanan: "", status_klaim: "regular",
    doctor_name: "", spesialisasi: "", patient_name: "",
    rm_no: "", diagnosis_grouper: "",
    nilai_klaim_inacbgs: 0, jasa_sarana: 0, total_biaya: 0,
  });

  useEffect(() => { loadInitialData(); }, []);
  useEffect(() => { if (selectedPeriod) loadPoolingData(); }, [selectedPeriod, selectedSpecialization, page]);

  const loadInitialData = async () => {
    const [periodsRes, specsRes] = await Promise.all([getAvailablePeriods(), getSpecializations()]);
    if (periodsRes.success && periodsRes.data) {
      const list = periodsRes.data.map((p: any) => p.periode);
      setPeriods(list);
      if (list.length > 0) setSelectedPeriod(list[0]);
    }
    if (specsRes.success && specsRes.data) {
      setSpecializations(specsRes.data.map((s: any) => s.spesialisasi));
    }
    setLoading(false);
  };

  const loadPoolingData = async () => {
    setLoading(true);
    const result = await getPoolingData(selectedPeriod, selectedSpecialization, page, 50);
    if (result.success) {
      setRecords(result.data || []);
      if (result.pagination) setTotalPages(result.pagination.totalPages);
    } else {
      toast.error(result.error || "Gagal memuat data");
    }
    setLoading(false);
  };

  const handleDownloadTemplate = async () => {
    const result = await downloadPoolingTemplate();
    if (result.success && result.data) {
      const blob = new Blob([new Uint8Array(result.data)], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = result.filename || "template_pooling_pendapatan.xlsx"; a.click();
      URL.revokeObjectURL(url);
      toast.success("Template berhasil diunduh");
    } else {
      toast.error("Gagal mengunduh template");
    }
  };

  const handleImport = async () => {
    if (!importFile) { toast.error("Pilih file terlebih dahulu"); return; }
    setImporting(true);
    try {
      const arrayBuffer = await importFile.arrayBuffer();
      const fileData = Array.from(new Uint8Array(arrayBuffer));
      const result = await importPoolingData(fileData, importBulan, importTahun);
      if (result.success) {
        toast.success(`Berhasil import ${result.count} dari ${result.total} data`);
        if (result.errors?.length) toast.error(`${result.errors.length} baris gagal. Cek konsol.`);
        setImportDialogOpen(false);
        setImportFile(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
        loadPoolingData();
      } else {
        toast.error(result.error || "Gagal import data");
      }
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setImporting(false);
    }
  };

  const handleCalculate = async () => {
    if (!selectedPeriod) { toast.error("Pilih periode terlebih dahulu"); return; }
    setCalculating(true);
    const result = await calculatePooling(selectedPeriod);
    if (result.success) { toast.success(result.message || "Kalkulasi berhasil"); loadPoolingData(); }
    else toast.error(result.error || "Gagal kalkulasi");
    setCalculating(false);
  };

  const handleExport = async () => {
    setExporting(true);
    const result = await exportPoolingData(selectedPeriod, selectedSpecialization);
    if (result.success && result.data) {
      const blob = new Blob([new Uint8Array(result.data)], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = result.filename || "pooling_pendapatan.xlsx"; a.click();
      URL.revokeObjectURL(url);
      toast.success("Data berhasil diexport");
    } else toast.error(result.error || "Gagal export data");
    setExporting(false);
  };

  const toggleRow = async (id: string) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(id)) { newExpanded.delete(id); }
    else {
      newExpanded.add(id);
      if (!detailBiaya[id]) {
        const result = await getDetailBiaya(id);
        if (result.success) setDetailBiaya(prev => ({ ...prev, [id]: result.data || [] }));
      }
    }
    setExpandedRows(newExpanded);
  };

  const handleEdit = (record: PoolingRecord) => {
    setEditingRecord(record);
    setFormData({
      periode_layanan: record.periode_layanan.split("T")[0],
      status_klaim: record.status_klaim,
      doctor_name: record.doctor_name,
      spesialisasi: record.spesialisasi,
      patient_name: record.patient_name,
      rm_no: record.rm_no,
      diagnosis_grouper: record.diagnosis_grouper,
      nilai_klaim_inacbgs: record.nilai_klaim_inacbgs,
      jasa_sarana: record.jasa_sarana,
      total_biaya: record.total_biaya,
    });
    setEditDialogOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!editingRecord) return;
    const result = await updatePoolingRecord(editingRecord.id, formData);
    if (result.success) { toast.success("Data berhasil diupdate"); setEditDialogOpen(false); loadPoolingData(); }
    else toast.error(result.error || "Gagal update data");
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Yakin ingin menghapus data ini?")) return;
    const result = await deletePoolingRecord(id);
    if (result.success) { toast.success("Data berhasil dihapus"); loadPoolingData(); }
    else toast.error(result.error || "Gagal menghapus data");
  };

  const filteredRecords = records.filter(r =>
    r.doctor_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.patient_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.rm_no.includes(searchTerm)
  );

  const sortedRecords = sortKey
    ? [...filteredRecords].sort((a, b) => {
      const aVal = a[sortKey], bVal = b[sortKey];
      if (typeof aVal === "string") return sortDir === "asc" ? aVal.localeCompare(bVal as string) : (bVal as string).localeCompare(aVal);
      return sortDir === "asc" ? (aVal as number) - (bVal as number) : (bVal as number) - (aVal as number);
    })
    : filteredRecords;

  const handleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortKey(key); setSortDir("asc"); }
  };

  const SortIcon = ({ col }: { col: SortKey }) => {
    if (sortKey !== col) return <ArrowUpDown className="h-3 w-3 ml-1 text-slate-300 inline" />;
    return sortDir === "asc" ? <ArrowUp className="h-3 w-3 ml-1 text-emerald-500 inline" /> : <ArrowDown className="h-3 w-3 ml-1 text-emerald-500 inline" />;
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="h-5 w-1 rounded-full bg-gradient-to-b from-emerald-500 to-teal-600 inline-block" />
              <span className="text-xs font-bold text-emerald-600 uppercase tracking-widest">Proses Jaspel</span>
            </div>
            <h1 className="text-2xl font-black tracking-tight text-slate-900">Pooling Pendapatan</h1>
            <p className="text-sm text-slate-500 font-medium mt-1">Kelola data klaim INA-CBGs per dokter dengan pooling 17%</p>
          </div>
          <div className="flex gap-2">
            <Button onClick={handleDownloadTemplate} variant="outline" className="gap-2 bg-amber-50 border-amber-200 text-amber-700 hover:bg-amber-100">
              <Download className="h-4 w-4" /> Template
            </Button>
            <Button onClick={() => setImportDialogOpen(true)} variant="outline" className="gap-2 bg-violet-50 border-violet-200 text-violet-700 hover:bg-violet-100">
              <Upload className="h-4 w-4" /> Import
            </Button>
            <Button onClick={handleExport} disabled={exporting || records.length === 0} variant="outline" className="gap-2">
              {exporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileSpreadsheet className="h-4 w-4" />} Export
            </Button>
            <Button onClick={handleCalculate} disabled={calculating || !selectedPeriod} className="gap-2 bg-gradient-to-r from-emerald-600 to-teal-600">
              {calculating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Calculator className="h-4 w-4" />} Hitung Pooling
            </Button>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label className="font-bold text-slate-700 text-sm">Periode</Label>
              <Select value={selectedPeriod} onValueChange={v => setSelectedPeriod(v || "")}>
                <SelectTrigger className="bg-white border-slate-200"><SelectValue placeholder="Pilih periode" /></SelectTrigger>
                <SelectContent className="bg-white">
                  {periods.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="font-bold text-slate-700 text-sm">Spesialisasi</Label>
              <Select value={selectedSpecialization} onValueChange={v => setSelectedSpecialization(v || "")}>
                <SelectTrigger className="bg-white border-slate-200"><SelectValue placeholder="Semua spesialisasi" /></SelectTrigger>
                <SelectContent className="bg-white">
                  <SelectItem value="">Semua</SelectItem>
                  {specializations.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="font-bold text-slate-700 text-sm">Cari</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input placeholder="Nama dokter, pasien, atau RM..." className="pl-9 bg-white border-slate-200"
                  value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
              </div>
            </div>
          </div>
        </div>

        {/* Data Table */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-6 w-6 animate-spin text-emerald-500" />
            </div>
          ) : filteredRecords.length === 0 ? (
            <div className="text-center py-20">
              <FileSpreadsheet className="h-12 w-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500 font-medium">Belum ada data</p>
              <p className="text-sm text-slate-400 mt-1">Import data atau pilih periode lain</p>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader className="bg-slate-50">
                  <TableRow>
                    <TableHead className="w-10"></TableHead>
                    <TableHead><button onClick={() => handleSort("doctor_name")} className="flex items-center hover:text-emerald-600 font-bold">Dokter <SortIcon col="doctor_name" /></button></TableHead>
                    <TableHead className="font-bold text-slate-600">Pasien</TableHead>
                    <TableHead className="font-bold text-slate-600">RM / Diagnosis</TableHead>
                    <TableHead className="text-right"><button onClick={() => handleSort("nilai_klaim_inacbgs")} className="flex items-center ml-auto hover:text-emerald-600 font-bold">Nilai Klaim <SortIcon col="nilai_klaim_inacbgs" /></button></TableHead>
                    <TableHead className="text-right font-bold text-slate-600">Jasa Sarana</TableHead>
                    <TableHead className="text-right"><button onClick={() => handleSort("deficit")} className="flex items-center ml-auto hover:text-emerald-600 font-bold">Defisit <SortIcon col="deficit" /></button></TableHead>
                    <TableHead className="text-right"><button onClick={() => handleSort("pooling_medis")} className="flex items-center ml-auto hover:text-emerald-600 font-bold">Pooling 17% <SortIcon col="pooling_medis" /></button></TableHead>
                    <TableHead className="text-center font-bold text-slate-600">Status</TableHead>
                    <TableHead className="text-center font-bold text-slate-600">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedRecords.map(record => (
                    <>
                      <TableRow key={record.id} className="hover:bg-emerald-50/30">
                        <TableCell>
                          <button onClick={() => toggleRow(record.id)} className="text-slate-400 hover:text-emerald-600">
                            {expandedRows.has(record.id) ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                          </button>
                        </TableCell>
                        <TableCell>
                          <p className="font-semibold text-slate-900">{record.doctor_name}</p>
                          <p className="text-xs text-slate-500">{record.spesialisasi}</p>
                        </TableCell>
                        <TableCell><p className="font-medium text-slate-700">{record.patient_name}</p></TableCell>
                        <TableCell>
                          <p className="font-mono text-xs text-slate-600">{record.rm_no}</p>
                          <p className="text-xs text-slate-500">{record.diagnosis_grouper}</p>
                        </TableCell>
                        <TableCell className="text-right font-semibold text-slate-900">{fmt(record.nilai_klaim_inacbgs)}</TableCell>
                        <TableCell className="text-right text-slate-600">{fmt(record.jasa_sarana)}</TableCell>
                        <TableCell className="text-right">
                          {record.deficit > 0
                            ? <span className="text-red-600 font-semibold">{fmt(record.deficit)}</span>
                            : <span className="text-slate-400">-</span>}
                        </TableCell>
                        <TableCell className="text-right text-emerald-600 font-semibold">{fmt(record.pooling_medis)}</TableCell>
                        <TableCell className="text-center">
                          <Badge variant={record.status_klaim === "regular" ? "default" : "secondary"} className="capitalize">
                            {record.status_klaim}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="flex items-center justify-center gap-1">
                            <button onClick={() => handleEdit(record)} className="h-8 w-8 rounded-lg bg-blue-50 hover:bg-blue-100 flex items-center justify-center transition-colors">
                              <Edit className="h-3.5 w-3.5 text-blue-600" />
                            </button>
                            <button onClick={() => handleDelete(record.id)} className="h-8 w-8 rounded-lg bg-red-50 hover:bg-red-100 flex items-center justify-center transition-colors">
                              <Trash2 className="h-3.5 w-3.5 text-red-500" />
                            </button>
                          </div>
                        </TableCell>
                      </TableRow>
                      {expandedRows.has(record.id) && (
                        <TableRow key={`${record.id}-detail`}>
                          <TableCell colSpan={10} className="bg-slate-50/50 p-6">
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                              <div><p className="text-xs text-slate-500">Periode Layanan</p><p className="font-medium">{new Date(record.periode_layanan).toLocaleDateString("id-ID")}</p></div>
                              <div><p className="text-xs text-slate-500">Status Klaim</p><p className="font-medium capitalize">{record.status_klaim}</p></div>
                              <div><p className="text-xs text-slate-500">Nilai Klaim</p><p className="font-medium">{fmt(record.nilai_klaim_inacbgs)}</p></div>
                              <div><p className="text-xs text-slate-500">Jasa Sarana</p><p className="font-medium">{fmt(record.jasa_sarana)}</p></div>
                            </div>
                            {detailBiaya[record.id]?.length > 0 && (
                              <div className="mt-4">
                                <p className="font-semibold text-slate-900 mb-2 text-sm">Detail Biaya</p>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                                  {detailBiaya[record.id].map((d: any) => (
                                    <div key={d.id} className="p-2 bg-white rounded border border-slate-200">
                                      <p className="text-xs text-slate-500">{d.komponen_biaya}</p>
                                      <p className="font-medium text-sm">{fmt(d.nilai)}</p>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </TableCell>
                        </TableRow>
                      )}
                    </>
                  ))}
                </TableBody>
              </Table>
              {totalPages > 1 && (
                <div className="flex items-center justify-between p-4 border-t border-slate-200">
                  <p className="text-sm text-slate-500">Halaman {page} dari {totalPages}</p>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>Sebelumnya</Button>
                    <Button size="sm" variant="outline" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}>Selanjutnya</Button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Import Dialog — white background, period/year first, matches master tarif style */}
      <Dialog open={importDialogOpen} onOpenChange={v => { setImportDialogOpen(v); if (!v) { setImportFile(null); if (fileInputRef.current) fileInputRef.current.value = ""; } }}>
        <DialogContent className="sm:max-w-[560px] p-0 border border-slate-200 shadow-2xl overflow-hidden bg-white">
          <div className="bg-emerald-600 p-6 text-white">
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              <FileSpreadsheet className="h-5 w-5" /> Import Data Pooling Pendapatan
            </DialogTitle>
            <DialogDescription className="text-emerald-100 text-sm mt-1">
              Pilih periode, lalu upload file Excel sesuai template.
            </DialogDescription>
          </div>
          <div className="p-6 space-y-5 bg-white">
            {/* Step 1: Period selection */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-4">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Langkah 1 — Pilih Periode</p>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-slate-700 font-bold text-sm">Bulan</Label>
                  <Select value={String(importBulan)} onValueChange={v => setImportBulan(parseInt(v ?? "1"))}>
                    <SelectTrigger className="h-10 bg-white border-slate-200"><SelectValue /></SelectTrigger>
                    <SelectContent className="bg-white">
                      {MONTHS.map(m => <SelectItem key={m.value} value={String(m.value)}>{m.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-slate-700 font-bold text-sm">Tahun</Label>
                  <Select value={String(importTahun)} onValueChange={v => setImportTahun(parseInt(v ?? String(currentYear)))}>
                    <SelectTrigger className="h-10 bg-white border-slate-200"><SelectValue /></SelectTrigger>
                    <SelectContent className="bg-white">
                      {YEARS.map(y => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Step 2: File upload */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Langkah 2 — Upload File</p>
                <Button variant="outline" size="sm" onClick={handleDownloadTemplate}
                  className="h-7 text-xs border-emerald-300 text-emerald-600 hover:bg-emerald-50">
                  <Download className="h-3 w-3 mr-1" /> Template
                </Button>
              </div>
              <div className="flex items-center gap-2 p-3 rounded-lg bg-blue-50 border border-blue-100">
                <Info className="h-3.5 w-3.5 text-blue-500 shrink-0" />
                <p className="text-xs text-blue-700">Format: export INA-CBGs/BPJS (sheet <span className="font-mono font-bold">Rekap</span>). Kolom wajib: <span className="font-mono font-bold">dpjp, norm, nama_pasien, grouper, tarif_inacbg, nota_netto</span>. Unduh template untuk contoh lengkap.</p>
              </div>
              <div
                className="border-2 border-dashed border-slate-200 rounded-xl p-6 text-center cursor-pointer hover:border-emerald-400 hover:bg-emerald-50/30 transition-colors bg-white"
                onClick={() => fileInputRef.current?.click()}
              >
                <input ref={fileInputRef} type="file" accept=".xlsx,.xls" onChange={e => { if (e.target.files?.[0]) setImportFile(e.target.files[0]); }} className="hidden" />
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
          </div>
          <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
            <Button variant="ghost" onClick={() => setImportDialogOpen(false)} disabled={importing} className="font-bold text-slate-400">Batal</Button>
            <Button onClick={handleImport} disabled={importing || !importFile}
              className="bg-emerald-600 hover:bg-emerald-700 font-bold shadow-lg shadow-emerald-100">
              {importing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
              Import Data
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-[600px] p-0 border border-slate-200 shadow-2xl overflow-hidden bg-white">
          <div className="bg-blue-600 p-6 text-white">
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              <Edit className="h-5 w-5" /> Edit Data Pooling
            </DialogTitle>
            <DialogDescription className="text-blue-100 text-sm mt-1">Perbarui data klaim pooling pendapatan.</DialogDescription>
          </div>
          <div className="p-6 space-y-4 bg-white">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-slate-700 font-bold text-sm">Periode Layanan</Label>
                <Input type="date" className="h-10 bg-white border-slate-200"
                  value={formData.periode_layanan} onChange={e => setFormData({ ...formData, periode_layanan: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-slate-700 font-bold text-sm">Status Klaim</Label>
                <Select value={formData.status_klaim} onValueChange={v => setFormData({ ...formData, status_klaim: v || "regular" })}>
                  <SelectTrigger className="h-10 bg-white border-slate-200"><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-white">
                    <SelectItem value="regular">Regular</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-slate-700 font-bold text-sm">Nama Dokter</Label>
                <Input className="h-10 bg-white border-slate-200" value={formData.doctor_name} onChange={e => setFormData({ ...formData, doctor_name: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-slate-700 font-bold text-sm">Spesialisasi</Label>
                <Input className="h-10 bg-white border-slate-200" value={formData.spesialisasi} onChange={e => setFormData({ ...formData, spesialisasi: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-slate-700 font-bold text-sm">Nama Pasien</Label>
                <Input className="h-10 bg-white border-slate-200" value={formData.patient_name} onChange={e => setFormData({ ...formData, patient_name: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-slate-700 font-bold text-sm">No RM</Label>
                <Input className="h-10 bg-white border-slate-200" value={formData.rm_no} onChange={e => setFormData({ ...formData, rm_no: e.target.value })} />
              </div>
              <div className="col-span-2 space-y-1.5">
                <Label className="text-slate-700 font-bold text-sm">Kode Grouper / Diagnosis</Label>
                <Input className="h-10 bg-white border-slate-200" value={formData.diagnosis_grouper} onChange={e => setFormData({ ...formData, diagnosis_grouper: e.target.value })} />
              </div>
            </div>
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-3">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Nilai Keuangan</p>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-slate-600 font-semibold text-sm">Nilai Klaim INA-CBGs</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">Rp</span>
                    <Input type="number" min={0} className="pl-10 h-10 bg-white border-slate-200 font-bold"
                      value={formData.nilai_klaim_inacbgs} onChange={e => setFormData({ ...formData, nilai_klaim_inacbgs: parseFloat(e.target.value) || 0 })} />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-slate-600 font-semibold text-sm">Jasa Sarana</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">Rp</span>
                    <Input type="number" min={0} className="pl-10 h-10 bg-white border-slate-200 font-bold"
                      value={formData.jasa_sarana} onChange={e => setFormData({ ...formData, jasa_sarana: parseFloat(e.target.value) || 0 })} />
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
            <Button variant="ghost" onClick={() => setEditDialogOpen(false)} className="font-bold text-slate-400">Batal</Button>
            <Button onClick={handleSaveEdit} className="bg-blue-600 hover:bg-blue-700 font-bold shadow-lg shadow-blue-100">
              <Save className="mr-2 h-4 w-4" /> Simpan Perubahan
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
