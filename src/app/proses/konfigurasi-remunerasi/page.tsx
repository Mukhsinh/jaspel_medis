"use client";

import { useState, useEffect } from "react";
import DashboardLayout from "@/components/layout/dashboard-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Plus, ChevronDown, ChevronRight, Edit, Trash2, Loader2,
  FolderTree, ListTree, Activity, Save, Info, Receipt, Check
} from "lucide-react";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  getKonfigurasiTree, createKategori, updateKategori, deleteKategori,
  createIndikator, updateIndikator, deleteIndikator,
  createIndeks, updateIndeks, deleteIndeks,
  createVolumeGroup, updateVolumeGroup, deleteVolumeGroup,
  getVolumeGroups, getMasterTarifs,
} from "./actions";
import { toast } from "sonner";

interface MasterTarif {
  id: string; code: string; name: string; category: string;
  base_amount: number; jasa_pelayanan_medis: number; jaspel_pct: number;
}
interface VolumeGroup { id: string; nama: string; deskripsi?: string; satuan?: string; }
interface Indeks {
  id: string; nama: string; tipe_skema: "indeks" | "aktivitas";
  label_pengukuran?: string; skala_indeks?: number;
  volume_group_id?: string; volume_group?: VolumeGroup;
  tarif_kategori?: string[]; urutan: number;
}
interface Indikator { id: string; nama: string; deskripsi?: string; urutan: number; indeks: Indeks[]; }
interface Kategori { id: string; nama: string; deskripsi?: string; urutan: number; indikator: Indikator[]; }
type DialogMode = "kategori" | "indikator" | "indeks" | "volume" | null;

const fmt = (v: number) => `Rp ${Math.round(v || 0).toLocaleString("id-ID")}`;
const pct = (v: number) => `${(v || 0).toFixed(1)}%`;
const TARIF_CATEGORIES = ["Rawat Jalan", "Rawat Inap", "Operatif", "Penunjang", "Cathlab"];

export default function KonfigurasiRemunerasiPage() {
  const [categories, setCategories] = useState<Kategori[]>([]);
  const [volumeGroups, setVolumeGroups] = useState<VolumeGroup[]>([]);
  const [masterTarifs, setMasterTarifs] = useState<MasterTarif[]>([]);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [expandedIndicators, setExpandedIndicators] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<DialogMode>(null);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [parentId, setParentId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  // For category expand/collapse inside the indeks dialog
  const [expandedTarifCats, setExpandedTarifCats] = useState<Set<string>>(new Set());

  const [form, setForm] = useState({
    nama: "", deskripsi: "", urutan: 0,
    tipe_skema: "indeks" as "indeks" | "aktivitas",
    label_pengukuran: "", skala_indeks: 0,
    volume_group_id: "",
    tarif_kategori: [] as string[], // selected categories
    satuan: "",
  });

  // tarifs grouped by category
  const tarifByCategory = masterTarifs.reduce<Record<string, MasterTarif[]>>((acc, t) => {
    if (!acc[t.category]) acc[t.category] = [];
    acc[t.category].push(t);
    return acc;
  }, {});

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    setLoading(true);
    const [treeRes, volRes, tarifRes] = await Promise.all([
      getKonfigurasiTree(), getVolumeGroups(), getMasterTarifs(),
    ]);
    if (treeRes.success) setCategories(treeRes.data as Kategori[]);
    else toast.error(treeRes.error);
    if (volRes.success) setVolumeGroups(volRes.data as VolumeGroup[]);
    if (tarifRes.success) setMasterTarifs(tarifRes.data as MasterTarif[]);
    setLoading(false);
  };

  const toggle = (set: Set<string>, id: string) => {
    const s = new Set(set); s.has(id) ? s.delete(id) : s.add(id); return s;
  };

  const openDialog = (mode: DialogMode, item: any = null, parent: string | null = null) => {
    setDialogMode(mode); setEditingItem(item); setParentId(parent);
    setExpandedTarifCats(new Set());
    if (item) {
      setForm({
        nama: item.nama || "", deskripsi: item.deskripsi || "", urutan: item.urutan || 0,
        tipe_skema: item.tipe_skema || "indeks",
        label_pengukuran: item.label_pengukuran || "", skala_indeks: item.skala_indeks || 0,
        volume_group_id: item.volume_group_id || "",
        tarif_kategori: item.tarif_kategori || [],
        satuan: item.satuan || "",
      });
    } else {
      setForm({ nama: "", deskripsi: "", urutan: 0, tipe_skema: "indeks", label_pengukuran: "", skala_indeks: 0, volume_group_id: "", tarif_kategori: [], satuan: "" });
    }
    setDialogOpen(true);
  };

  const toggleTarifCategory = (cat: string) => {
    const selected = form.tarif_kategori.includes(cat)
      ? form.tarif_kategori.filter(c => c !== cat)
      : [...form.tarif_kategori, cat];
    setForm({ ...form, tarif_kategori: selected });
  };

  const handleSubmit = async () => {
    if (!form.nama.trim()) { toast.error("Nama harus diisi"); return; }
    setSubmitting(true);
    let result: any;
    try {
      if (dialogMode === "kategori") {
        result = editingItem
          ? await updateKategori(editingItem.id, { nama: form.nama, deskripsi: form.deskripsi, urutan: form.urutan })
          : await createKategori({ nama: form.nama, deskripsi: form.deskripsi, urutan: form.urutan });
      } else if (dialogMode === "indikator") {
        result = editingItem
          ? await updateIndikator(editingItem.id, { nama: form.nama, deskripsi: form.deskripsi, urutan: form.urutan })
          : await createIndikator({ kategori_id: parentId!, nama: form.nama, deskripsi: form.deskripsi, urutan: form.urutan });
      } else if (dialogMode === "indeks") {
        const payload = {
          nama: form.nama, tipe_skema: form.tipe_skema,
          label_pengukuran: form.label_pengukuran, skala_indeks: form.skala_indeks,
          volume_group_id: form.volume_group_id || undefined,
          tarif_kategori: form.tarif_kategori,
          urutan: form.urutan,
        };
        result = editingItem
          ? await updateIndeks(editingItem.id, payload)
          : await createIndeks({ indikator_id: parentId!, ...payload });
      } else if (dialogMode === "volume") {
        result = editingItem
          ? await updateVolumeGroup(editingItem.id, { nama: form.nama, deskripsi: form.deskripsi, satuan: form.satuan })
          : await createVolumeGroup({ nama: form.nama, deskripsi: form.deskripsi, satuan: form.satuan });
      }
      if (result?.success) {
        toast.success(editingItem ? "Berhasil diupdate" : "Berhasil ditambahkan");
        setDialogOpen(false); fetchData();
      } else toast.error(result?.error || "Terjadi kesalahan");
    } catch (e: any) { toast.error(e.message); }
    finally { setSubmitting(false); }
  };

  const handleDelete = async (type: string, id: string) => {
    if (!confirm("Yakin ingin menghapus? Data terkait juga akan terhapus.")) return;
    let result: any;
    if (type === "kategori") result = await deleteKategori(id);
    else if (type === "indikator") result = await deleteIndikator(id);
    else if (type === "indeks") result = await deleteIndeks(id);
    else if (type === "volume") result = await deleteVolumeGroup(id);
    if (result?.success) { toast.success("Berhasil dihapus"); fetchData(); }
    else toast.error(result?.error || "Gagal menghapus");
  };

  const dialogTitle = () => {
    const a = editingItem ? "Edit" : "Tambah";
    if (dialogMode === "kategori") return `${a} Kategori`;
    if (dialogMode === "indikator") return `${a} Indikator`;
    if (dialogMode === "indeks") return `${a} Indeks Pengukuran`;
    return `${a} Volume Aktivitas`;
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="h-5 w-1 rounded-full bg-gradient-to-b from-purple-500 to-indigo-600 inline-block" />
              <span className="text-xs font-bold text-purple-600 uppercase tracking-widest">Proses Jaspel</span>
            </div>
            <h1 className="text-2xl font-black tracking-tight text-slate-900">Konfigurasi Remunerasi</h1>
            <p className="text-sm text-slate-500 font-medium mt-1">Kelola kategori, indikator, dan indeks pengukuran kinerja dokter</p>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => openDialog("volume")} variant="outline" className="gap-2">
              <Activity className="h-4 w-4" /> Kelola Volume
            </Button>
            <Button onClick={() => openDialog("kategori")} className="gap-2 bg-gradient-to-r from-purple-600 to-indigo-600">
              <Plus className="h-4 w-4" /> Tambah Kategori
            </Button>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          {loading ? (
            <div className="flex items-center justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-purple-500" /></div>
          ) : categories.length === 0 ? (
            <div className="text-center py-20">
              <FolderTree className="h-12 w-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500 font-medium">Belum ada kategori</p>
            </div>
          ) : (
            <div className="space-y-2">
              {categories.map(kat => (
                <div key={kat.id} className="border border-slate-200 rounded-xl overflow-hidden">
                  <div className="flex items-center justify-between p-4 bg-gradient-to-r from-purple-50 to-indigo-50 hover:from-purple-100 hover:to-indigo-100 transition-colors">
                    <div className="flex items-center gap-3 flex-1">
                      <button onClick={() => setExpandedCategories(toggle(expandedCategories, kat.id))} className="text-purple-600">
                        {expandedCategories.has(kat.id) ? <ChevronDown className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
                      </button>
                      <FolderTree className="h-5 w-5 text-purple-600" />
                      <div>
                        <p className="font-bold text-slate-900">{kat.nama}</p>
                        {kat.deskripsi && <p className="text-xs text-slate-500">{kat.deskripsi}</p>}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button size="sm" variant="ghost" onClick={() => openDialog("indikator", null, kat.id)} className="h-8 text-xs">
                        <Plus className="h-3.5 w-3.5 mr-1" /> Indikator
                      </Button>
                      <button onClick={() => openDialog("kategori", kat)} className="h-8 w-8 rounded-lg bg-white hover:bg-purple-50 flex items-center justify-center border border-slate-200">
                        <Edit className="h-3.5 w-3.5 text-slate-500" />
                      </button>
                      <button onClick={() => handleDelete("kategori", kat.id)} className="h-8 w-8 rounded-lg bg-white hover:bg-red-50 flex items-center justify-center border border-slate-200">
                        <Trash2 className="h-3.5 w-3.5 text-red-500" />
                      </button>
                    </div>
                  </div>

                  {expandedCategories.has(kat.id) && (
                    <div className="bg-white">
                      {kat.indikator.length === 0 ? (
                        <div className="p-8 text-center text-slate-400"><ListTree className="h-8 w-8 mx-auto mb-2 opacity-50" /><p className="text-sm">Belum ada indikator</p></div>
                      ) : kat.indikator.map(ind => (
                        <div key={ind.id} className="border-t border-slate-100">
                          <div className="flex items-center justify-between p-4 pl-12 bg-white hover:bg-indigo-50/30 transition-colors">
                            <div className="flex items-center gap-3 flex-1">
                              <button onClick={() => setExpandedIndicators(toggle(expandedIndicators, ind.id))} className="text-indigo-600">
                                {expandedIndicators.has(ind.id) ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                              </button>
                              <ListTree className="h-4 w-4 text-indigo-600" />
                              <div>
                                <p className="font-semibold text-slate-800">{ind.nama}</p>
                                {ind.deskripsi && <p className="text-xs text-slate-400">{ind.deskripsi}</p>}
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Button size="sm" variant="ghost" onClick={() => openDialog("indeks", null, ind.id)} className="h-7 text-xs">
                                <Plus className="h-3 w-3 mr-1" /> Indeks
                              </Button>
                              <button onClick={() => openDialog("indikator", ind)} className="h-7 w-7 rounded-lg bg-white hover:bg-indigo-50 flex items-center justify-center border border-slate-200">
                                <Edit className="h-3 w-3 text-slate-500" />
                              </button>
                              <button onClick={() => handleDelete("indikator", ind.id)} className="h-7 w-7 rounded-lg bg-white hover:bg-red-50 flex items-center justify-center border border-slate-200">
                                <Trash2 className="h-3 w-3 text-red-500" />
                              </button>
                            </div>
                          </div>

                          {expandedIndicators.has(ind.id) && (
                            <div className="bg-slate-50/50">
                              {ind.indeks.length === 0 ? (
                                <div className="p-6 pl-20 text-center text-slate-400"><Activity className="h-6 w-6 mx-auto mb-2 opacity-50" /><p className="text-xs">Belum ada indeks</p></div>
                              ) : ind.indeks.map(idx => (
                                <div key={idx.id} className="flex items-center justify-between p-3 pl-20 border-t border-slate-100 hover:bg-white transition-colors">
                                  <div className="flex items-center gap-3 flex-1">
                                    <Activity className="h-3.5 w-3.5 text-slate-400" />
                                    <div>
                                      <p className="text-sm font-medium text-slate-700">{idx.nama}</p>
                                      <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                                        <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                                          {idx.tipe_skema === "indeks" ? "Indeks" : "Aktivitas"}
                                        </Badge>
                                        {idx.tipe_skema === "indeks" ? (
                                          <span className="text-xs text-slate-500 font-mono">{idx.label_pengukuran} = {idx.skala_indeks}</span>
                                        ) : (
                                          <>
                                            {idx.volume_group && <span className="text-xs text-slate-500">Vol: {idx.volume_group.nama}</span>}
                                            {idx.tarif_kategori && idx.tarif_kategori.length > 0 && (
                                              <span className="text-xs text-purple-600 font-medium">{idx.tarif_kategori.join(", ")}</span>
                                            )}
                                          </>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <button onClick={() => openDialog("indeks", idx)} className="h-7 w-7 rounded-lg bg-white hover:bg-blue-50 flex items-center justify-center border border-slate-200">
                                      <Edit className="h-3 w-3 text-slate-500" />
                                    </button>
                                    <button onClick={() => handleDelete("indeks", idx.id)} className="h-7 w-7 rounded-lg bg-white hover:bg-red-50 flex items-center justify-center border border-slate-200">
                                      <Trash2 className="h-3 w-3 text-red-500" />
                                    </button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[580px] p-0 border border-slate-200 shadow-2xl overflow-hidden bg-white">
          <div className="bg-gradient-to-r from-purple-600 to-indigo-600 p-6 text-white">
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              <FolderTree className="h-5 w-5" /> {dialogTitle()}
            </DialogTitle>
            <DialogDescription className="text-purple-100 text-sm mt-1">
              {dialogMode === "indeks" ? "Konfigurasi skema pengukuran indeks atau aktivitas" : "Isi detail dan simpan"}
            </DialogDescription>
          </div>

          <div className="p-6 space-y-4 bg-white max-h-[70vh] overflow-y-auto">
            {/* Nama */}
            <div className="space-y-1.5">
              <Label className="text-slate-700 font-bold text-sm">Nama</Label>
              <Input className="h-10 bg-white border-slate-200" value={form.nama}
                onChange={e => setForm({ ...form, nama: e.target.value })}
                placeholder={dialogMode === "kategori" ? "Contoh: P1 - Posisi" : dialogMode === "indikator" ? "Contoh: Kehadiran" : dialogMode === "indeks" ? "Contoh: Tindakan Operatif" : "Contoh: Volume Tindakan"} />
            </div>

            {/* Deskripsi — not for indeks */}
            {dialogMode !== "indeks" && (
              <div className="space-y-1.5">
                <Label className="text-slate-700 font-bold text-sm">Deskripsi <span className="font-normal text-slate-400">(opsional)</span></Label>
                <Textarea className="bg-white border-slate-200 resize-none" rows={2} value={form.deskripsi}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setForm({ ...form, deskripsi: e.target.value })}
                  placeholder="Deskripsi singkat" />
              </div>
            )}

            {/* Volume satuan */}
            {dialogMode === "volume" && (
              <div className="space-y-1.5">
                <Label className="text-slate-700 font-bold text-sm">Satuan <span className="font-normal text-slate-400">(opsional)</span></Label>
                <Input className="h-10 bg-white border-slate-200" value={form.satuan}
                  onChange={e => setForm({ ...form, satuan: e.target.value })} placeholder="Contoh: tindakan, kunjungan" />
              </div>
            )}

            {/* Indeks-specific */}
            {dialogMode === "indeks" && (
              <div className="p-5 rounded-xl bg-slate-50 border border-slate-100 space-y-4">
                <div className="flex items-center gap-2 text-purple-700 font-bold text-sm">
                  <Receipt className="h-4 w-4" /> Konfigurasi Skema
                </div>

                {/* Tipe skema — clean 2-option select */}
                <div className="space-y-1.5">
                  <Label className="text-slate-600 font-semibold text-sm">Tipe Skema</Label>
                  <Select value={form.tipe_skema} onValueChange={v => {
                    if (v === "indeks" || v === "aktivitas")
                      setForm({ ...form, tipe_skema: v, tarif_kategori: [], volume_group_id: "" });
                  }}>
                    <SelectTrigger className="h-10 bg-white border-slate-200"><SelectValue /></SelectTrigger>
                    <SelectContent className="bg-white">
                      <SelectItem value="indeks">Indeks</SelectItem>
                      <SelectItem value="aktivitas">Aktivitas</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {form.tipe_skema === "indeks" ? (
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-slate-600 font-semibold text-sm">Label Pengukuran</Label>
                      <Input className="h-10 bg-white border-slate-200" value={form.label_pengukuran}
                        onChange={e => setForm({ ...form, label_pengukuran: e.target.value })} placeholder="Contoh: Hadir 100%" />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-slate-600 font-semibold text-sm">Skala Indeks</Label>
                      <Input type="number" step="0.01" className="h-10 bg-white border-slate-200" value={form.skala_indeks}
                        onChange={e => setForm({ ...form, skala_indeks: parseFloat(e.target.value) || 0 })} placeholder="Contoh: 1.5" />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Volume group */}
                    <div className="space-y-1.5">
                      <Label className="text-slate-600 font-semibold text-sm">Volume Aktivitas</Label>
                      <Select value={form.volume_group_id} onValueChange={v => setForm({ ...form, volume_group_id: v || "" })}>
                        <SelectTrigger className="h-10 bg-white border-slate-200"><SelectValue placeholder="Pilih volume aktivitas" /></SelectTrigger>
                        <SelectContent className="bg-white">
                          {volumeGroups.map(vg => (
                            <SelectItem key={vg.id} value={vg.id}>{vg.nama}{vg.satuan && ` (${vg.satuan})`}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Multi-select tarif categories */}
                    <div className="space-y-2">
                      <Label className="text-slate-600 font-semibold text-sm">
                        Kategori Tarif yang Digunakan
                        <span className="ml-2 text-[10px] font-normal text-slate-400">— pilih satu atau lebih kategori</span>
                      </Label>
                      <div className="space-y-2">
                        {TARIF_CATEGORIES.map(cat => {
                          const tarifs = tarifByCategory[cat] || [];
                          const isSelected = form.tarif_kategori.includes(cat);
                          const isExpanded = expandedTarifCats.has(cat);
                          return (
                            <div key={cat} className={`rounded-xl border transition-colors ${isSelected ? "border-purple-300 bg-purple-50" : "border-slate-200 bg-white"}`}>
                              <div className="flex items-center gap-3 p-3">
                                {/* Checkbox */}
                                <button type="button" onClick={() => toggleTarifCategory(cat)}
                                  className={`h-5 w-5 rounded border-2 flex items-center justify-center shrink-0 transition-colors ${isSelected ? "bg-purple-600 border-purple-600" : "border-slate-300 bg-white"}`}>
                                  {isSelected && <Check className="h-3 w-3 text-white" />}
                                </button>
                                <span className={`font-semibold text-sm flex-1 ${isSelected ? "text-purple-800" : "text-slate-700"}`}>{cat}</span>
                                {tarifs.length > 0 && (
                                  <button type="button" onClick={() => setExpandedTarifCats(toggle(expandedTarifCats, cat))}
                                    className="text-slate-400 hover:text-slate-600 flex items-center gap-1 text-xs">
                                    <span>{tarifs.length} tarif</span>
                                    {isExpanded ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
                                  </button>
                                )}
                              </div>
                              {/* Expandable tarif list */}
                              {isExpanded && tarifs.length > 0 && (
                                <div className="border-t border-slate-100 divide-y divide-slate-50">
                                  {tarifs.map(t => (
                                    <div key={t.id} className="flex items-center justify-between px-4 py-2 pl-11">
                                      <div>
                                        <span className="font-mono text-[10px] text-blue-600 mr-2">{t.code}</span>
                                        <span className="text-xs text-slate-700">{t.name}</span>
                                      </div>
                                      <div className="flex items-center gap-3 text-xs text-right">
                                        <span className="text-emerald-600 font-semibold">{fmt(t.jasa_pelayanan_medis ?? 0)}</span>
                                        <span className="text-slate-400">{pct(t.jaspel_pct)}</span>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                      {form.tarif_kategori.length > 0 && (
                        <div className="flex items-start gap-2 mt-1">
                          <Info className="h-3 w-3 text-purple-500 mt-0.5 shrink-0" />
                          <p className="text-[10px] text-purple-600">
                            Semua tarif dari kategori terpilih akan digunakan pada halaman Remunerasi untuk input volume.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Urutan */}
            <div className="space-y-1.5">
              <Label className="text-slate-700 font-bold text-sm">Urutan</Label>
              <Input type="number" min={0} className="h-10 bg-white border-slate-200 w-28"
                value={form.urutan} onChange={e => setForm({ ...form, urutan: parseInt(e.target.value) || 0 })} />
            </div>
          </div>

          <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
            <Button variant="ghost" onClick={() => setDialogOpen(false)} disabled={submitting} className="font-bold text-slate-400">Batal</Button>
            <Button onClick={handleSubmit} disabled={submitting || !form.nama.trim()}
              className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 px-6 font-bold shadow-lg shadow-purple-100">
              {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              {editingItem ? "Simpan Perubahan" : "Simpan"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
