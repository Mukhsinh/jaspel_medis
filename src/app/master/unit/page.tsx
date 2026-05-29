"use client";

import { useState, useEffect } from "react";
import DashboardLayout from "@/components/layout/dashboard-layout";
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from "@/components/ui/table";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
    Plus, Search, Filter, MoreVertical, Edit, Trash2, Download, Building2,
    Loader2
} from "lucide-react";
import {
    DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel,
    DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getUnits, createUnit, updateUnit, deleteUnit } from "./actions";
import { toast } from "sonner";

interface Unit {
    id: string;
    name: string;
    installation: string;
    room: string | null;
    createdAt: Date;
    updatedAt: Date;
}

export default function UnitMasterPage() {
    const [searchTerm, setSearchTerm] = useState("");
    const [units, setUnits] = useState<Unit[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [editingUnit, setEditingUnit] = useState<Unit | null>(null);

    // Form state
    const [formData, setFormData] = useState({
        name: "",
        installation: "",
        room: "",
    });

    const refreshData = async () => {
        setIsLoading(true);
        const data = await getUnits();
        setUnits(data as any);
        setIsLoading(false);
    };

    useEffect(() => {
        refreshData();
    }, []);

    const handleOpenAdd = () => {
        setEditingUnit(null);
        setFormData({ name: "", installation: "Rawat Jalan", room: "" });
        setIsDialogOpen(true);
    };

    const handleOpenEdit = (unit: Unit) => {
        setEditingUnit(unit);
        setFormData({
            name: unit.name,
            installation: unit.installation,
            room: unit.room || "",
        });
        setIsDialogOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            if (editingUnit) {
                const res = await updateUnit(editingUnit.id, formData);
                if (res.success) {
                    toast.success("Unit berhasil diperbarui");
                    setIsDialogOpen(false);
                    refreshData();
                } else {
                    toast.error(res.error);
                }
            } else {
                const res = await createUnit(formData);
                if (res.success) {
                    toast.success("Unit berhasil ditambahkan");
                    setIsDialogOpen(false);
                    refreshData();
                } else {
                    toast.error(res.error);
                }
            }
        } catch (error) {
            toast.error("Terjadi kesalahan sistem");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Apakah Anda yakin ingin menghapus unit ini?")) return;

        try {
            const res = await deleteUnit(id);
            if (res.success) {
                toast.success("Unit berhasil dihapus");
                refreshData();
            } else {
                toast.error(res.error);
            }
        } catch (error) {
            toast.error("Gagal menghapus unit");
        }
    };

    const filteredUnits = units.filter(u =>
        u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.installation.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <DashboardLayout>
            <div className="flex flex-col gap-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-black tracking-tight text-slate-900 border-l-4 border-blue-600 pl-4">Unit Pelayanan</h1>
                        <p className="text-slate-500 mt-1 font-medium italic">Kelola unit pelayanan dan instalasi rumah sakit.</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" className="rounded-xl border-slate-200 font-bold hover:bg-slate-50">
                            <Download className="h-4 w-4 mr-2" /> Export
                        </Button>
                        <Button
                            size="sm"
                            className="bg-blue-400 hover:bg-blue-500 text-white font-black px-6 rounded-xl shadow-lg shadow-blue-100/50 transition-all"
                            onClick={handleOpenAdd}
                        >
                            <Plus className="h-4 w-4 mr-2" /> Tambah Unit
                        </Button>
                    </div>
                </div>

                <Card className="border border-slate-200 shadow-sm bg-white overflow-hidden rounded-2xl">
                    <CardHeader className="pb-3 px-6 bg-white border-b border-slate-100">
                        <div className="flex flex-col md:flex-row md:items-center gap-4">
                            <div className="relative flex-1">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                <Input
                                    placeholder="Cari nama atau instalasi unit..."
                                    className="pl-9 bg-slate-50 border-slate-200 rounded-xl focus:ring-blue-500"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                            <Button variant="outline" size="sm" className="bg-white border-slate-200 hover:bg-slate-50 rounded-xl font-bold">
                                <Filter className="h-4 w-4 mr-2" /> Filter
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent className="p-0 bg-white">
                        {isLoading ? (
                            <div className="flex items-center justify-center p-20">
                                <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
                            </div>
                        ) : (
                            <Table>
                                <TableHeader className="bg-slate-50/50 border-b border-slate-100">
                                    <TableRow>
                                        <TableHead className="px-6 font-black text-slate-400 text-[10px] uppercase tracking-widest">Nama Unit</TableHead>
                                        <TableHead className="font-black text-slate-400 text-[10px] uppercase tracking-widest">Instalasi</TableHead>
                                        <TableHead className="font-black text-slate-400 text-[10px] uppercase tracking-widest">Ruangan</TableHead>
                                        <TableHead className="font-black text-slate-400 text-[10px] uppercase tracking-widest">Tanggal Dibuat</TableHead>
                                        <TableHead className="text-right px-6 font-black text-slate-400 text-[10px] uppercase tracking-widest">Aksi</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredUnits.map((unit) => (
                                        <TableRow key={unit.id} className="hover:bg-blue-50/30 border-b border-slate-50 bg-white transition-colors group">
                                            <TableCell className="px-6">
                                                <div className="flex items-center gap-3">
                                                    <div className="h-9 w-9 rounded-xl bg-blue-50 flex items-center justify-center border border-blue-100">
                                                        <Building2 className="h-5 w-5 text-blue-600" />
                                                    </div>
                                                    <span className="font-bold text-slate-900">{unit.name}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="secondary" className="bg-slate-100 text-slate-700 font-black text-[10px] uppercase tracking-tight py-0.5 px-2">
                                                    {unit.installation}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-slate-600 text-sm font-medium">{unit.room || "-"}</TableCell>
                                            <TableCell className="text-slate-400 text-[11px] font-bold">
                                                {new Date(unit.createdAt).toLocaleDateString("id-ID", { day: 'numeric', month: 'short', year: 'numeric' })}
                                            </TableCell>
                                            <TableCell className="text-right px-6">
                                                <div className="flex items-center justify-end gap-1 transition-all">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8 rounded-lg text-blue-500 hover:text-blue-700 hover:bg-blue-50 border border-transparent hover:border-blue-100"
                                                        onClick={() => handleOpenEdit(unit)}
                                                    >
                                                        <Edit className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8 rounded-lg text-rose-500 hover:text-rose-700 hover:bg-rose-50 border border-transparent hover:border-rose-100"
                                                        onClick={() => handleDelete(unit.id)}
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        )}
                        {!isLoading && filteredUnits.length === 0 && (
                            <div className="flex flex-col items-center justify-center p-20 text-center">
                                <div className="h-16 w-16 rounded-full bg-slate-50 flex items-center justify-center mb-4">
                                    <Search className="h-8 w-8 text-slate-200" />
                                </div>
                                <h3 className="text-base font-bold text-slate-900">Unit tidak ditemukan</h3>
                                <p className="text-sm text-slate-500 max-w-[200px] mt-1">Coba gunakan kata kunci lain untuk mencari unit.</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="sm:max-w-[480px] p-0 overflow-hidden bg-white border-none shadow-2xl rounded-2xl">
                    <form onSubmit={handleSubmit}>
                        <div className="bg-blue-600 p-8 text-white relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-8 opacity-10">
                                <Building2 className="h-24 w-24" />
                            </div>
                            <DialogHeader>
                                <DialogTitle className="text-2xl font-black text-white flex items-center gap-3">
                                    <Building2 className="h-6 w-6" />
                                    {editingUnit ? "Edit Unit Pelayanan" : "Tambah Unit Baru"}
                                </DialogTitle>
                                <DialogDescription className="text-blue-100/90 font-bold mt-1 text-sm">
                                    Lengkapi data unit pelayanan untuk manajemen jaspel.
                                </DialogDescription>
                            </DialogHeader>
                        </div>
                        <div className="grid gap-6 p-8 bg-white">
                            <div className="grid gap-2">
                                <Label htmlFor="name" className="text-slate-700 font-bold text-sm">Nama Unit Pelayanan</Label>
                                <Input
                                    id="name"
                                    placeholder="Contoh: Instalasi Rawat Jalan"
                                    className="h-11 bg-slate-50 border-slate-200 rounded-xl focus:ring-blue-500 px-4 font-medium"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="installation" className="text-slate-700 font-bold text-sm">Instalasi Utama</Label>
                                <Select
                                    value={formData.installation}
                                    onValueChange={(v) => setFormData({ ...formData, installation: v ?? "" })}
                                >
                                    <SelectTrigger className="h-11 bg-slate-50 border-slate-200 rounded-xl focus:ring-blue-500 px-4 font-medium">
                                        <SelectValue placeholder="Pilih Instalasi" />
                                    </SelectTrigger>
                                    <SelectContent className="bg-white rounded-xl shadow-xl border-slate-100">
                                        <SelectItem value="Rawat Jalan" className="font-medium focus:bg-blue-50">Rawat Jalan</SelectItem>
                                        <SelectItem value="Rawat Inap" className="font-medium focus:bg-blue-50">Rawat Inap</SelectItem>
                                        <SelectItem value="IBS" className="font-medium focus:bg-blue-50">IBS (Bedah)</SelectItem>
                                        <SelectItem value="IGD" className="font-medium focus:bg-blue-50">IGD (Darurat)</SelectItem>
                                        <SelectItem value="Penunjang" className="font-medium focus:bg-blue-50">Penunjang</SelectItem>
                                        <SelectItem value="Khusus" className="font-medium focus:bg-blue-50">Layanan Khusus</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="room" className="text-slate-700 font-bold text-sm">Nama Ruangan / Poli <span className="text-slate-400 font-normal">(Opsional)</span></Label>
                                <Input
                                    id="room"
                                    placeholder="Contoh: Poliklinik Mata"
                                    className="h-11 bg-slate-50 border-slate-200 rounded-xl focus:ring-blue-500 px-4 font-medium"
                                    value={formData.room ?? ""}
                                    onChange={(e) => setFormData({ ...formData, room: e.target.value })}
                                />
                            </div>
                        </div>
                        <DialogFooter className="bg-slate-50 px-8 py-6 flex items-center justify-end gap-3 border-t border-slate-100">
                            <Button
                                type="button"
                                variant="ghost"
                                onClick={() => setIsDialogOpen(false)}
                                disabled={isSubmitting}
                                className="rounded-xl font-bold text-slate-400 hover:text-slate-600 hover:bg-slate-100 px-6 transition-all"
                            >
                                Batal
                            </Button>
                            <Button
                                type="submit"
                                disabled={isSubmitting}
                                className="rounded-xl bg-blue-400 hover:bg-blue-500 text-white font-black px-10 shadow-xl shadow-blue-100 transition-all"
                            >
                                {isSubmitting ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Menyimpan...
                                    </>
                                ) : (
                                    editingUnit ? "Simpan Perbaikan" : "Daftarkan Unit"
                                )}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </DashboardLayout>
    );
}
