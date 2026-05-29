"use server";

import { supabaseAdmin } from "@/lib/supabase";

// Get aggregated analysis data for a period
export async function getAnalysisData(periode: string) {
  try {
    const [year, month] = periode.split("-");
    const startDate = `${year}-${month}-01`;
    const endDate = new Date(parseInt(year), parseInt(month), 0).toISOString().split("T")[0];

    const { data, error } = await supabaseAdmin
      .from("pooling_pendapatan")
      .select("nilai_klaim_inacbgs, total_biaya, jasa_sarana")
      .gte("periode_layanan", startDate)
      .lte("periode_layanan", endDate);

    if (error) {
      return { success: false, error: error.message };
    }

    const records = data || [];
    const totalKlaim = records.reduce((sum, r) => sum + parseFloat(r.nilai_klaim_inacbgs), 0);
    const totalBiaya = records.reduce((sum, r) => sum + parseFloat(r.total_biaya), 0);
    const totalJasaSarana = records.reduce((sum, r) => sum + parseFloat(r.jasa_sarana), 0);
    const selisih = totalKlaim - totalBiaya;

    return {
      success: true,
      data: {
        totalKlaim,
        totalBiaya,
        totalJasaSarana,
        selisih,
        jumlahKlaim: records.length,
      },
    };
  } catch (error: any) {
    console.error("Error fetching analysis data:", error);
    return { success: false, error: error.message };
  }
}

// Get doctor rankings for a period
export async function getDoctorRankings(periode: string, type: "surplus" | "deficit" | "los") {
  try {
    const [year, month] = periode.split("-");
    const startDate = `${year}-${month}-01`;
    const endDate = new Date(parseInt(year), parseInt(month), 0).toISOString().split("T")[0];

    const { data, error } = await supabaseAdmin
      .from("pooling_pendapatan")
      .select("doctor_id, doctor_name, spesialisasi, nilai_klaim_inacbgs, total_biaya")
      .gte("periode_layanan", startDate)
      .lte("periode_layanan", endDate);

    if (error) {
      return { success: false, error: error.message };
    }

    // Group by doctor
    const doctorMap = new Map<
      string,
      { doctor_name: string; spesialisasi: string; total_klaim: number; total_biaya: number; count: number }
    >();

    for (const record of data || []) {
      const existing = doctorMap.get(record.doctor_id) || {
        doctor_name: record.doctor_name,
        spesialisasi: record.spesialisasi,
        total_klaim: 0,
        total_biaya: 0,
        count: 0,
      };
      existing.total_klaim += parseFloat(record.nilai_klaim_inacbgs);
      existing.total_biaya += parseFloat(record.total_biaya);
      existing.count += 1;
      doctorMap.set(record.doctor_id, existing);
    }

    const doctors = Array.from(doctorMap.entries()).map(([id, d]) => ({
      doctor_id: id,
      doctor_name: d.doctor_name,
      spesialisasi: d.spesialisasi,
      nilai_klaim: d.total_klaim,
      total_biaya: d.total_biaya,
      selisih: d.total_klaim - d.total_biaya,
      jumlah_kasus: d.count,
    }));

    let sorted: typeof doctors;
    if (type === "surplus") {
      sorted = doctors.filter((d) => d.selisih > 0).sort((a, b) => b.selisih - a.selisih);
    } else if (type === "deficit") {
      sorted = doctors.filter((d) => d.selisih < 0).sort((a, b) => a.selisih - b.selisih);
    } else {
      // LOS: sort by jumlah_kasus descending as proxy
      sorted = doctors.sort((a, b) => b.jumlah_kasus - a.jumlah_kasus);
    }

    return { success: true, data: sorted.slice(0, 10) };
  } catch (error: any) {
    console.error("Error fetching doctor rankings:", error);
    return { success: false, error: error.message };
  }
}

// Get diagnosis rankings for a period
export async function getDiagnosisRankings(periode: string, type: "surplus" | "deficit") {
  try {
    const [year, month] = periode.split("-");
    const startDate = `${year}-${month}-01`;
    const endDate = new Date(parseInt(year), parseInt(month), 0).toISOString().split("T")[0];

    const { data, error } = await supabaseAdmin
      .from("pooling_pendapatan")
      .select("diagnosis_grouper, nilai_klaim_inacbgs, total_biaya")
      .gte("periode_layanan", startDate)
      .lte("periode_layanan", endDate);

    if (error) {
      return { success: false, error: error.message };
    }

    // Group by diagnosis
    const diagMap = new Map<string, { total_klaim: number; total_biaya: number; count: number }>();

    for (const record of data || []) {
      const existing = diagMap.get(record.diagnosis_grouper) || {
        total_klaim: 0,
        total_biaya: 0,
        count: 0,
      };
      existing.total_klaim += parseFloat(record.nilai_klaim_inacbgs);
      existing.total_biaya += parseFloat(record.total_biaya);
      existing.count += 1;
      diagMap.set(record.diagnosis_grouper, existing);
    }

    const diagnoses = Array.from(diagMap.entries()).map(([diag, d]) => ({
      diagnosis_grouper: diag,
      jumlah_kasus: d.count,
      nilai_klaim: d.total_klaim,
      total_biaya: d.total_biaya,
      selisih: d.total_klaim - d.total_biaya,
    }));

    let sorted: typeof diagnoses;
    if (type === "surplus") {
      sorted = diagnoses.filter((d) => d.selisih > 0).sort((a, b) => b.selisih - a.selisih);
    } else {
      sorted = diagnoses.filter((d) => d.selisih < 0).sort((a, b) => a.selisih - b.selisih);
    }

    return { success: true, data: sorted.slice(0, 10) };
  } catch (error: any) {
    console.error("Error fetching diagnosis rankings:", error);
    return { success: false, error: error.message };
  }
}

// Get chart data: monthly claim vs cost comparison
export async function getChartData(periode: string) {
  try {
    const [year, month] = periode.split("-");
    const startDate = `${year}-${month}-01`;
    const endDate = new Date(parseInt(year), parseInt(month), 0).toISOString().split("T")[0];

    const { data, error } = await supabaseAdmin
      .from("pooling_pendapatan")
      .select("spesialisasi, nilai_klaim_inacbgs, total_biaya")
      .gte("periode_layanan", startDate)
      .lte("periode_layanan", endDate);

    if (error) {
      return { success: false, error: error.message };
    }

    // Group by specialization
    const specMap = new Map<string, { total_klaim: number; total_biaya: number }>();

    for (const record of data || []) {
      const existing = specMap.get(record.spesialisasi) || { total_klaim: 0, total_biaya: 0 };
      existing.total_klaim += parseFloat(record.nilai_klaim_inacbgs);
      existing.total_biaya += parseFloat(record.total_biaya);
      specMap.set(record.spesialisasi, existing);
    }

    const categories = Array.from(specMap.keys());
    const klaimSeries = categories.map((s) => specMap.get(s)!.total_klaim);
    const biayaSeries = categories.map((s) => specMap.get(s)!.total_biaya);

    return {
      success: true,
      data: { categories, klaimSeries, biayaSeries },
    };
  } catch (error: any) {
    console.error("Error fetching chart data:", error);
    return { success: false, error: error.message };
  }
}

// Get available periods (reuse from pooling)
export async function getAvailablePeriods() {
  try {
    const { data, error } = await supabaseAdmin
      .from("pooling_pendapatan")
      .select("periode_layanan")
      .order("periode_layanan", { ascending: false });

    if (error) {
      return { success: false, error: error.message };
    }

    const periods = Array.from(
      new Set(
        (data || []).map((row: any) => {
          const date = new Date(row.periode_layanan);
          return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
        })
      )
    )
      .sort()
      .reverse();

    return { success: true, data: periods.map((p) => ({ periode: p })) };
  } catch (error: any) {
    console.error("Error fetching periods:", error);
    return { success: false, error: error.message };
  }
}
