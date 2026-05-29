"use client";

import { useState } from "react";
import DashboardLayout from "@/components/layout/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
    ReceiptText,
    Info,
    HelpCircle,
    ArrowRight,
    ShieldCheck,
    Search,
    Download
} from "lucide-react";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";

export default function TaxTERPage() {
    const [searchTerm, setSearchTerm] = useState("");

    const taxData = [
        { name: "dr. Sugeng Wahyudi, Sp.PD", category: "A", ptkp: "K/1", bruto: 25400000, rate: 0.09, tax: 2286000 },
        { name: "dr. Andi Wijaya, Sp.B", category: "B", ptkp: "K/2", bruto: 32000000, rate: 0.12, tax: 3840000 },
        { name: "dr. Maria Ulfa", category: "A", ptkp: "TK/0", bruto: 8500000, rate: 0.02, tax: 170000 },
        { name: "dr. Bambang Heru, Sp.A", category: "C", ptkp: "K/3", bruto: 28000000, rate: 0.08, tax: 2240000 },
    ];

    return (
        <DashboardLayout>
            <div className="flex flex-col gap-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Perpajakan TER (PP 58/2023)</h1>
                        <p className="text-slate-500">Kalkulasi PPh 21 bulanan menggunakan Tarif Efektif Rata-rata.</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm">
                            <Info className="h-4 w-4 mr-2" /> Aturan Pajak
                        </Button>
                        <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                            <Download className="h-4 w-4 mr-2" /> Export e-SPT
                        </Button>
                    </div>
                </div>

                {/* Info Box */}
                <Card className="border-none shadow-sm shadow-slate-200 bg-blue-600 text-white">
                    <CardContent className="p-6 flex flex-col md:flex-row items-center justify-between gap-6">
                        <div className="flex gap-4">
                            <div className="h-12 w-12 rounded-xl bg-white/20 flex items-center justify-center shrink-0 backdrop-blur-sm">
                                <ShieldCheck className="h-6 w-6 text-white" />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold">Kepatuhan PP 58 Tahun 2023</h3>
                                <p className="text-sm text-blue-100 max-w-xl">
                                    Sistem secara otomatis menentukan kategori TER (A, B, atau C) berdasarkan status PTKP dokter
                                    dan mengaplikasikan tarif progresif bulanan sesuai regulasi terbaru.
                                </p>
                            </div>
                        </div>
                        <Button className="bg-white text-blue-600 hover:bg-white/90 font-bold px-6">
                            Lihat Tabel TER
                        </Button>
                    </CardContent>
                </Card>

                <Card className="border-none shadow-sm shadow-slate-200">
                    <CardHeader className="pb-3 px-6">
                        <div className="flex flex-col md:flex-row md:items-center gap-4">
                            <div className="relative flex-1">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                <Input
                                    placeholder="Cari dokter..."
                                    className="pl-9 bg-slate-50 border-none shadow-none focus-visible:ring-1"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="p-0">
                        <Table>
                            <TableHeader className="bg-slate-50/50">
                                <TableRow>
                                    <TableHead className="px-6">Nama Dokter</TableHead>
                                    <TableHead>Kategori</TableHead>
                                    <TableHead>PTKP</TableHead>
                                    <TableHead className="text-right">Bruto Jaspel</TableHead>
                                    <TableHead className="text-center">Tarif TER</TableHead>
                                    <TableHead className="text-right px-6">PPh 21 Terutang</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {taxData.map((row, i) => (
                                    <TableRow key={i} className="hover:bg-slate-50/50">
                                        <TableCell className="px-6 font-semibold text-slate-700">{row.name}</TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className="font-bold border-blue-200 text-blue-600 bg-blue-50/50">
                                                TER {row.category}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="font-mono text-xs">{row.ptkp}</TableCell>
                                        <TableCell className="text-right font-medium">Rp {row.bruto.toLocaleString('id-ID')}</TableCell>
                                        <TableCell className="text-center">
                                            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-100 rounded-full text-[11px] font-bold text-slate-600">
                                                {(row.rate * 100).toFixed(1)}%
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right px-6 font-bold text-rose-600">
                                            Rp {row.tax.toLocaleString('id-ID')}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                        <div className="p-4 border-t bg-slate-50/50">
                            <p className="text-[10px] text-slate-400 font-bold uppercase text-center tracking-widest">
                                Rekonsiliasi Pajak Tahunan (Pasal 17) akan dilakukan otomatis pada periode Desember.
                            </p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </DashboardLayout>
    );
}
