"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "./app-sidebar";
import { Separator } from "@/components/ui/separator";
import { Bell, Search } from "lucide-react";
import { useBranding } from "@/hooks/use-branding";

const routeLabels: Record<string, string> = {
    dashboard: "Dashboard",
    master: "Data Master",
    dokter: "Dokter",
    tarif: "Tarif Tindakan",
    proses: "Proses Jaspel",
    "pooling-pendapatan": "Pooling Pendapatan",
    "analisis-biaya": "Analisis Biaya",
    "konfigurasi-remunerasi": "Konfigurasi Remunerasi",
    remunerasi: "Remunerasi",
    approval: "Persetujuan",
    slip: "Slip Insentif",
    laporan: "Laporan",
    settings: "Pengaturan",
    pajak: "Pajak",
    pooling: "Pooling",
    analisa: "Analisa",
};

function DynamicBreadcrumb() {
    const pathname = usePathname();
    const segments = pathname.split("/").filter(Boolean);

    if (segments.length === 0) {
        return <span className="text-xs font-bold text-slate-700">Dashboard</span>;
    }

    return (
        <nav className="flex items-center gap-1.5 text-xs">
            <Link href="/dashboard" className="font-semibold text-slate-400 hover:text-blue-600 transition-colors hidden md:block">
                Jaspel Medis
            </Link>
            {segments.map((seg, idx) => {
                const href = "/" + segments.slice(0, idx + 1).join("/");
                const label = routeLabels[seg] || seg;
                const isLast = idx === segments.length - 1;
                return (
                    <span key={href} className="flex items-center gap-1.5">
                        <span className="text-slate-300 hidden md:block">/</span>
                        {isLast ? (
                            <span className="font-bold text-slate-700">{label}</span>
                        ) : (
                            <Link href={href} className="font-semibold text-slate-400 hover:text-blue-600 transition-colors hidden md:block">
                                {label}
                            </Link>
                        )}
                    </span>
                );
            })}
        </nav>
    );
}

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const { hospitalName, footerText } = useBranding()

    return (
        <SidebarProvider>
            <AppSidebar />
            <SidebarInset className="bg-slate-50 flex flex-col min-h-screen">
                {/* Top Header Bar */}
                <header className="h-14 flex shrink-0 items-center justify-between gap-4 border-b border-slate-200/80 bg-white px-5 sticky top-0 z-30 shadow-sm">
                    {/* Left: Trigger + Breadcrumb */}
                    <div className="flex items-center gap-3">
                        <SidebarTrigger className="h-8 w-8 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-all" />
                        <Separator orientation="vertical" className="h-5 bg-slate-200" />
                        <DynamicBreadcrumb />
                    </div>

                    {/* Right: Utilities */}
                    <div className="flex items-center gap-2">
                        {/* Search */}
                        <button className="hidden lg:flex items-center gap-2 h-8 px-3 rounded-lg bg-slate-50 border border-slate-200 text-slate-400 hover:border-blue-300 hover:text-blue-600 transition-all text-xs font-medium">
                            <Search className="h-3.5 w-3.5" />
                            <span>Cari...</span>
                            <kbd className="ml-4 text-[9px] opacity-60">⌘K</kbd>
                        </button>
                        {/* Hospital info */}
                        <div className="hidden lg:flex flex-col items-end leading-tight px-3 border-l border-slate-100 max-w-[200px]">
                            <span className="text-xs font-bold text-slate-800 truncate w-full text-right">{hospitalName || "RSUD Dr. Soegiri"}</span>
                            <div className="flex items-center gap-1 mt-0.5">
                                <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                                <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">Sistem Aktif</span>
                            </div>
                        </div>
                        {/* Notifications */}
                        <button className="relative h-8 w-8 rounded-lg border border-slate-200 bg-white text-slate-400 hover:text-blue-600 hover:border-blue-200 flex items-center justify-center transition-all">
                            <Bell className="h-3.5 w-3.5" />
                            <span className="absolute -top-1 -right-1 h-3.5 w-3.5 bg-red-500 rounded-full text-[8px] text-white font-black flex items-center justify-center">3</span>
                        </button>
                    </div>
                </header>

                {/* Page Content */}
                <main className="flex-1 p-6 md:p-8 space-y-6">
                    {children}
                </main>

                {/* Footer */}
                <footer className="px-8 py-6 border-t border-slate-200/50 bg-white/50 backdrop-blur-sm">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                        <p className="text-xs font-medium text-slate-400">
                            {footerText || "© 2026 RSUD Dr. Soegiri — Sistem Jasa Pelayanan Medis"}
                        </p>
                        <div className="flex items-center gap-6">
                            <Link href="#" className="text-[10px] font-bold text-slate-400 hover:text-blue-600 uppercase tracking-widest transition-colors">Bantuan</Link>
                            <Link href="#" className="text-[10px] font-bold text-slate-400 hover:text-blue-600 uppercase tracking-widest transition-colors">Privasi</Link>
                            <Link href="#" className="text-[10px] font-bold text-slate-400 hover:text-blue-600 uppercase tracking-widest transition-colors">Ketentuan</Link>
                        </div>
                    </div>
                </footer>
            </SidebarInset>
        </SidebarProvider>
    );
}
