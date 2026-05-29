"use client";

import { useState } from "react";
import DashboardLayout from "@/components/layout/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Upload,
    FileSpreadsheet,
    CheckCircle2,
    AlertCircle,
    X,
    FileDown,
    Info
} from "lucide-react";
import { Progress } from "@/components/ui/progress";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@/components/ui/table";

export default function ImportCenterPage() {
    const [file, setFile] = useState<File | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [progress, setProgress] = useState(0);
    const [isComplete, setIsComplete] = useState(false);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
            setIsComplete(false);
        }
    };

    const handleUpload = () => {
        if (!file) return;
        setIsUploading(true);
        // Simulate upload
        const interval = setInterval(() => {
            setProgress(prev => {
                if (prev >= 100) {
                    clearInterval(interval);
                    setIsUploading(false);
                    setIsComplete(true);
                    return 100;
                }
                return prev + 10;
            });
        }, 200);
    };

    return (
        <DashboardLayout>
            <div className="flex flex-col gap-6">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-slate-900">Import Center</h1>
                    <p className="text-slate-500">Unggah data klaim INACBGs untuk distribusi jasa pelayanan.</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <Card className="lg:col-span-2 border-dashed border-2 bg-slate-50/50">
                        <CardContent className="p-12">
                            <div className="flex flex-col items-center justify-center text-center">
                                <div className="h-16 w-16 rounded-full bg-blue-50 flex items-center justify-center mb-6">
                                    <Upload className="h-8 w-8 text-blue-600" />
                                </div>
                                <h3 className="text-lg font-bold text-slate-900">Pilih File Data Klaim</h3>
                                <p className="text-sm text-slate-500 max-w-sm mt-2">
                                    Gunakan format .csv atau .xlsx sesuai dengan template yang telah disediakan.
                                    Maksimal ukuran file 10MB.
                                </p>

                                <div className="mt-8 flex flex-col items-center gap-4 w-full max-w-md">
                                    {!file ? (
                                        <label className="w-full">
                                            <div className="flex items-center justify-center gap-2 w-full py-3 bg-white border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-50 transition-colors shadow-sm font-semibold text-slate-700">
                                                <FileSpreadsheet className="h-4 w-4" /> Cari File
                                            </div>
                                            <input type="file" className="hidden" accept=".csv,.xlsx" onChange={handleFileChange} />
                                        </label>
                                    ) : (
                                        <div className="w-full p-4 bg-white border border-slate-200 rounded-xl shadow-sm">
                                            <div className="flex items-center justify-between mb-2">
                                                <div className="flex items-center gap-3">
                                                    <div className="h-10 w-10 rounded-lg bg-emerald-50 flex items-center justify-center">
                                                        <FileSpreadsheet className="h-5 w-5 text-emerald-600" />
                                                    </div>
                                                    <div className="text-left">
                                                        <p className="text-sm font-bold text-slate-900 truncate max-w-[200px]">{file.name}</p>
                                                        <p className="text-[10px] text-slate-400 uppercase font-medium">{(file.size / 1024).toFixed(1)} KB</p>
                                                    </div>
                                                </div>
                                                {!isUploading && !isComplete && (
                                                    <button onClick={() => setFile(null)} className="text-slate-400 hover:text-red-500">
                                                        <X className="h-4 w-4" />
                                                    </button>
                                                )}
                                                {isComplete && <CheckCircle2 className="h-5 w-5 text-emerald-500" />}
                                            </div>

                                            {isUploading && (
                                                <div className="space-y-2 mt-4">
                                                    <Progress value={progress} className="h-1.5" />
                                                    <p className="text-[10px] text-center text-slate-500 font-bold uppercase tracking-widest">Memproses {progress}%</p>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {!isComplete && (
                                        <Button
                                            onClick={handleUpload}
                                            disabled={!file || isUploading}
                                            className="w-full bg-blue-600 hover:bg-blue-700 h-12 rounded-xl text-base"
                                        >
                                            Mulai Import Data
                                        </Button>
                                    )}
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <div className="space-y-6">
                        <Card className="border-none shadow-sm shadow-slate-200">
                            <CardHeader>
                                <CardTitle className="text-base flex items-center gap-2">
                                    <FileDown className="h-4 w-4 text-blue-600" /> Download Template
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <Button variant="outline" className="w-full justify-start text-xs font-semibold h-10 border-slate-200">
                                    Template Excel (.xlsx)
                                </Button>
                                <Button variant="outline" className="w-full justify-start text-xs font-semibold h-10 border-slate-200">
                                    Template CSV (.csv)
                                </Button>
                            </CardContent>
                        </Card>

                        <Card className="border-none shadow-sm shadow-slate-200 bg-blue-50/30">
                            <CardContent className="p-4 flex gap-3">
                                <AlertCircle className="h-5 w-5 text-blue-600 shrink-0" />
                                <div className="space-y-1">
                                    <p className="text-xs font-bold text-blue-900">Petunjuk Import</p>
                                    <p className="text-[11px] text-blue-700 leading-relaxed font-medium">
                                        Pastikan kolom Nama Dokter dan No. RM sudah sesuai dengan Database.
                                        Sistem akan otomatis mendeteksi duplikasi data berdasarkan No. Rawat.
                                    </p>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>

                {isComplete && (
                    <Card className="border-none shadow-sm shadow-slate-200 animate-in fade-in slide-in-from-bottom-4">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <div>
                                <CardTitle className="text-lg">Preview Data Terupload</CardTitle>
                                <CardDescription>Menampilkan 5 baris pertama dari file.</CardDescription>
                            </div>
                            <div className="flex gap-2">
                                <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">120 Berhasil</Badge>
                                <Badge className="bg-red-100 text-red-700 hover:bg-red-100">2 Gagal</Badge>
                            </div>
                        </CardHeader>
                        <CardContent className="p-0">
                            <Table>
                                <TableHeader className="bg-slate-50/50">
                                    <TableRow>
                                        <TableHead className="px-6">No. Rawat</TableHead>
                                        <TableHead>No. RM</TableHead>
                                        <TableHead>Pasien</TableHead>
                                        <TableHead>DPJP</TableHead>
                                        <TableHead className="text-right px-6">Nilai Klaim</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {[
                                        { noRawat: "2026/05/26/001", rm: "001234", name: "Tn. Ahmad Kusuma", dr: "dr. Sugeng Wahyudi, Sp.PD", value: "Rp 12.500.000" },
                                        { noRawat: "2026/05/26/002", rm: "056789", name: "Ny. Siska Amelia", dr: "dr. Andi Wijaya, Sp.B", value: "Rp 8.400.000" },
                                    ].map((row, i) => (
                                        <TableRow key={i}>
                                            <TableCell className="px-6 font-mono text-xs">{row.noRawat}</TableCell>
                                            <TableCell className="text-xs font-semibold">{row.rm}</TableCell>
                                            <TableCell className="font-medium">{row.name}</TableCell>
                                            <TableCell className="text-slate-600">{row.dr}</TableCell>
                                            <TableCell className="text-right px-6 font-bold">{row.value}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                            <div className="p-6 border-t flex justify-end gap-3">
                                <Button variant="ghost" size="sm" onClick={() => setIsComplete(false)}>Batalkan</Button>
                                <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700">Konfirmasi Simpan ke Database</Button>
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>
        </DashboardLayout>
    );
}
