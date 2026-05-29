"use client";

import { useState, useEffect } from "react";
import DashboardLayout from "@/components/layout/dashboard-layout";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
    Plus, Search, Edit, Trash2, Download, UserRound, Loader2, Save, Info, Upload, FileSpreadsheet, X, Check,
} from "lucide-react";
import { Dialog, DialogContent, DialogTitle, DialogDescription, DialogHeader } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getDoctors, createDoctor, updateDoctor, deleteDoctor, downloadDoctorTemplate, importDoctors } from "./actions";
import { toast } from "sonner";

interface Doctor {
    id: string; name: string; nip: string | null; nik: string;
    specialization: string; type: string; status: string;
    ptkp: string; bank: string; accountNumber: string; bankAccountName: string;
    isActive: boolean;
}

const DOCTOR_TYPES = [
    { value: "SPESIALIS", label: "Spesialis" },
    { value: "SUB_SPESIALIS", label: "Sub Spesialis" },
    { value: "DOKTER_UMUM", label: "Dokter Umum" },
    { value: "DOKTER_GIGI", label: "Dokter Gigi" },
    { value: "MITRA", label: "Mitra" },
];

const EMPLOYMENT_STATUSES = [
    { value: "PNS", label: "PNS" },
    { value: "BLUD", label: "Non-PNS (BLUD)" },
    { value: "PPPK", label: "PPPK" },
    { value: "MITRA", label: "Mitra / Full-timer" },
];

const PTKP_OPTIONS = [
    "TK/0", "TK/1", "TK/2", "TK/3",
    "K/0", "K/1", "K/2", "K/3",
    "K/I/0", "K/I/1", "K/I/2", "K/I/3",
];

const EMPTY_FORM = {
    name: "", nip: "", nik: "", specialization: "",
    type: "SPESIALIS", status: "PNS", ptkp: "TK/0",
    bank: "", accountNumber: "", bankAccountName: "",
    isActive: true,
};

const typeLabel = (v: string) => DOCTOR_TYPES.find(t => t.value === v)?.label ?? v;
const statusLabel = (v: string) => EMPLOYMENT_STATUSES.find(s => s.value === v)?.label ?? v;

export default function DoctorMasterPage() {
    const [doctors, setDoctors] = useState<Doctor[]>([]);
    const [search, setSearch] = useState("");
    const [loading, setLoading] = useState(true);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editing, setEditing] = useState<Doctor | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [form, setForm] = useState({ ...EMPTY_FORM });
    const [importOpen, setImportOpen] = useState(false);
    const [importing, setImporting] = useState(false);
    const [importFile, setImportFile] = useState<File | null>(null);

    useEffect(() => { load(); }, []);

    const load = async () => {
        setLoading(true);
        const r = await getDoctors();
        if (r.success) setDoctors(r.data as Doctor[]);
        else toast.error(r.error);
        setLoading(false);
    };

    const openAdd = () => {
        setEditing(null);
        setForm({ ...EMPTY_FORM });
        setDialogOpen(true);
    };

    const openEdit = (doc: Doctor) => {
        setEditing(doc);
        setForm({
            name: doc.name, nip: doc.nip ?? "", nik: doc.nik,
            specialization: doc.specialization, type: doc.type, status: doc.status,
            ptkp: doc.ptkp || "TK/0",
            bank: doc.bank || "", accountNumber: doc.accountNumber || "",
            bankAccountName: doc.bankAccountName || "",
            isActive: doc.isActive,
        });
        setDialogOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        const r = editing
            ? await updateDoctor(editing.id, form)
            : await createDoctor(form);
        if (r.success) {
            toast.success(editing ? "Dokter diperbarui" : "Dokter ditambahkan");
            setDialogOpen(false);
            load();
        } else toast.error(r.error);
        setSubmitting(false);
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Hapus dokter ini?")) return;
        const r = await deleteDoctor(id);
        if (r.success) { toast.success("Dokter dihapus"); load(); }
        else toast.error(r.error);
    };

    const handleDownloadTemplate = async () => {
        const r = await downloadDoctorTemplate();
        if (r.success && r.data) {
            const blob = new Blob([new Uint8Array(r.data)], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = r.filename || "template_dokter.xlsx";
            a.click();
            URL.revokeObjectURL(url);
            toast.success("Template berhasil diunduh");
        } else {
            toast.error(r.error || "Gagal mengunduh template");
        }
    };

    const handleImport = async () => {
        if (!importFile) return;
        setImporting(true);
        try {
            const buffer = await importFile.arrayBuffer();
            const data = Array.from(new Uint8Array(buffer));
            const r = await importDoctors(data);
            if (r.success) {
                toast.success(`Berhasil mengimport ${r.count} data dokter`);
                setImportOpen(false);
                setImportFile(null);
                load();
            } else {
                toast.error(r.error || "Gagal mengimport data");
            }
        } catch (e) {
            toast.error("Terjadi kesalahan saat memproses file");
        } finally {
            setImporting(false);
        }
    };

    const filtered = doctors.filter(d =>
        d.name.toLowerCase().includes(search.toLowerCase()) ||
        (d.nip ?? "").includes(search) ||
        d.nik.includes(search)
    );

    return (
        <DashboardLayout>
            <div className="flex flex-col gap-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-slate-900 border-l-4 border-blue-600 pl-4">Master Data Dokter</h1>
                        <p className="text-slate-500 mt-1">Kelola data dokter, spesialisasi, PTKP, dan informasi rekening bank.</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" onClick={handleDownloadTemplate}
                            className="bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100">
                            <Download className="h-4 w-4 mr-2" /> Template
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => setImportOpen(true)}
                            className="bg-amber-50 border-amber-200 text-amber-700 hover:bg-amber-100">
                            <Upload className="h-4 w-4 mr-2" /> Import
                        </Button>
                        <Button size="sm" className="bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-200" onClick={openAdd}>
                            <Plus className="h-4 w-4 mr-2" /> Tambah Dokter
                        </Button>
                    </div>
                </div>

                <Card className="border border-slate-200 shadow-sm bg-white">
                    <CardHeader className="pb-3 px-6 bg-white border-b border-slate-100">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                            <Input placeholder="Cari nama, NIP, atau NIK..." className="pl-9 bg-white border-slate-200"
                                value={search} onChange={e => setSearch(e.target.value)} />
                        </div>
                    </CardHeader>
                    <CardContent className="p-0 bg-white">
                        {loading ? (
                            <div className="flex items-center justify-center p-20">
                                <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
                            </div>
                        ) : (
                            <Table>
                                <TableHeader className="bg-slate-50 border-b border-slate-100">
                                    <TableRow>
                                        <TableHead className="px-6 py-4 font-bold text-slate-600">Nama Dokter</TableHead>
                                        <TableHead className="font-bold text-slate-600">NIP / NIK</TableHead>
                                        <TableHead className="font-bold text-slate-600">Spesialisasi</TableHead>
                                        <TableHead className="font-bold text-slate-600">Status</TableHead>
                                        <TableHead className="font-bold text-slate-600">PTKP</TableHead>
                                        <TableHead className="font-bold text-slate-600">Bank</TableHead>
                                        <TableHead className="text-center font-bold text-slate-600">Aktif</TableHead>
                                        <TableHead className="text-center px-6 font-bold text-slate-600">Aksi</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filtered.map(doc => (
                                        <TableRow key={doc.id} className="hover:bg-blue-50/30 border-b border-slate-50 bg-white">
                                            <TableCell className="px-6">
                                                <div className="flex items-center gap-3">
                                                    <div className="h-9 w-9 rounded-full bg-blue-50 flex items-center justify-center border border-blue-100 shrink-0">
                                                        <UserRound className="h-4 w-4 text-blue-600" />
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-slate-900">{doc.name}</p>
                                                        <p className="text-[10px] text-blue-500 font-bold uppercase">{typeLabel(doc.type)}</p>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <p className="font-mono text-xs font-bold text-slate-700">{doc.nip || "—"}</p>
                                                <p className="font-mono text-[10px] text-slate-400">NIK: {doc.nik}</p>
                                            </TableCell>
                                            <TableCell className="text-sm font-bold text-slate-700">{doc.specialization}</TableCell>
                                            <TableCell>
                                                <Badge variant="outline" className="bg-slate-50 text-slate-600 border-slate-200 font-bold text-[10px]">
                                                    {statusLabel(doc.status)}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <span className="text-xs font-mono font-bold text-slate-600">{doc.ptkp}</span>
                                            </TableCell>
                                            <TableCell>
                                                {doc.bank ? (
                                                    <div>
                                                        <p className="text-xs font-bold text-slate-700">{doc.bank}</p>
                                                        <p className="text-[10px] text-slate-400 font-mono">{doc.accountNumber}</p>
                                                    </div>
                                                ) : (
                                                    <span className="text-xs text-slate-300">—</span>
                                                )}
                                            </TableCell>
                                            <TableCell className="text-center">
                                                {doc.isActive
                                                    ? <div className="h-2 w-2 rounded-full bg-emerald-500 mx-auto" />
                                                    : <div className="h-2 w-2 rounded-full bg-slate-300 mx-auto" />}
                                            </TableCell>
                                            <TableCell className="text-center px-6">
                                                <div className="flex items-center justify-center gap-1">
                                                    <button onClick={() => openEdit(doc)}
                                                        className="h-8 w-8 rounded-lg bg-blue-50 hover:bg-blue-100 flex items-center justify-center transition-colors">
                                                        <Edit className="h-3.5 w-3.5 text-blue-600" />
                                                    </button>
                                                    <button onClick={() => handleDelete(doc.id)}
                                                        className="h-8 w-8 rounded-lg bg-red-50 hover:bg-red-100 flex items-center justify-center transition-colors">
                                                        <Trash2 className="h-3.5 w-3.5 text-red-500" />
                                                    </button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        )}
                        {!loading && filtered.length === 0 && (
                            <div className="flex flex-col items-center justify-center p-20 text-center bg-white">
                                <UserRound className="h-12 w-12 text-slate-200 mb-4" />
                                <h3 className="text-lg font-bold text-slate-900">Belum ada data dokter</h3>
                                <div className="flex gap-3 mt-6">
                                    <Button variant="outline" className="border-emerald-600 text-emerald-600 hover:bg-emerald-50 font-bold" onClick={handleDownloadTemplate}>
                                        Unduh Template
                                    </Button>
                                    <Button variant="outline" className="border-blue-600 text-blue-600 hover:bg-blue-50 font-bold" onClick={openAdd}>
                                        Tambah Dokter Sekarang
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
                        <div className="bg-blue-600 p-6 text-white">
                            <DialogTitle className="text-xl font-bold flex items-center gap-2">
                                <UserRound className="h-5 w-5" /> {editing ? "Edit Profil Dokter" : "Tambah Dokter Baru"}
                            </DialogTitle>
                            <DialogDescription className="text-blue-100 text-sm mt-1">
                                Lengkapi data dokter termasuk PTKP dan rekening bank untuk keperluan slip insentif.
                            </DialogDescription>
                        </div>

                        <div className="p-6 space-y-5 bg-white max-h-[72vh] overflow-y-auto">
                            {/* Identitas */}
                            <div className="space-y-1.5">
                                <Label className="text-slate-700 font-bold text-sm">Nama Lengkap (beserta Gelar)</Label>
                                <Input placeholder="Contoh: dr. Sugeng Wahyudi, Sp.PD" className="h-10 bg-white border-slate-200"
                                    value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <Label className="text-slate-700 font-bold text-sm">NIP <span className="font-normal text-slate-400">(opsional)</span></Label>
                                    <Input placeholder="19xxxxxxxxxxxxxx" className="h-10 bg-white border-slate-200 font-mono"
                                        value={form.nip} onChange={e => setForm({ ...form, nip: e.target.value })} />
                                </div>
                                <div className="space-y-1.5">
                                    <Label className="text-slate-700 font-bold text-sm">NIK <span className="text-red-500">*</span></Label>
                                    <Input placeholder="16 digit NIK" className="h-10 bg-white border-slate-200 font-mono"
                                        value={form.nik} onChange={e => setForm({ ...form, nik: e.target.value })} required />
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <Label className="text-slate-700 font-bold text-sm">Spesialisasi / Keahlian</Label>
                                <Input placeholder="Contoh: Spesialis Penyakit Dalam" className="h-10 bg-white border-slate-200"
                                    value={form.specialization} onChange={e => setForm({ ...form, specialization: e.target.value })} required />
                            </div>

                            <div className="grid grid-cols-3 gap-4">
                                <div className="space-y-1.5">
                                    <Label className="text-slate-700 font-bold text-sm">Tipe Dokter</Label>
                                    <Select value={form.type} onValueChange={v => setForm({ ...form, type: v || form.type })}>
                                        <SelectTrigger className="h-10 bg-white border-slate-200"><SelectValue /></SelectTrigger>
                                        <SelectContent className="bg-white">
                                            {DOCTOR_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-1.5">
                                    <Label className="text-slate-700 font-bold text-sm">Status Kepegawaian</Label>
                                    <Select value={form.status} onValueChange={v => setForm({ ...form, status: v || form.status })}>
                                        <SelectTrigger className="h-10 bg-white border-slate-200"><SelectValue /></SelectTrigger>
                                        <SelectContent className="bg-white">
                                            {EMPLOYMENT_STATUSES.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-1.5">
                                    <Label className="text-slate-700 font-bold text-sm">Status PTKP</Label>
                                    <Select value={form.ptkp} onValueChange={v => setForm({ ...form, ptkp: v || form.ptkp })}>
                                        <SelectTrigger className="h-10 bg-white border-slate-200"><SelectValue /></SelectTrigger>
                                        <SelectContent className="bg-white">
                                            {PTKP_OPTIONS.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            {/* Bank info section */}
                            <div className="p-5 rounded-xl bg-slate-50 border border-slate-100 space-y-4">
                                <div className="flex items-center gap-2 text-blue-700 font-bold text-sm">
                                    <Save className="h-4 w-4" /> Informasi Rekening Bank
                                </div>
                                <div className="flex items-start gap-2 p-3 rounded-lg bg-blue-50 border border-blue-100">
                                    <Info className="h-3.5 w-3.5 text-blue-500 mt-0.5 shrink-0" />
                                    <p className="text-xs text-blue-700">
                                        Data rekening digunakan untuk penerbitan slip insentif dan laporan pembayaran. Nama pemilik rekening harus sesuai dengan buku tabungan.
                                    </p>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <Label className="text-slate-600 font-semibold text-sm">Nama Bank</Label>
                                        <Input placeholder="Contoh: BRI, BNI, Mandiri" className="h-10 bg-white border-slate-200"
                                            value={form.bank} onChange={e => setForm({ ...form, bank: e.target.value })} />
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label className="text-slate-600 font-semibold text-sm">Nomor Rekening</Label>
                                        <Input placeholder="Nomor rekening bank" className="h-10 bg-white border-slate-200 font-mono"
                                            value={form.accountNumber} onChange={e => setForm({ ...form, accountNumber: e.target.value })} />
                                    </div>
                                </div>
                                <div className="space-y-1.5">
                                    <Label className="text-slate-600 font-semibold text-sm">
                                        Nama Pemilik Rekening
                                        <span className="ml-2 text-[10px] font-normal text-slate-400">— harus sesuai buku tabungan</span>
                                    </Label>
                                    <Input placeholder="Nama sesuai buku tabungan" className="h-10 bg-white border-slate-200 font-bold"
                                        value={form.bankAccountName} onChange={e => setForm({ ...form, bankAccountName: e.target.value })} />
                                </div>
                            </div>
                        </div>

                        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input type="checkbox" className="h-4 w-4 rounded border-slate-300 text-blue-600"
                                    checked={form.isActive} onChange={e => setForm({ ...form, isActive: e.target.checked })} />
                                <span className="text-xs font-bold text-slate-500 uppercase">Status Aktif</span>
                            </label>
                            <div className="flex items-center gap-3">
                                <Button type="button" variant="ghost" onClick={() => setDialogOpen(false)} disabled={submitting}
                                    className="font-bold text-slate-400 hover:text-slate-600">Batal</Button>
                                <Button type="submit" disabled={submitting}
                                    className="bg-blue-600 hover:bg-blue-700 px-6 font-bold shadow-lg shadow-blue-100">
                                    {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                                    {editing ? "Simpan Perubahan" : "Simpan Dokter"}
                                </Button>
                            </div>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Import Dialog */}
            <Dialog open={importOpen} onOpenChange={setImportOpen}>
                <DialogContent className="sm:max-w-[500px] p-0 border border-slate-200 shadow-2xl overflow-hidden bg-white">
                    <DialogHeader className="bg-amber-500 p-6 text-white space-y-1">
                        <DialogTitle className="text-xl font-bold flex items-center gap-2">
                            <Upload className="h-5 w-5" /> Import Data Dokter
                        </DialogTitle>
                        <DialogDescription className="text-amber-50 text-sm">
                            Unggah file Excel berisi data dokter untuk import massal.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="p-8 space-y-6 bg-white">
                        <div className="p-4 rounded-xl bg-blue-50 border border-blue-100 flex items-start gap-3">
                            <Info className="h-5 w-5 text-blue-600 mt-0.5" />
                            <div className="text-sm text-blue-800">
                                <p className="font-bold mb-1 text-blue-900 uppercase text-[10px] tracking-wider">Instruksi Penting:</p>
                                <ul className="list-disc ml-4 space-y-1">
                                    <li>Gunakan template Excel yang sudah disediakan.</li>
                                    <li>Kolom <span className="font-bold underline">nama</span> dan <span className="font-bold underline">nik</span> wajib diisi.</li>
                                    <li>NIK yang sama akan melakukan <span className="font-bold">update</span> data (upsert).</li>
                                </ul>
                                <button onClick={handleDownloadTemplate} className="mt-3 flex items-center gap-1.5 font-bold text-blue-600 hover:text-blue-700 transition-colors">
                                    <Download className="h-3.5 w-3.5" /> Unduh Template CSV/Excel
                                </button>
                            </div>
                        </div>

                        {!importFile ? (
                            <div className="relative group">
                                <label className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50 hover:bg-blue-50/50 hover:border-blue-400 transition-all cursor-pointer group">
                                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                        <div className="h-12 w-12 rounded-full bg-white shadow-sm flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                                            <FileSpreadsheet className="h-6 w-6 text-slate-400 group-hover:text-blue-500" />
                                        </div>
                                        <p className="text-sm font-bold text-slate-600">Klik untuk pilih file Excel</p>
                                        <p className="text-xs text-slate-400 mt-1">Maksimal ukuran file 5MB (.xlsx, .xls)</p>
                                    </div>
                                    <input type="file" className="hidden" accept=".xlsx, .xls" onChange={e => setImportFile(e.target.files?.[0] || null)} />
                                </label>
                            </div>
                        ) : (
                            <div className="p-4 rounded-xl border border-blue-200 bg-blue-50/50 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="h-10 w-10 rounded-lg bg-white flex items-center justify-center border border-blue-100 italic font-bold text-blue-600">
                                        XLS
                                    </div>
                                    <div className="overflow-hidden">
                                        <p className="font-bold text-slate-700 truncate max-w-[240px]">{importFile.name}</p>
                                        <p className="text-[10px] text-slate-400 font-mono uppercase tracking-tighter">{(importFile.size / 1024).toFixed(1)} KB</p>
                                    </div>
                                </div>
                                <button onClick={() => setImportFile(null)} className="h-8 w-8 rounded-full hover:bg-white flex items-center justify-center text-slate-400 hover:text-red-500 transition-colors">
                                    <X className="h-4 w-4" />
                                </button>
                            </div>
                        )}
                    </div>

                    <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-3">
                        <Button variant="ghost" className="font-bold text-slate-400" onClick={() => setImportOpen(false)} disabled={importing}>
                            Batal
                        </Button>
                        <Button className="bg-blue-600 hover:bg-blue-700 px-8 font-bold shadow-lg shadow-blue-100" onClick={handleImport} disabled={!importFile || importing}>
                            {importing ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Mengunggah...
                                </>
                            ) : (
                                <>
                                    <Check className="mr-2 h-4 w-4" /> Mulai Import
                                </>
                            )}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </DashboardLayout>
    );
}
