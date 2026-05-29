"use client"

import * as React from "react"
import {
    BarChart3,
    Calculator,
    CheckSquare,
    ClipboardList,
    Coins,
    FileText,
    LayoutDashboard,
    ReceiptText,
    Settings,
    Stethoscope,
    Building2,
    Activity,
    LogOut,
    ChevronRight,
    SlidersHorizontal,
    HeartPulse,
    FlaskConical,
    GitGraph,
    Wallet,
    Upload,
    TrendingUp,
    BarChart2,
    SlidersVertical,
    Banknote,
} from "lucide-react"

import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarRail,
    SidebarGroup,
    SidebarGroupLabel,
    SidebarGroupContent,
    SidebarSeparator,
} from "@/components/ui/sidebar"
import Link from "next/link"
import { usePathname } from "next/navigation"

const mainNav = [
    { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
]

const masterNav = [
    { title: "Unit Pelayanan", url: "/master/unit", icon: Building2 },
    { title: "Dokter", url: "/master/dokter", icon: Stethoscope },
    { title: "Tarif Tindakan", url: "/master/tarif", icon: Activity },
]

const processNav = [
    { title: "Pooling Pendapatan", url: "/proses/pooling-pendapatan", icon: TrendingUp },
    { title: "Analisis Biaya", url: "/proses/analisis-biaya", icon: BarChart2 },
    { title: "Konfigurasi Remunerasi", url: "/proses/konfigurasi-remunerasi", icon: SlidersVertical },
    { title: "Remunerasi", url: "/proses/remunerasi", icon: Banknote },
]

const outputNav = [
    { title: "Persetujuan", url: "/approval", icon: CheckSquare },
    { title: "Slip Insentif", url: "/slip", icon: FileText },
    { title: "Laporan", url: "/laporan", icon: ClipboardList },
]

type NavEntry = {
    title: string
    url: string
    icon: React.ElementType
    badge?: string
}

function NavItem({ item, pathname }: { item: NavEntry; pathname: string }) {
    const isActive = pathname === item.url || pathname.startsWith(item.url + "/")
    return (
        <SidebarMenuItem>
            <SidebarMenuButton
                asChild
                tooltip={item.title}
                isActive={isActive}
                className={[
                    "group relative flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 text-sm font-medium h-10 w-full",
                    isActive
                        ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/25 scale-[1.02]"
                        : "text-slate-500 hover:text-slate-900 hover:bg-slate-100/80",
                ].join(" ")}
            >
                <Link href={item.url} className="flex items-center gap-3 w-full">
                    <span className={[
                        "flex items-center justify-center h-6 w-6 rounded-lg transition-all duration-200 shrink-0",
                        isActive ? "bg-white/20" : "group-hover:bg-blue-50",
                    ].join(" ")}>
                        <item.icon className={[
                            "h-3.5 w-3.5 transition-all duration-200",
                            isActive ? "text-white" : "text-slate-400 group-hover:text-blue-600",
                        ].join(" ")} />
                    </span>
                    <span className="flex-1 truncate">{item.title}</span>
                    {item.badge && (
                        <span className={[
                            "text-[9px] font-black tracking-widest px-1.5 py-0.5 rounded-md",
                            isActive ? "bg-white/20 text-white" : "bg-blue-100 text-blue-700",
                        ].join(" ")}>
                            {item.badge}
                        </span>
                    )}
                    {isActive && !item.badge && <ChevronRight className="h-3 w-3 text-white/60 ml-auto shrink-0" />}
                </Link>
            </SidebarMenuButton>
        </SidebarMenuItem>
    )
}

export function AppSidebar() {
    const pathname = usePathname()

    return (
        <Sidebar collapsible="icon" className="border-r border-slate-200/60">
            {/* Logo Header */}
            <SidebarHeader className="px-4 py-5 border-b border-slate-100">
                <div className="flex items-center gap-3">
                    <div className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 shadow-lg shadow-blue-500/30">
                        <Activity className="h-5 w-5 text-white" />
                        <span className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-emerald-400 border-2 border-white" />
                    </div>
                    <div className="flex flex-col leading-none">
                        <span className="font-black text-[15px] tracking-tight text-slate-900">
                            Jaspel<span className="text-blue-600">Medis</span>
                        </span>
                        <span className="text-[10px] text-slate-400 font-semibold tracking-widest uppercase mt-0.5">
                            Enterprise v2.0
                        </span>
                    </div>
                </div>
            </SidebarHeader>

            <SidebarContent className="px-3 py-4 gap-0">
                {/* Main */}
                <SidebarGroup className="py-0 mb-1">
                    <SidebarMenu>
                        {mainNav.map((item) => (
                            <NavItem key={item.title} item={item} pathname={pathname} />
                        ))}
                    </SidebarMenu>
                </SidebarGroup>

                <SidebarSeparator className="my-3 bg-slate-100" />

                {/* Data Master */}
                <SidebarGroup className="py-0 mb-1">
                    <SidebarGroupLabel className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.12em] px-3 mb-2 h-auto">
                        Data Master
                    </SidebarGroupLabel>
                    <SidebarGroupContent>
                        <SidebarMenu>
                            {masterNav.map((item) => (
                                <NavItem key={item.title} item={item} pathname={pathname} />
                            ))}
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>

                <SidebarSeparator className="my-3 bg-slate-100" />

                {/* Proses Jaspel */}
                <SidebarGroup className="py-0 mb-1">
                    <SidebarGroupLabel className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.12em] px-3 mb-2 h-auto">
                        Proses Jaspel
                    </SidebarGroupLabel>
                    <SidebarGroupContent>
                        <SidebarMenu>
                            {processNav.map((item) => (
                                <NavItem key={item.title} item={item} pathname={pathname} />
                            ))}
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>

                <SidebarSeparator className="my-3 bg-slate-100" />

                {/* Output & Laporan */}
                <SidebarGroup className="py-0 mb-1">
                    <SidebarGroupLabel className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.12em] px-3 mb-2 h-auto">
                        Output & Laporan
                    </SidebarGroupLabel>
                    <SidebarGroupContent>
                        <SidebarMenu>
                            {outputNav.map((item) => (
                                <NavItem key={item.title} item={item} pathname={pathname} />
                            ))}
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>

                <SidebarSeparator className="my-3 bg-slate-100" />

                {/* Settings */}
                <SidebarGroup className="py-0">
                    <SidebarMenu>
                        <NavItem item={{ title: "Pengaturan", url: "/settings", icon: Settings }} pathname={pathname} />
                    </SidebarMenu>
                </SidebarGroup>
            </SidebarContent>

            {/* Footer / User */}
            <SidebarFooter className="border-t border-slate-100 px-4 py-4">
                <div className="flex items-center gap-3 rounded-xl bg-slate-50 px-3 py-2.5 hover:bg-slate-100/70 transition-colors cursor-pointer group">
                    <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center text-white text-xs font-black shadow-md shrink-0">
                        AU
                    </div>
                    <div className="flex flex-col overflow-hidden flex-1 min-w-0">
                        <span className="truncate text-xs font-bold text-slate-900">Admin Utama</span>
                        <span className="truncate text-[10px] text-slate-400 font-medium">Super Administrator</span>
                    </div>
                    <LogOut className="h-3.5 w-3.5 text-slate-400 group-hover:text-slate-600 transition-colors shrink-0" />
                </div>
            </SidebarFooter>
            <SidebarRail />
        </Sidebar>
    )
}
