"use client";

import { useState, useEffect, useCallback } from "react";
import dynamic from "next/dynamic";
import DashboardLayout from "@/components/layout/dashboard-layout";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Loader2, TrendingUp, TrendingDown, Activity, Stethoscope } from "lucide-react";
import {
  getAnalysisData,
  getDoctorRankings,
  getDiagnosisRankings,
  getChartData,
  getAvailablePeriods,
} from "./actions";
import { toast } from "sonner";

// Dynamic import to avoid SSR issues with ApexCharts
const ReactApexChart = dynamic(() => import("react-apexcharts"), { ssr: false });

interface SummaryData {
  totalKlaim: number;
  totalBiaya: number;
  totalJasaSarana: number;
  selisih: number;
  jumlahKlaim: number;
}

interface DoctorRanking {
  doctor_id: string;
  doctor_name: string;
  spesialisasi: string;
  nilai_klaim: number;
  total_biaya: number;
  selisih: number;
  jumlah_kasus: number;
}

interface DiagnosisRanking {
  diagnosis_grouper: string;
  jumlah_kasus: number;
  nilai_klaim: number;
  total_biaya: number;
  selisih: number;
}

interface ChartData {
  categories: string[];
  klaimSeries: number[];
  biayaSeries: number[];
}

export default function AnalisisBiayaPage() {
  const [periods, setPeriods] = useState<string[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState<string>("");
  const [loading, setLoading] = useState(false);

  const [summary, setSummary] = useState<SummaryData | null>(null);
  const [surplusDoctors, setSurplusDoctors] = useState<DoctorRanking[]>([]);
  const [deficitDoctors, setDeficitDoctors] = useState<DoctorRanking[]>([]);
  const [losDoctors, setLosDoctors] = useState<DoctorRanking[]>([]);
  const [surplusDiagnoses, setSurplusDiagnoses] = useState<DiagnosisRanking[]>([]);
  const [deficitDiagnoses, setDeficitDiagnoses] = useState<DiagnosisRanking[]>([]);
  const [chartData, setChartData] = useState<ChartData | null>(null);

  useEffect(() => {
    loadPeriods();
  }, []);

  const loadData = useCallback(async (periode: string) => {
    setLoading(true);
    try {
      const [summaryRes, surplusDocRes, deficitDocRes, losDocRes, surplusDiagRes, deficitDiagRes, chartRes] =
        await Promise.all([
          getAnalysisData(periode),
          getDoctorRankings(periode, "surplus"),
          getDoctorRankings(periode, "deficit"),
          getDoctorRankings(periode, "los"),
          getDiagnosisRankings(periode, "surplus"),
          getDiagnosisRankings(periode, "deficit"),
          getChartData(periode),
        ]);

      if (summaryRes.success) setSummary(summaryRes.data as SummaryData);
      if (surplusDocRes.success) setSurplusDoctors(surplusDocRes.data as DoctorRanking[]);
      if (deficitDocRes.success) setDeficitDoctors(deficitDocRes.data as DoctorRanking[]);
      if (losDocRes.success) setLosDoctors(losDocRes.data as DoctorRanking[]);
      if (surplusDiagRes.success) setSurplusDiagnoses(surplusDiagRes.data as DiagnosisRanking[]);
      if (deficitDiagRes.success) setDeficitDiagnoses(deficitDiagRes.data as DiagnosisRanking[]);
      if (chartRes.success) setChartData(chartRes.data as ChartData);
    } catch {
      toast.error("Gagal memuat data analisis");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (selectedPeriod) {
      loadData(selectedPeriod);
    }
  }, [selectedPeriod, loadData]);

  const loadPeriods = async () => {
    const res = await getAvailablePeriods();
    if (res.success && res.data) {
      const list = res.data.map((p: any) => p.periode);
      setPeriods(list);
      if (list.length > 0) setSelectedPeriod(list[0]);
    }
  };

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(value);

  const barChartOptions = {
    chart: { type: "bar" as const, toolbar: { show: false } },
    plotOptions: { bar: { horizontal: false, columnWidth: "55%", borderRadius: 4 } },
    dataLabels: { enabled: false },
    xaxis: {
      categories: chartData?.categories || [],
      labels: { style: { fontSize: "11px" }, rotate: -30 },
    },
    yaxis: {
      labels: {
        formatter: (val: number) =>
          new Intl.NumberFormat("id-ID", { notation: "compact", maximumFractionDigits: 1 }).format(val),
      },
    },
    colors: ["#10b981", "#ef4444"],
    legend: { position: "top" as const },
    tooltip: {
      y: { formatter: (val: number) => formatCurrency(val) },
    },
  };

  const barChartSeries = [
    { name: "Nilai Klaim", data: chartData?.klaimSeries || [] },
    { name: "Total Biaya", data: chartData?.biayaSeries || [] },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="h-5 w-1 rounded-full bg-gradient-to-b from-emerald-500 to-teal-600 inline-block" />
              <span className="text-xs font-bold text-emerald-600 uppercase tracking-widest">Proses Jaspel</span>
            </div>
            <h1 className="text-2xl font-black tracking-tight text-slate-900">Analisis Biaya</h1>
            <p className="text-sm text-slate-500 font-medium mt-1">
              Visualisasi perbandingan klaim vs biaya dan ranking dokter/diagnosis
            </p>
          </div>
          <div className="w-48">
            <Label className="text-xs text-slate-500 mb-1 block">Periode</Label>
            <Select value={selectedPeriod} onValueChange={(v) => setSelectedPeriod(v || "")}>
              <SelectTrigger>
                <SelectValue placeholder="Pilih periode" />
              </SelectTrigger>
              <SelectContent>
                {periods.map((p) => (
                  <SelectItem key={p} value={p}>{p}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-32">
            <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
          </div>
        ) : !selectedPeriod ? (
          <div className="text-center py-32 text-slate-400">Pilih periode untuk melihat analisis</div>
        ) : (
          <>
            {/* Summary Cards */}
            {summary && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <SummaryCard
                  label="Total Klaim"
                  value={formatCurrency(summary.totalKlaim)}
                  icon={<TrendingUp className="h-5 w-5 text-emerald-500" />}
                  color="emerald"
                />
                <SummaryCard
                  label="Total Biaya"
                  value={formatCurrency(summary.totalBiaya)}
                  icon={<TrendingDown className="h-5 w-5 text-red-500" />}
                  color="red"
                />
                <SummaryCard
                  label="Selisih"
                  value={formatCurrency(summary.selisih)}
                  icon={<Activity className="h-5 w-5 text-blue-500" />}
                  color={summary.selisih >= 0 ? "emerald" : "red"}
                />
                <SummaryCard
                  label="Jumlah Klaim"
                  value={summary.jumlahKlaim.toLocaleString("id-ID")}
                  icon={<Stethoscope className="h-5 w-5 text-purple-500" />}
                  color="purple"
                />
              </div>
            )}

            {/* Chart */}
            {chartData && chartData.categories.length > 0 && (
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                <h2 className="text-base font-bold text-slate-900 mb-4">Klaim vs Biaya per Spesialisasi</h2>
                <ReactApexChart
                  options={barChartOptions}
                  series={barChartSeries}
                  type="bar"
                  height={320}
                />
              </div>
            )}

            {/* Doctor Rankings */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <RankingCard
                title="Top 10 Dokter Surplus"
                items={surplusDoctors}
                valueKey="selisih"
                labelKey="doctor_name"
                subKey="spesialisasi"
                color="emerald"
                formatValue={formatCurrency}
              />
              <RankingCard
                title="Top 10 Dokter Defisit"
                items={deficitDoctors}
                valueKey="selisih"
                labelKey="doctor_name"
                subKey="spesialisasi"
                color="red"
                formatValue={(v) => formatCurrency(Math.abs(v))}
              />
              <RankingCard
                title="Dokter Kasus Terbanyak"
                items={losDoctors}
                valueKey="jumlah_kasus"
                labelKey="doctor_name"
                subKey="spesialisasi"
                color="blue"
                formatValue={(v) => `${v} kasus`}
              />
            </div>

            {/* Diagnosis Rankings */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <RankingCard
                title="Top 10 Diagnosis Surplus"
                items={surplusDiagnoses}
                valueKey="selisih"
                labelKey="diagnosis_grouper"
                subKey="jumlah_kasus"
                subFormat={(v) => `${v} kasus`}
                color="emerald"
                formatValue={formatCurrency}
              />
              <RankingCard
                title="Top 10 Diagnosis Defisit"
                items={deficitDiagnoses}
                valueKey="selisih"
                labelKey="diagnosis_grouper"
                subKey="jumlah_kasus"
                subFormat={(v) => `${v} kasus`}
                color="red"
                formatValue={(v) => formatCurrency(Math.abs(v))}
              />
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}

function SummaryCard({
  label,
  value,
  icon,
  color,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  color: string;
}) {
  const bg: Record<string, string> = {
    emerald: "bg-emerald-50",
    red: "bg-red-50",
    blue: "bg-blue-50",
    purple: "bg-purple-50",
  };
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{label}</p>
        <div className={`p-2 rounded-xl ${bg[color] || "bg-slate-50"}`}>{icon}</div>
      </div>
      <p className="text-xl font-black text-slate-900">{value}</p>
    </div>
  );
}

function RankingCard({
  title,
  items,
  valueKey,
  labelKey,
  subKey,
  subFormat,
  color,
  formatValue,
}: {
  title: string;
  items: any[];
  valueKey: string;
  labelKey: string;
  subKey: string;
  subFormat?: (v: any) => string;
  color: string;
  formatValue: (v: number) => string;
}) {
  const valueColor: Record<string, string> = {
    emerald: "text-emerald-600",
    red: "text-red-600",
    blue: "text-blue-600",
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
      <h3 className="text-sm font-bold text-slate-900 mb-4">{title}</h3>
      {items.length === 0 ? (
        <p className="text-sm text-slate-400 text-center py-4">Tidak ada data</p>
      ) : (
        <div className="space-y-2">
          {items.map((item, idx) => (
            <div key={idx} className="flex items-center justify-between py-1.5 border-b border-slate-100 last:border-0">
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-xs font-bold text-slate-400 w-5 shrink-0">{idx + 1}</span>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-slate-800 truncate">{item[labelKey]}</p>
                  <p className="text-xs text-slate-400">
                    {subFormat ? subFormat(item[subKey]) : item[subKey]}
                  </p>
                </div>
              </div>
              <span className={`text-xs font-bold shrink-0 ml-2 ${valueColor[color] || "text-slate-700"}`}>
                {formatValue(item[valueKey])}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
