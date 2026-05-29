"use client";

import { useState, useEffect, useRef } from "react";
import DashboardLayout from "@/components/layout/dashboard-layout";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
    Plus, Search, Edit, Trash2, Download, Stethoscope, Loader2,
    Calculator, Save, Info, Upload, FileSpreadsheet, X
} from "lucide-react";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getTariffs, createTariff, updateTariff, deleteTariff, importTariffs } from "./actions";
import { toast } from "sonner";
import * as XLSX from "xlsx";

interface Tariff {
    id: string;
    code: string;
    name: string;
    category: string;
    base_amount: number;
    jasa_pelayanan_medis: number;
    jasa_pelayanan_non_medis: number;
    jasa_pelayanan: number;
    jasa_sarana: number;
    jaspel_pct: number;
    is_active: boolean;
}

const CATEGORIES = ["Rawat Jalan", "Rawat Inap", "Operatif", "Penunjang", "Cathlab"];
const fmt = (v: number) => `Rp ${Math.round(v ?? 0).toLocaleString("id-ID")}`;
const pct = (v: number) => `${(v ?? 0).toFixed(1)}%`;

export default function TariffMasterPage() {
    const [tariffs, setTariffs] = useState<Tariff[]>([]);
    const [search, setSearch] = useState("");
    const [loading, setLoading] = useState(true);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [importOpen, setImportOpen] = useState(false);
    const [editing, setEditing] = useState<Tariff | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [importFile, setImportFile] = useState<File | null>(null);
    const [importPreview, setImportPreview] = useState<string[][]>([]);
    const [importing, setImporting] = useState(false);
    const fileRef = useRef<HTMLInputElement>(null);

    const [form, setForm] = useState({
        code: "", name: "", category: "Rawat Jalan",
        jasa_pelayanan_medis: 0,
        jasa_pelayanan_non_medis: 0,
        jasa_sarana: 0,
        is_active: true,
    });

    // Kalkulasi otomatis
    const total_jasa_pelayanan = form.jasa_pelayanan_medis + form.jasa_pelayanan_non_medis;
    const tarif_total = total_jasa_pelayanan + form.jasa_sarana;
    const jaspel_medis_pct = tarif_total > 0 ? (form.jasa_pelayanan_medis / tarif_total) * 100 : 0;

    const load = async () => {
        setLoading(true);
        const r = await getTariffs();
        if (r.success) setTariffs(r.data as Tariff[]);
        else toast.error(r.error ?? "Gagal memuat data");
        setLoading(false);
    };

    useEffect(() => { load(); }, []);

    const openAdd = () => {
        setEditing(null);
        setForm({ code: "", name: "", category: "Rawat Jalan", jasa_pelayanan_medis: 0, jasa_pelayanan_non_medis: 0, jasa_sarana: 0, is_active: true });
        setDialogOpen(true);
    };

    const openEdit = (t: Tariff) => {
        setEditing(t);
        setForm({
            code: t.code, name: t.name, category: t.category,
            jasa_pelayanan_medis: t.jasa_pelayanan_medis ?? 0,
            jasa_pelayanan_non_medis: t.jasa_pelayanan_non_medis ?? 0,
            jasa_sarana: t.jasa_sarana ?? 0,
            is_active: t.is_active,
        });
        setDialogOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        const payload = {
            code: form.code, name: form.name, category: form.category,
            base_amount: tarif_total,
            jasa_pelayanan_medis: form.jasa_pelayanan_medis,
            jasa_pelayanan_non_medis: form.jasa_pelayanan_non_medis,
            jasa_pelayanan: total_jasa_pelayanan,
            jasa_sarana: form.jasa_sarana,
            jaspel_pct: jaspel_medis_pct,
            is_active: form.is_active,
        };
        const r = editing ? await updateTariff(editing.id, payload) : await createTariff(payload);
        if (r.success) {
            toast.success(editing ? "Tarif diperbarui" : "Tarif ditambahkan");
            setDialogOpen(false); load();
        } else toast.error(r.error ?? "Gagal menyimpan");
        setSubmitting(false);
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Hapus tarif ini?")) return;
        const r = await deleteTariff(id);
        if (r.success) { toast.success("Tarif dihapus"); load(); }
        else toast.error(r.error ?? "Gagal menghapus");
    };

    const downloadTemplate = () => {
        const data = [
            ["kode", "nama_tindakan", "kategori", "jasa_pelayanan_medis", "jasa_pelayanan_non_medis", "jasa_sarana"],
            ["T-RJ-001", "Konsultasi Dokter Spesialis", "Rawat Jalan", 90000, 30000, 30000],
            ["T-RI-001", "Visite Dokter Spesialis", "Rawat Inap", 120000, 40000, 40000],
            ["T-OP-001", "Operasi Katarak", "Operatif", 2500000, 750000, 1750000],
        ];
        const ws = XLSX.utils.aoa_to_sheet(data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
        const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });
        const blob = new Blob([buf], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url; a.download = "template_tarif.xlsx"; a.click();
        URL.revokeObjectURL(url);
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setImportFile(file);

        const reader = new FileReader();
        reader.onload = (ev) => {
            try {
                const data = new Uint8Array(ev.target?.result as ArrayBuffer);
                const workbook = XLSX.read(data, { type: "array" });
                const sheet = workbook.Sheets[workbook.SheetNames[0]];
                const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as any[][];
                setImportPreview(rows.slice(0, 5));
            } catch (err) {
                toast.error("Gagal membaca file Excel");
            }
        };
        reader.readAsArrayBuffer(file);
    };

    const handleImport = async () => {
        if (!importFile) return;
        setImporting(true);
        try {
            const formData = new FormData();
            formData.append("file", importFile);
            const result = await importTariffs(formData);
            if (result.success) {
                toast.success(`${result.count} tarif berhasil diimport`);
                setImportOpen(false); setImportFile(null); setImportPreview([]);
                if (fileRef.current) fileRef.current.value = "";
                load();
            } else toast.error(result.error ?? "Gagal import");
        } catch (err: any) {
            toast.error(err.message);
        }
        setImporting(false);
    };

    const filtered = tariffs.filter(t =>
        t.name.toLowerCase().includes(search.toLowerCase()) ||
        t.code.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <DashboardLayout>
            <div className="flex flex-col gap-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-slate-900 border-l-4 border-emerald-600 pl-4">Master Tarif Layanan</h1>
                        <p className="text-slate-500 mt-1">Kelola data tarif tindakan, pembagian jasa sarana, dan jasa pelayanan.</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" className="hidden md:flex bg-white border-slate-200 text-slate-600 hover:bg-slate-50" onClick={downloadTemplate}>
                            <Download className="h-4 w-4 mr-2" /> Template
                        </Button>
                        <Button variant="outline" size="sm" className="bg-white border-slate-200 text-slate-600 hover:bg-slate-50 flex-1 md:flex-initial" onClick={() => setImportOpen(true)}>
                            <Upload className="h-4 w-4 mr-2" /> Import
                        </Button>
                        <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 shadow-lg shadow-emerald-200 flex-1 md:flex-initial" onClick={openAdd}>
                            <Plus className="h-4 w-4 mr-2" /> Tambah
                        </Button>
                    </div>
                </div>

                <Card className="border border-slate-200 shadow-sm bg-white overflow-hidden">
                    <CardHeader className="pb-3 px-6 bg-white border-b border-slate-100">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                            <Input placeholder="Cari nama tindakan atau kode..." className="pl-9 bg-white border-slate-200"
                                value={search} onChange={e => setSearch(e.target.value)} />
                        </div>
                    </CardHeader>
                    <CardContent className="p-0 bg-white">
                        {loading ? (
                            <div className="flex items-center justify-center p-20">
                                <Loader2 className="h-8 w-8 text-emerald-600 animate-spin" />
                            </div>
                        ) : (
                            <div className="table-container">
                                <Table>
                                    <TableHeader className="bg-slate-50 border-b border-slate-100">
                                        <TableRow>
                                            <TableHead className="px-6 py-4 font-bold text-slate-600">Nama & Kode</TableHead>
                                            <TableHead className="font-bold text-slate-600 hide-on-mobile">Kategori</TableHead>
                                            <TableHead className="font-bold text-slate-600 hide-on-mobile">Jasa Sarana</TableHead>
                                            <TableHead className="font-bold text-slate-600 text-blue-600">Jaspel Medis</TableHead>
                                            <TableHead className="font-bold text-slate-600 hide-on-mobile">Non-Medis</TableHead>
                                            <TableHead className="font-bold text-slate-600 bg-slate-100/50">Total</TableHead>
                                            <TableHead className="font-bold text-slate-600 text-center hide-on-mobile">% Medis</TableHead>
                                            <TableHead className="text-center px-6 font-bold text-slate-600">Aksi</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {filtered.map(t => (
                                            <TableRow key={t.id} className="hover:bg-emerald-50/30 border-b border-slate-50 bg-white">
                                                <TableCell className="px-6 py-3">
                                                    <p className="font-bold text-slate-900 leading-tight">{t.name}</p>
                                                    <p className="font-mono text-[10px] text-slate-400 font-bold uppercase">{t.code}</p>
                                                </TableCell>
                                                <TableCell className="hide-on-mobile">
                                                    <Badge variant="outline" className="bg-blue-50 text-blue-600 border-blue-100 font-bold text-[10px]">
                                                        {t.category}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-sm font-medium text-slate-600 hide-on-mobile">{fmt(t.jasa_sarana)}</TableCell>
                                                <TableCell className="text-sm font-bold text-blue-600">{fmt(t.jasa_pelayanan_medis)}</TableCell>
                                                <TableCell className="text-sm font-medium text-slate-600 hide-on-mobile">{fmt(t.jasa_pelayanan_non_medis)}</TableCell>
                                                <TableCell className="text-sm font-bold text-slate-900 bg-slate-50/50">{fmt(t.base_amount)}</TableCell>
                                                <TableCell className="text-center font-mono text-xs font-bold text-emerald-600 hide-on-mobile">
                                                    {pct(t.jaspel_pct)}
                                                </TableCell>
                                                <TableCell className="text-center px-6">
                                                    <div className="flex items-center justify-center gap-1">
                                                        <button onClick={() => openEdit(t)}
                                                            className="h-8 w-8 rounded-lg bg-emerald-50 hover:bg-emerald-100 flex items-center justify-center transition-colors">
                                                            <Edit className="h-3.5 w-3.5 text-emerald-600" />
                                                        </button>
                                                        <button onClick={() => handleDelete(t.id)}
                                                            className="h-8 w-8 rounded-lg bg-red-50 hover:bg-red-100 flex items-center justify-center transition-colors">
                                                            <Trash2 className="h-3.5 w-3.5 text-red-500" />
                                                        </button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        )}
                        {!loading && filtered.length === 0 && (
                            <div className="flex flex-col items-center justify-center p-20 text-center bg-white">
                                <Calculator className="h-12 w-12 text-slate-200 mb-4" />
                                <h3 className="text-lg font-bold text-slate-900">Belum ada data tarif</h3>
                                <div className="flex flex-wrap items-center justify-center gap-3 mt-6">
                                    <Button variant="outline" className="border-emerald-600 text-emerald-600 hover:bg-emerald-50 font-bold" onClick={openAdd}>
                                        <Plus className="h-4 w-4 mr-2" /> Tambah Manual
                                    </Button>
                                    <Button variant="outline" className="border-slate-200 text-slate-600 hover:bg-slate-50 font-bold" onClick={downloadTemplate}>
                                        <Download className="h-4 w-4 mr-2" /> Unduh Template
                                    </Button>
                                    <Button className="bg-emerald-600 hover:bg-emerald-700 font-bold" onClick={() => setImportOpen(true)}>
                                        <Upload className="h-4 w-4 mr-2" /> Import CSV
                                    </Button>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Add/Edit Dialog */}
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent className="sm:max-w-[640px] p-0 border border-slate-200 shadow-2xl overflow-hidden bg-white">
                    <form onSubmit={handleSubmit}>
                        <div className="bg-emerald-600 p-6 text-white">
                            <DialogTitle className="text-xl font-bold flex items-center gap-2">
                                <Calculator className="h-5 w-5" /> {editing ? "Edit Tarif Layanan" : "Tambah Tarif Layanan Baru"}
                            </DialogTitle>
                            <DialogDescription className="text-emerald-100 text-sm mt-1">
                                Masukkan rincian tarif tindakan dan pembagian jasa sarana & pelayanan.
                            </DialogDescription>
                        </div>

                        <div className="p-6 space-y-6 bg-white">
                            <div className="grid grid-cols-3 gap-4">
                                <div className="col-span-1 space-y-1.5">
                                    <Label className="text-slate-700 font-bold text-sm">Kode Tarif</Label>
                                    <Input placeholder="T-RJ-001" className="h-10 bg-white border-slate-200 font-mono"
                                        value={form.code} onChange={e => setForm({ ...form, code: e.target.value })} required />
                                </div>
                                <div className="col-span-2 space-y-1.5">
                                    <Label className="text-slate-700 font-bold text-sm">Nama Tindakan/Layanan</Label>
                                    <Input placeholder="Contoh: Konsultasi Dokter Spesialis" className="h-10 bg-white border-slate-200"
                                        value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <Label className="text-slate-700 font-bold text-sm">Kategori Layanan</Label>
                                <Select value={form.category} onValueChange={v => setForm({ ...form, category: v || "" })}>
                                    <SelectTrigger className="h-10 bg-white border-slate-200"><SelectValue /></SelectTrigger>
                                    <SelectContent className="bg-white">
                                        {CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="grid grid-cols-2 gap-6 pt-2">
                                <div className="space-y-4">
                                    <div className="flex items-center gap-2 text-slate-400 font-bold text-xs uppercase tracking-wider">
                                        <Info className="h-3 w-3" /> Biaya Sarana
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label className="text-slate-600 font-semibold text-sm">Jasa Sarana (Alat/BHP/RS)</Label>
                                        <div className="relative">
                                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">Rp</span>
                                            <Input type="number" className="h-10 pl-10 bg-white border-slate-200 font-mono font-bold"
                                                value={form.jasa_sarana} onChange={e => setForm({ ...form, jasa_sarana: parseInt(e.target.value) || 0 })} />
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-4 p-5 rounded-xl bg-blue-50 border border-blue-100">
                                    <div className="flex items-center gap-2 text-blue-700 font-bold text-xs uppercase tracking-wider">
                                        <Calculator className="h-3 w-3" /> Jasa Pelayanan (Jaspel)
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label className="text-blue-700 font-semibold text-sm">Jaspel Medis (Dokter)</Label>
                                        <div className="relative">
                                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-400 text-sm">Rp</span>
                                            <Input type="number" className="h-10 pl-10 bg-white border-blue-200 text-blue-700 font-mono font-bold focus-visible:ring-blue-500"
                                                value={form.jasa_pelayanan_medis} onChange={e => setForm({ ...form, jasa_pelayanan_medis: parseInt(e.target.value) || 0 })} />
                                        </div>
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label className="text-slate-600 font-semibold text-sm">Jaspel Non-Medis (Paramedis/Lainnya)</Label>
                                        <div className="relative">
                                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">Rp</span>
                                            <Input type="number" className="h-10 pl-10 bg-white border-slate-200 font-mono"
                                                value={form.jasa_pelayanan_non_medis} onChange={e => setForm({ ...form, jasa_pelayanan_non_medis: parseInt(e.target.value) || 0 })} />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="p-4 rounded-xl bg-slate-900 text-white flex items-center justify-between shadow-lg">
                                <div>
                                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Estimasi Total Tarif</p>
                                    <p className="text-2xl font-bold">{fmt(tarif_total)}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Porsi Medis</p>
                                    <Badge className="bg-emerald-500 text-white border-none font-bold text-sm">
                                        {pct(jaspel_medis_pct)}
                                    </Badge>
                                </div>
                            </div>
                        </div>

                        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input type="checkbox" className="h-4 w-4 rounded border-slate-300 text-emerald-600"
                                    checked={form.is_active} onChange={e => setForm({ ...form, is_active: e.target.checked })} />
                                <span className="text-xs font-bold text-slate-500 uppercase">Tarif Aktif</span>
                            </label>
                            <div className="flex items-center gap-3">
                                <Button type="button" variant="ghost" onClick={() => setDialogOpen(false)} disabled={submitting}
                                    className="font-bold text-slate-400 hover:text-slate-600">Batal</Button>
                                <Button type="submit" disabled={submitting}
                                    className="bg-emerald-600 hover:bg-emerald-700 px-6 font-bold shadow-lg shadow-emerald-100">
                                    {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                                    {editing ? "Simpan Perubahan" : "Simpan Tarif"}
                                </Button>
                            </div>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Import Dialog */}
            <Dialog open={importOpen} onOpenChange={setImportOpen}>
                <DialogContent className="sm:max-w-[600px] p-0 bg-white">
                    <div className="bg-slate-900 p-6 text-white">
                        <DialogTitle className="text-xl font-bold flex items-center gap-2 text-white">
                            <Upload className="h-5 w-5" /> Import Data Tarif
                        </DialogTitle>
                        <DialogDescription className="text-slate-400 text-sm mt-1">
                            Gunakan file CSV untuk mengimport data tarif dalam jumlah banyak sekaligus.
                        </DialogDescription>
                    </div>

                    <div className="p-6 space-y-6 bg-white">
                        <div className="p-4 rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 flex flex-col items-center justify-center text-center">
                            <input type="file" accept=".csv" className="hidden" id="csv-file" ref={fileRef} onChange={handleFileChange} />
                            {importFile ? (
                                <div className="space-y-2 w-full">
                                    <div className="flex items-center justify-between p-3 bg-white border border-slate-200 rounded-lg">
                                        <div className="flex items-center gap-2">
                                            <FileSpreadsheet className="h-5 w-5 text-emerald-600" />
                                            <span className="text-sm font-bold text-slate-700">{importFile.name}</span>
                                        </div>
                                        <button onClick={() => { setImportFile(null); setImportPreview([]); if (fileRef.current) fileRef.current.value = ""; }}
                                            className="text-slate-400 hover:text-red-500">
                                            <X className="h-4 w-4" />
                                        </button>
                                    </div>

                                    {importPreview.length > 0 && (
                                        <div className="mt-4 text-left">
                                            <p className="text-[10px] font-bold text-slate-400 uppercase mb-2">Preview Data (5 baris pertama):</p>
                                            <div className="max-h-[150px] overflow-auto rounded border border-slate-100">
                                                <Table className="text-[10px]">
                                                    <TableHeader className="bg-slate-50 sticky top-0">
                                                        <TableRow>
                                                            <TableHead className="py-1">Kode</TableHead>
                                                            <TableHead className="py-1">Nama</TableHead>
                                                            <TableHead className="py-1 text-right">Total</TableHead>
                                                        </TableRow>
                                                    </TableHeader>
                                                    <TableBody>
                                                        {importPreview.map((r, i) => (
                                                            <TableRow key={i}>
                                                                <TableCell className="py-1 py-1 text-slate-500">{r[0]}</TableCell>
                                                                <TableCell className="py-1 font-medium">{r[1]}</TableCell>
                                                                <TableCell className="py-1 text-right font-mono text-blue-600">
                                                                    {fmt((parseInt(r[3]) || 0) + (parseInt(r[4]) || 0) + (parseInt(r[5]) || 0))}
                                                                </TableCell>
                                                            </TableRow>
                                                        ))}
                                                    </TableBody>
                                                </Table>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <label htmlFor="csv-file" className="cursor-pointer space-y-2 py-4">
                                    <div className="h-12 w-12 rounded-full bg-slate-200 flex items-center justify-center mx-auto mb-2">
                                        <FileSpreadsheet className="h-6 w-6 text-slate-500" />
                                    </div>
                                    <p className="text-sm font-bold text-slate-600">Klik untuk pilih file CSV</p>
                                    <p className="text-xs text-slate-400">Pastikan format kolom sudah sesuai template</p>
                                </label>
                            )}
                        </div>

                        <div className="flex items-start gap-4 p-4 rounded-xl bg-amber-50 border border-amber-100">
                            <Info className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
                            <div className="space-y-1">
                                <p className="text-xs font-bold text-amber-800">Tips Import</p>
                                <p className="text-xs text-amber-700 leading-relaxed">
                                    Unduh template di bawah jika Anda belum memiliki format yang benar. Import akan menimpa data jika kode tarif sama.
                                </p>
                                <button onClick={downloadTemplate} className="text-[10px] font-bold text-amber-600 hover:underline flex items-center mt-2">
                                    <Download className="h-3 w-3 mr-1" /> Unduh Template CSV
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-3">
                        <Button variant="ghost" onClick={() => setImportOpen(false)} className="font-bold text-slate-400">Batal</Button>
                        <Button onClick={handleImport} disabled={!importFile || importing}
                            className="bg-emerald-600 hover:bg-emerald-700 font-bold px-8 shadow-lg shadow-emerald-100">
                            {importing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                            Proses Import
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </DashboardLayout>
    );
}

