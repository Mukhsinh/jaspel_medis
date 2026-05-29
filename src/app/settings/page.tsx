"use client";

import { useState, useEffect } from "react";
import DashboardLayout from "@/components/layout/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Settings, Save, Building2, Globe, Shield, Bell, Palette, Loader2, CheckCircle2, Calculator
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { getSettings, updateSettings, uploadLogo, AppSettings } from "./actions";
import { toast } from "sonner";

export default function SettingsPage() {
    const [loading, setLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [settings, setSettings] = useState<AppSettings>({
        hospitalName: "",
        govtName: "",
        province: "",
        address: "",
        phone: "",
        email: "",
        footerText: "",
        logoUrl: "",
        poolPercent: 0,
        p1Weight: 0,
        p2Weight: 0,
        p3Weight: 0,
    });

    const fetchData = async () => {
        setLoading(true);
        const result = await getSettings();
        if (result.success) {
            setSettings(result.data);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleSave = async () => {
        if (settings.p1Weight + settings.p2Weight + settings.p3Weight !== 100) {
            toast.error("Total bobot P1, P2, dan P3 harus 100%!");
            return;
        }

        setIsSaving(true);
        const result = await updateSettings(settings);
        if (result.success) {
            toast.success("Pengaturan berhasil disimpan");
            // Trigger branding update across the app
            window.dispatchEvent(new Event("brandingUpdated"));
        } else {
            toast.error(result.error);
        }
        setIsSaving(false);
    };

    if (loading) return (
        <DashboardLayout>
            <div className="h-[60vh] flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600 opacity-20" />
            </div>
        </DashboardLayout>
    );

    return (
        <DashboardLayout>
            <div className="flex flex-col gap-8">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-black tracking-tight text-slate-900">Pengaturan Sistem</h1>
                        <p className="text-slate-500 font-medium">Konfigurasi parameter institusi, alokasi pooling, dan parameter kalkulasi jaspel.</p>
                    </div>
                    <Button
                        size="sm"
                        className="bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-200 h-10 px-8 font-bold rounded-xl"
                        onClick={handleSave}
                        disabled={isSaving}
                    >
                        {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                        Simpan Perubahan
                    </Button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Hospital Info */}
                    <Card className="border-none shadow-xl shadow-slate-100/50 overflow-hidden bg-white">
                        <CardHeader className="px-8 pt-8">
                            <div className="flex items-center gap-4">
                                <div className="h-12 w-12 rounded-2xl bg-blue-50 flex items-center justify-center shadow-inner">
                                    <Building2 className="h-6 w-6 text-blue-600" />
                                </div>
                                <div>
                                    <CardTitle className="text-lg font-black text-slate-900">Profil Institusi</CardTitle>
                                    <CardDescription className="font-medium">Informasi dasar rumah sakit dan entitas hukum.</CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="px-8 pb-8 space-y-6">
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Nama Pemerintah (Pemilik)</Label>
                                <Input
                                    value={settings.govtName}
                                    onChange={(e) => setSettings({ ...settings, govtName: e.target.value })}
                                    placeholder="Contoh: Pemerintah Kabupaten Lamongan"
                                    className="bg-slate-50/50 border-slate-100 h-12 rounded-xl font-bold focus-visible:ring-blue-500"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Nama Rumah Sakit</Label>
                                <Input
                                    value={settings.hospitalName}
                                    onChange={(e) => setSettings({ ...settings, hospitalName: e.target.value })}
                                    className="bg-slate-50/50 border-slate-100 h-12 rounded-xl font-bold focus-visible:ring-blue-500"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Teks Footer (Copyright)</Label>
                                <Input
                                    value={settings.footerText}
                                    onChange={(e) => setSettings({ ...settings, footerText: e.target.value })}
                                    placeholder="Teks yang muncul di bagian bawah aplikasi"
                                    className="bg-slate-50/50 border-slate-100 h-12 rounded-xl font-bold focus-visible:ring-blue-500"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Logo RSUD</Label>
                                <div className="flex gap-4 items-center">
                                    {settings.logoUrl && (
                                        <div className="h-16 w-16 rounded-xl border border-slate-100 p-2 bg-slate-50 shrink-0">
                                            <img src={settings.logoUrl} alt="Logo" className="h-full w-full object-contain" />
                                        </div>
                                    )}
                                    <div className="flex-1">
                                        <Input
                                            type="file"
                                            onChange={async (e) => {
                                                const file = e.target.files?.[0];
                                                if (file) {
                                                    const formData = new FormData();
                                                    formData.append("logo", file);
                                                    const res = await uploadLogo(formData);
                                                    if (res.success && res.url) {
                                                        setSettings({ ...settings, logoUrl: res.url });
                                                        toast.success("Logo berhasil diunggah");
                                                        window.dispatchEvent(new Event("brandingUpdated"));
                                                    } else {
                                                        toast.error(res.error || "Gagal mengunggah logo");
                                                    }
                                                }
                                            }}
                                            className="bg-slate-50/50 border-slate-100 rounded-xl focus-visible:ring-blue-500"
                                        />
                                    </div>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Tipe RS</Label>
                                    <div className="h-12 flex items-center px-4 bg-slate-50 rounded-xl border border-dashed border-slate-200 text-sm font-bold text-slate-500">
                                        BLUD / Tipe B
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Status Sistem</Label>
                                    <div className="h-12 flex items-center px-4 bg-emerald-50 rounded-xl border border-emerald-100 text-[10px] font-black uppercase text-emerald-600 tracking-wider">
                                        <CheckCircle2 className="h-3.5 w-3.5 mr-2" /> Production Ready
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Remuneration Logic */}
                    <Card className="border-none shadow-xl shadow-slate-100/50 overflow-hidden bg-white">
                        <CardHeader className="px-8 pt-8">
                            <div className="flex items-center gap-4">
                                <div className="h-12 w-12 rounded-2xl bg-emerald-50 flex items-center justify-center shadow-inner">
                                    <Settings className="h-6 w-6 text-emerald-600" />
                                </div>
                                <div>
                                    <CardTitle className="text-lg font-black text-slate-900">Logika Remunerasi</CardTitle>
                                    <CardDescription className="font-medium">Konfigurasi persentase pembagian pool jasa medis.</CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="px-8 pb-8 space-y-8">
                            <div className="space-y-2">
                                <div className="flex justify-between items-end mb-1">
                                    <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Medical Pool Allocation (%)</Label>
                                    <Badge className="bg-emerald-100 text-emerald-700 border-none font-black text-[10px]">Standard SK</Badge>
                                </div>
                                <Input
                                    type="number"
                                    value={settings.poolPercent}
                                    onChange={(e) => setSettings({ ...settings, poolPercent: parseFloat(e.target.value) || 0 })}
                                    className="bg-slate-50/50 border-slate-100 h-12 rounded-xl font-bold focus-visible:ring-emerald-500"
                                />
                                <p className="text-[10px] text-slate-400 font-medium">Sesuai SK Direktur, alokasi jasa medis rata-rata adalah 17% dari Net Revenue.</p>
                            </div>

                            <div className="p-6 bg-slate-900 rounded-3xl relative overflow-hidden group">
                                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
                                    <Calculator className="h-20 w-20 text-white" />
                                </div>

                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-6">Bobot Distribusi (Total 100%)</p>

                                <div className="grid grid-cols-3 gap-6 relative z-10">
                                    {[
                                        { id: "p1", label: "P1 (Jabatan)", val: settings.p1Weight, key: "p1Weight", color: "text-blue-400" },
                                        { id: "p2", label: "P2 (Kinerja)", val: settings.p2Weight, key: "p2Weight", color: "text-emerald-400" },
                                        { id: "p3", label: "P3 (Perilaku)", val: settings.p3Weight, key: "p3Weight", color: "text-purple-400" },
                                    ].map((field) => (
                                        <div key={field.id} className="space-y-3">
                                            <Label className={`text-[9px] font-black uppercase tracking-tighter ${field.color}`}>{field.label}</Label>
                                            <Input
                                                type="number"
                                                value={field.val}
                                                onChange={(e) => setSettings({ ...settings, [field.key]: parseFloat(e.target.value) || 0 })}
                                                className="bg-white/5 border-white/10 h-12 rounded-xl text-center font-black text-white focus-visible:ring-white/20"
                                            />
                                        </div>
                                    ))}
                                </div>

                                <div className="mt-6 pt-6 border-t border-white/5 flex items-center justify-between">
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Bobot Akumulasi</span>
                                    <div className="flex items-center gap-3">
                                        <span className={`text-xl font-black ${settings.p1Weight + settings.p2Weight + settings.p3Weight === 100 ? 'text-emerald-400' : 'text-rose-500'}`}>
                                            {settings.p1Weight + settings.p2Weight + settings.p3Weight}%
                                        </span>
                                        {settings.p1Weight + settings.p2Weight + settings.p3Weight !== 100 && (
                                            <Badge variant="destructive" className="bg-rose-500/20 text-rose-500 border-none font-bold text-[9px] animate-pulse">Error</Badge>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Security & System Health */}
                    <Card className="border-none shadow-xl shadow-slate-100/50 overflow-hidden bg-white">
                        <CardHeader className="px-8 pt-8">
                            <div className="flex items-center gap-4">
                                <div className="h-12 w-12 rounded-2xl bg-orange-50 flex items-center justify-center shadow-inner">
                                    <Shield className="h-6 w-6 text-orange-600" />
                                </div>
                                <div>
                                    <CardTitle className="text-lg font-black text-slate-900">Keamanan & Audit</CardTitle>
                                    <CardDescription className="font-medium">Monitoring integritas data dan hak akses pengguna.</CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="px-8 pb-8 space-y-4">
                            {[
                                { title: "Database Encryption", desc: "AES-256 for financial records.", active: true },
                                { title: "Automated Audit Trail", desc: "Log every change in P1, P2, P3 scoring.", active: true },
                                { title: "Row Level Security", desc: "Isolate doctor data from other units.", active: true },
                            ].map((item, idx) => (
                                <div key={idx} className="flex items-center justify-between p-4 bg-slate-50/50 hover:bg-slate-50 transition-colors border border-slate-100 rounded-2xl">
                                    <div>
                                        <p className="text-sm font-bold text-slate-700">{item.title}</p>
                                        <p className="text-[10px] text-slate-400 font-medium">{item.desc}</p>
                                    </div>
                                    <Badge className="bg-emerald-50 text-emerald-700 border-none font-black text-[10px] uppercase">Active</Badge>
                                </div>
                            ))}
                        </CardContent>
                    </Card>

                    {/* Theme & Prefs */}
                    <Card className="border-none shadow-xl shadow-slate-100/50 overflow-hidden bg-white">
                        <CardHeader className="px-8 pt-8">
                            <div className="flex items-center gap-4">
                                <div className="h-12 w-12 rounded-2xl bg-purple-50 flex items-center justify-center shadow-inner">
                                    <Palette className="h-6 w-6 text-purple-600" />
                                </div>
                                <div>
                                    <CardTitle className="text-lg font-black text-slate-900">Personalisasi</CardTitle>
                                    <CardDescription className="font-medium">Penyesuaian visual antarmuka sistem.</CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="px-8 pb-8 space-y-4">
                            <div className="flex items-center justify-between p-4 bg-slate-50/50 rounded-2xl border border-slate-100">
                                <div>
                                    <p className="text-sm font-bold text-slate-700">Enterprise Dark Mode</p>
                                    <p className="text-[10px] text-slate-400 font-medium">Interface dengan kontras tinggi untuk efisiensi.</p>
                                </div>
                                <Badge variant="secondary" className="bg-slate-100 text-slate-400 font-black text-[10px] uppercase">Disabled</Badge>
                            </div>
                            <div className="p-4 bg-purple-50/50 rounded-2xl border border-purple-100">
                                <p className="text-sm font-bold text-purple-900">Experimental: AI Predictor</p>
                                <p className="text-[10px] text-purple-600/60 font-medium mb-3">Prediksi distribusi jaspel periode mendatang.</p>
                                <Button variant="outline" size="sm" className="w-full bg-white border-purple-200 text-purple-700 font-bold h-9 rounded-xl hover:bg-purple-50">
                                    Request Access
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </DashboardLayout>
    );
}

