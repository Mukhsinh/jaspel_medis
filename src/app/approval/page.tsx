"use client";

import { useState } from "react";
import DashboardLayout from "@/components/layout/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
    CheckSquare,
    ShieldCheck,
    History,
    FileCheck,
    AlertCircle,
    ArrowRight,
    MessageSquare,
    UserCircle2,
    Clock
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@/components/ui/table";

export default function ApprovalPage() {
    const steps = [
        { title: "Verifikasi Data", status: "Completed", user: "Staf Keuangan", date: "25 Mei 2026 10:00" },
        { title: "Persetujuan Kabid", status: "Completed", user: "Kabid Pelayanan", date: "25 Mei 2026 14:30" },
        { title: "Persetujuan Direktur", status: "Active", user: "Direktur RS", date: "-" },
        { title: "Finalisasi / Closing", status: "Upcoming", user: "Sistem", date: "-" },
    ];

    return (
        <DashboardLayout>
            <div className="flex flex-col gap-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Approval Workflow</h1>
                        <p className="text-slate-500">Alur persetujuan distribusi jaspel periode Mei 2026.</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm">
                            <History className="h-4 w-4 mr-2" /> Log Perubahan
                        </Button>
                        <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700">
                            <ShieldCheck className="h-4 w-4 mr-2" /> Approve Distribusi
                        </Button>
                    </div>
                </div>

                {/* Workflow Timeline */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    {steps.map((step, i) => (
                        <Card key={i} className={`border-none shadow-sm ${step.status === 'Active' ? 'ring-2 ring-blue-500 bg-blue-50/50' : 'bg-white'}`}>
                            <CardContent className="p-4">
                                <div className="flex items-center justify-between mb-3">
                                    <div className={`h-8 w-8 rounded-full flex items-center justify-center font-bold text-xs ${step.status === 'Completed' ? 'bg-emerald-100 text-emerald-600' :
                                        step.status === 'Active' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-400'
                                        }`}>
                                        {i + 1}
                                    </div>
                                    {step.status === 'Completed' && <CheckSquare className="h-4 w-4 text-emerald-600" />}
                                </div>
                                <h4 className="font-bold text-slate-800 text-sm">{step.title}</h4>
                                <p className="text-[10px] text-slate-500 mt-1 flex items-center gap-1">
                                    <UserCircle2 className="h-3 w-3" /> {step.user}
                                </p>
                                <p className="text-[10px] text-slate-400 font-mono mt-0.5">{step.date}</p>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Summary For Approval */}
                    <Card className="lg:col-span-2 border-none shadow-sm shadow-slate-200">
                        <CardHeader className="bg-slate-50/50">
                            <div className="flex items-center justify-between">
                                <div>
                                    <CardTitle className="text-lg">Ringkasan Distribusi</CardTitle>
                                    <CardDescription>Detail dana yang akan didistribusikan ke 42 orang dokter.</CardDescription>
                                </div>
                                <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100 border-none px-4 py-1">Menunggu Direktur</Badge>
                            </div>
                        </CardHeader>
                        <CardContent className="p-0">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="px-6">Komponen</TableHead>
                                        <TableHead className="text-right">Total (IDR)</TableHead>
                                        <TableHead className="text-center">Status</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    <TableRow>
                                        <TableCell className="px-6 font-medium">Jasa Pelayanan Bruto</TableCell>
                                        <TableCell className="text-right font-bold">Rp 1.450.250.000</TableCell>
                                        <TableCell className="text-center"><CheckSquare className="h-4 w-4 text-emerald-500 mx-auto" /></TableCell>
                                    </TableRow>
                                    <TableRow>
                                        <TableCell className="px-6 font-medium">PPh 21 TER</TableCell>
                                        <TableCell className="text-right font-bold text-rose-600">(Rp 145.025.000)</TableCell>
                                        <TableCell className="text-center"><CheckSquare className="h-4 w-4 text-emerald-500 mx-auto" /></TableCell>
                                    </TableRow>
                                    <TableRow className="bg-blue-50/30">
                                        <TableCell className="px-6 font-bold text-blue-900">Total Netto Transfer</TableCell>
                                        <TableCell className="text-right font-bold text-blue-900 text-lg">Rp 1.305.225.000</TableCell>
                                        <TableCell className="text-center"><Clock className="h-4 w-4 text-blue-600 mx-auto" /></TableCell>
                                    </TableRow>
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>

                    {/* Action / Comments */}
                    <Card className="border-none shadow-sm shadow-slate-200">
                        <CardHeader>
                            <CardTitle className="text-lg">Panel Keputusan</CardTitle>
                            <CardDescription>Berikan persetujuan atau catatan untuk verifikasi ulang.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-500 uppercase">Catatan Internal</label>
                                <textarea
                                    className="w-full h-32 p-3 bg-slate-50 border rounded-xl text-sm focus:outline-blue-500 transition-all"
                                    placeholder="Contoh: Seluruh data klaim telah divalidasi dengan SIMRS..."
                                />
                            </div>
                            <div className="flex flex-col gap-2">
                                <Button className="w-full bg-blue-600 hover:bg-blue-700 font-bold">
                                    <ShieldCheck className="h-4 w-4 mr-2" /> Approve & Sign
                                </Button>
                                <Button variant="outline" className="w-full text-rose-600 hover:bg-rose-50 border-rose-200 font-bold">
                                    <AlertCircle className="h-4 w-4 mr-2" /> Tolak / Revisi
                                </Button>
                            </div>
                            <div className="pt-4 border-t flex gap-3 italic text-[10px] text-slate-400">
                                <MessageSquare className="h-4 w-4 shrink-0" />
                                Catatan terakhir: "Telah divalidasi oleh Kabid Pelayanan sesuai logbook"
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </DashboardLayout>
    );
}
