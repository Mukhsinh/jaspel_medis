import { LucideIcon } from "lucide-react";

interface PageHeaderProps {
    title: string;
    description: string;
    icon?: LucideIcon;
    gradient?: string;
    children?: React.ReactNode;
}

export function PageHeader({ title, description, icon: Icon, gradient = "from-blue-600 to-indigo-600", children }: PageHeaderProps) {
    return (
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2">
            <div className="flex items-center gap-4">
                {Icon && (
                    <div className={`flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br ${gradient} shadow-lg shrink-0`}>
                        <Icon className="h-5 w-5 text-white" />
                    </div>
                )}
                <div>
                    <h1 className="text-xl font-bold tracking-tight text-slate-900">{title}</h1>
                    <p className="text-sm text-slate-500 font-medium mt-0.5">{description}</p>
                </div>
            </div>
            {children && (
                <div className="flex items-center gap-2 shrink-0">
                    {children}
                </div>
            )}
        </div>
    );
}

interface StatCardProps {
    title: string;
    value: string;
    sub?: string;
    icon: LucideIcon;
    gradient: string;
    badge?: string;
    badgeColor?: string;
}

export function StatCard({ title, value, sub, icon: Icon, gradient, badge, badgeColor = "bg-emerald-50 text-emerald-600" }: StatCardProps) {
    return (
        <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 group">
            <div className="flex items-center justify-between mb-4">
                <div className={`flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${gradient} shadow-md shrink-0`}>
                    <Icon className="h-5 w-5 text-white" />
                </div>
                {badge && (
                    <span className={`text-[10px] font-black tracking-wider px-2 py-1 rounded-lg ${badgeColor}`}>
                        {badge}
                    </span>
                )}
            </div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.1em] mb-1">{title}</p>
            <p className="text-2xl font-black text-slate-900 tracking-tight">{value}</p>
            {sub && <p className="text-[11px] text-slate-400 mt-1 font-medium">{sub}</p>}
        </div>
    );
}
