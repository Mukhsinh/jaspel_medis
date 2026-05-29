"use client";

import { useState } from "react";
import DashboardLayout from "@/components/layout/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
    FileText,
    Download,
    Eye,
    Calendar,
    Search,
    CheckCircle2,
    Clock,
    QrCode
} from "lucide-react";
import { Input } from "@/components/ui/input";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

export default function IncentiveSlipPage() {
    const [searchTerm, setSearchTerm] = useState("");

    const slips = [
        { id: "SLP-202605-001", name: "dr. Sugeng Wahyudi, Sp.PD", period: "Mei 2026", netto: 23114000, status: "Published" },
        { id: "SLP-202605-002", name: "dr. Andi Wijaya, Sp.B", period: "Mei 2026", netto: 28160000, status: "Pending" },
        { id: "SLP-202605-003", name: "dr. Maria Ulfa", period: "Mei 2026", netto: 8330000, status: "Published" },
        { id: "SLP-202604-001", name: "dr. Sugeng Wahyudi, Sp.PD", period: "April 2026", netto: 21450000, status: "Archive" },
    ];

    return (
        <DashboardLayout>
            <div className="flex flex-col gap-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Slip Insentif Digital</h1>
                        <p className="text-slate-500">Lihat dan unduh bukti pembayaran jasa pelayanan medis.</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" className="bg-white">
                            <QrCode className="h-4 w-4 mr-2" /> Verifikasi QR
                        </Button>
                        <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                            <Download className="h-4 w-4 mr-2" /> Download Masal
                        </Button>
                    </div>
                </div>

                <Card className="border-none shadow-sm shadow-slate-200">
                    <CardHeader className="pb-3 px-6">
                        <div className="flex flex-col md:flex-row md:items-center gap-4">
                            <div className="relative flex-1">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                <Input
                                    placeholder="Cari nama atau nomor slip..."
                                    className="pl-9 bg-slate-50 border-none shadow-none focus-visible:ring-1"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-600">
                                    <Calendar className="h-3.5 w-3.5" />
                                    Mei 2026
                                </div>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="p-0">
                        <Table>
                            <TableHeader className="bg-slate-50/50">
                                <TableRow>
                                    <TableHead className="px-6">No. Slip</TableHead>
                                    <TableHead>Nama Dokter</TableHead>
                                    <TableHead>Periode</TableHead>
                                    <TableHead className="text-right">Penghasilan Netto</TableHead>
                                    <TableHead className="text-center">Status</TableHead>
                                    <TableHead className="text-right px-6">Aksi</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {slips.map((slip, i) => (
                                    <TableRow key={i} className="hover:bg-slate-50/50">
                                        <TableCell className="px-6 font-mono text-[11px] font-bold text-slate-500">{slip.id}</TableCell>
                                        <TableCell className="font-semibold text-slate-700">{slip.name}</TableCell>
                                        <TableCell className="text-slate-500 text-xs font-medium">{slip.period}</TableCell>
                                        <TableCell className="text-right font-bold text-blue-600">
                                            Rp {slip.netto.toLocaleString('id-ID')}
                                        </TableCell>
                                        <TableCell className="text-center">
                                            {slip.status === 'Published' && (
                                                <Badge className="bg-emerald-50 text-emerald-600 border-emerald-100 hover:bg-emerald-50 shadow-none font-bold text-[10px] uppercase">
                                                    <CheckCircle2 className="h-3 w-3 mr-1" /> Terbit
                                                </Badge>
                                            )}
                                            {slip.status === 'Pending' && (
                                                <Badge className="bg-orange-50 text-orange-600 border-orange-100 hover:bg-orange-50 shadow-none font-bold text-[10px] uppercase">
                                                    <Clock className="h-3 w-3 mr-1" /> Pending
                                                </Badge>
                                            )}
                                            {slip.status === 'Archive' && (
                                                <Badge variant="secondary" className="bg-slate-100 text-slate-500 font-bold text-[10px] uppercase">
                                                    Arsip
                                                </Badge>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-right px-6">
                                            <div className="flex justify-end gap-2">
                                                <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-blue-600">
                                                    <Eye className="h-4 w-4" />
                                                </Button>
                                                <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-emerald-600">
                                                    <Download className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>
        </DashboardLayout>
    );
}
