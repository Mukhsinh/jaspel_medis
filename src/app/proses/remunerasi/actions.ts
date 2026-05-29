"use server";

import { supabaseAdmin } from "@/lib/supabase";
import * as XLSX from "xlsx";

// ─── helpers ────────────────────────────────────────────────────────────────

async function getPeriodDates(periode: string) {
  const [year, month] = periode.split("-");
  const startDate = `${year}-${month}-01`;
  const endDate = new Date(parseInt(year), parseInt(month), 0).toISOString().split("T")[0];
  return { startDate, endDate };
}

// ─── periods ────────────────────────────────────────────────────────────────

export async function getRemunerasiPeriods() {
  try {
    // 1. Fetch from pooling_pendapatan
    const { data: pooling } = await supabaseAdmin
      .from("pooling_pendapatan")
      .select("periode_layanan")
      .order("periode_layanan", { ascending: false });

    // 2. Fetch from payroll_periods
    const { data: payroll } = await supabaseAdmin
      .from("payroll_periods")
      .select("month, year")
      .order("year", { ascending: false })
      .order("month", { ascending: false });

    const pSet = new Set<string>();

    // Add from pooling
    (pooling || []).forEach((r: any) => {
      const d = new Date(r.periode_layanan);
      pSet.add(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
    });

    // Add from payroll
    (payroll || []).forEach((r: any) => {
      pSet.add(`${r.year}-${String(r.month).padStart(2, "0")}`);
    });

    // Add current month and last month as default options if needed
    const now = new Date();
    pSet.add(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`);
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    pSet.add(`${lastMonth.getFullYear()}-${String(lastMonth.getMonth() + 1).padStart(2, "0")}`);

    const periods = Array.from(pSet).sort().reverse();

    return { success: true, data: periods.map(p => ({ periode: p })) };
  } catch (e: any) { return { success: false, error: e.message }; }
}

// ─── doctors for period ──────────────────────────────────────────────────────

export async function getDoctorsForPeriod(periode: string) {
  try {
    const { startDate, endDate } = await getPeriodDates(periode);
    const { data: pooling } = await supabaseAdmin
      .from("pooling_pendapatan")
      .select("doctor_id, doctor_name, spesialisasi, nilai_klaim_inacbgs, pooling_medis")
      .gte("periode_layanan", startDate).lte("periode_layanan", endDate);

    const map = new Map<string, { doctor_name: string; spesialisasi: string; pendapatan: number; pooling_medis: number }>();

    if (pooling && pooling.length > 0) {
      for (const r of pooling) {
        if (!r.doctor_id) continue;
        const ex = map.get(r.doctor_id) || { doctor_name: r.doctor_name, spesialisasi: r.spesialisasi, pendapatan: 0, pooling_medis: 0 };
        ex.pendapatan += parseFloat(r.nilai_klaim_inacbgs || 0);
        ex.pooling_medis += parseFloat(r.pooling_medis || 0);
        map.set(r.doctor_id, ex);
      }
    } else {
      // Fallback: Show all active doctors
      const { data: activeDocs } = await supabaseAdmin.from("doctors").select("id, name, specialization").eq("is_active", true);
      (activeDocs || []).forEach(d => {
        map.set(d.id, { doctor_name: d.name, spesialisasi: d.specialization, pendapatan: 0, pooling_medis: 0 });
      });
    }

    const doctorIds = Array.from(map.keys());
    const { data: penilaian } = await supabaseAdmin.from("penilaian_dokter").select("doctor_id")
      .eq("periode_layanan", startDate).in("doctor_id", doctorIds);
    const { data: hasil } = await supabaseAdmin.from("hasil_remunerasi").select("doctor_id")
      .eq("periode_layanan", startDate).in("doctor_id", doctorIds);

    const assessedIds = new Set((penilaian || []).map((a: any) => a.doctor_id));
    const hasilIds = new Set((hasil || []).map((h: any) => h.doctor_id));

    return {
      success: true,
      data: Array.from(map.entries()).map(([id, d]) => ({
        doctor_id: id, ...d,
        has_assessment: assessedIds.has(id),
        has_hasil: hasilIds.has(id),
      })),
    };
  } catch (e: any) { return { success: false, error: e.message }; }
}

// ─── get active tarifs from configured aktivitas indeks ──────────────────────

async function getAktivitasTarifs() {
  // Fetch all aktivitas indeks that have tarif_kategori configured
  const { data: indeksList, error } = await supabaseAdmin
    .from("indeks_pengukuran")
    .select("id, nama, tarif_kategori, indikator:indikator_remunerasi(nama, kategori:kategori_remunerasi(nama))")
    .eq("tipe_skema", "aktivitas");
  if (error) throw new Error(error.message);

  // Collect all unique categories across all aktivitas indeks
  const allCategories = Array.from(new Set(
    (indeksList || []).flatMap((i: any) => i.tarif_kategori || [])
  ));

  if (allCategories.length === 0) return { indeksList: indeksList || [], tarifs: [] };

  // Fetch tarifs for those categories
  const { data: tarifs, error: tarifError } = await supabaseAdmin
    .from("tariffs")
    .select("id, code, name, category, base_amount, jasa_pelayanan_medis, jaspel_pct")
    .eq("is_active", true)
    .in("category", allCategories)
    .order("category").order("name");
  if (tarifError) throw new Error(tarifError.message);

  return { indeksList: indeksList || [], tarifs: tarifs || [] };
}

// ─── download template ───────────────────────────────────────────────────────

export async function downloadAssessmentTemplate(periode: string) {
  try {
    const { startDate, endDate } = await getPeriodDates(periode);
    const { tarifs } = await getAktivitasTarifs();

    if (tarifs.length === 0)
      return { success: false, error: "Belum ada konfigurasi tarif aktivitas. Atur di Konfigurasi Remunerasi." };

    // Fetch existing pooling data to pre-fill patient info if available
    const { data: pooling } = await supabaseAdmin
      .from("pooling_pendapatan")
      .select("doctor_id, doctor_name, spesialisasi, patient_name, rm_no")
      .gte("periode_layanan", startDate).lte("periode_layanan", endDate);

    // Headers for detailed tracking
    const headers = [
      "doctor_id", "Nama Dokter", "Spesialisasi",
      "Nama Pasien", "RM No", "Kode Tarif", "Nama Tarif [ID]", "Volume"
    ];

    let rows: any[][] = [];

    if (pooling && pooling.length > 0) {
      // If we have pooling data, we can pre-fill patient info
      rows = pooling.map(p => [
        p.doctor_id, p.doctor_name, p.spesialisasi,
        p.patient_name, p.rm_no, "", "", ""
      ]);
    } else {
      // Fallback to just doctors if no pooling data
      const doctorsRes = await getDoctorsForPeriod(periode);
      if (doctorsRes.success && doctorsRes.data) {
        rows = doctorsRes.data.map(doc => [
          doc.doctor_id, doc.doctor_name, doc.spesialisasi,
          "", "", "", "", ""
        ]);
      }
    }

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);

    ws["!cols"] = [
      { wch: 36 }, { wch: 25 }, { wch: 20 },
      { wch: 25 }, { wch: 15 }, { wch: 15 }, { wch: 45 }, { wch: 10 }
    ];
    XLSX.utils.book_append_sheet(wb, ws, "Input Volume Detail");

    // Reference sheets
    const infoHeaders = ["Nama Tarif", "Kode", "Kategori", "Jasa Pelayanan Medis", "Template Input [Nama [ID]]", "ID"];
    const infoRows = tarifs.map((t: any) => [
      t.name, t.code, t.category,
      t.jasa_pelayanan_medis ?? 0, `${t.name} [${t.id}]`, t.id,
    ]);
    const wsInfo = XLSX.utils.aoa_to_sheet([infoHeaders, ...infoRows]);
    wsInfo["!cols"] = [{ wch: 35 }, { wch: 14 }, { wch: 16 }, { wch: 22 }, { wch: 45 }, { wch: 36 }];
    XLSX.utils.book_append_sheet(wb, wsInfo, "Referensi Tarif");

    const buf: Buffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });
    return { success: true, data: Array.from(buf) as number[], filename: `template_remunerasi_detail_${periode}.xlsx` };
  } catch (e: any) { return { success: false, error: e.message }; }
}

// ─── import assessments ──────────────────────────────────────────────────────

export async function importAssessments(fileBuffer: Buffer, periode: string) {
  try {
    const wb = XLSX.read(fileBuffer, { type: "buffer" });
    const ws = wb.Sheets[wb.SheetNames[0]];
    const rawRows: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1, defval: "" });
    if (rawRows.length < 2) return { success: false, error: "File tidak berisi data" };

    const headers: string[] = rawRows[0].map((h: any) => String(h).trim());
    const dataRows = rawRows.slice(1).filter(r => r.some(c => c !== ""));

    const colIdx = {
      doctorId: headers.indexOf("doctor_id"),
      patientName: headers.indexOf("Nama Pasien"),
      rmNo: headers.indexOf("RM No"),
      tarifWithId: headers.indexOf("Nama Tarif [ID]"),
      volume: headers.indexOf("Volume")
    };

    if (colIdx.doctorId === -1 || colIdx.tarifWithId === -1 || colIdx.volume === -1) {
      return { success: false, error: "Format template tidak sesuai. Kolom doctor_id, Nama Tarif [ID], dan Volume wajib ada." };
    }

    // Fetch all aktivitas indeks categories for matching
    const { data: indeksList } = await supabaseAdmin
      .from("indeks_pengukuran").select("id, tarif_kategori").eq("tipe_skema", "aktivitas");

    const { startDate } = await getPeriodDates(periode);
    let successCount = 0;
    const errors: string[] = [];

    // Process each row
    for (let i = 0; i < dataRows.length; i++) {
      const row = dataRows[i];
      const rowNum = i + 2;

      const doctorId = String(row[colIdx.doctorId] || "").trim();
      const patientName = String(row[colIdx.patientName] || "").trim();
      const rmNo = String(row[colIdx.rmNo] || "").trim();
      const tarifWithId = String(row[colIdx.tarifWithId] || "").trim();
      const rawVol = row[colIdx.volume];

      if (!doctorId || !tarifWithId) continue;

      const volume = parseFloat(String(rawVol).replace(/[^0-9.]/g, ""));
      if (isNaN(volume) || volume <= 0) continue;

      // Extract tarifId from "Name [uuid]"
      const match = tarifWithId.match(/\[([a-f0-9-]{36})\]$/);
      if (!match) {
        errors.push(`Baris ${rowNum}: Format Nama Tarif [ID] tidak valid`);
        continue;
      }
      const tarifId = match[1];

      // Fetch tarif details
      const { data: tarif } = await supabaseAdmin
        .from("tariffs").select("category, jasa_pelayanan_medis").eq("id", tarifId).single();

      if (!tarif) {
        errors.push(`Baris ${rowNum}: Tarif dengan ID ${tarifId} tidak ditemukan`);
        continue;
      }

      const nilai = volume * parseFloat(tarif.jasa_pelayanan_medis || 0);

      // Find matching indeks_id
      const matchingIndeks = (indeksList || []).find((idx: any) =>
        (idx.tarif_kategori || []).includes(tarif.category)
      );
      const indeksId = matchingIndeks?.id;

      if (!indeksId) {
        errors.push(`Baris ${rowNum}: Tidak ada indeks untuk kategori tarif ${tarif.category}`);
        continue;
      }

      const { error } = await supabaseAdmin.from("penilaian_dokter").insert({
        periode_layanan: startDate,
        doctor_id: doctorId,
        indeks_id: indeksId,
        tarif_id: tarifId,
        patient_name: patientName || null,
        rm_no: rmNo || null,
        nilai,
        volume,
      });

      if (error) errors.push(`Baris ${rowNum}: ${error.message}`);
      else successCount++;
    }

    await supabaseAdmin.from("audit_log_proses_jaspel").insert({
      action: "IMPORT_DETAIL", table_name: "penilaian_dokter",
      new_data: { periode, successCount, totalRows: dataRows.length },
    });

    return { success: true, count: successCount, total: dataRows.length, errors: errors.length ? errors : undefined };
  } catch (e: any) {
    console.error("Import Error:", e);
    return { success: false, error: e.message };
  }
}

// ─── calculate remuneration ──────────────────────────────────────────────────

export async function calculateRemuneration(periode: string) {
  try {
    const { startDate, endDate } = await getPeriodDates(periode);
    const doctorsRes = await getDoctorsForPeriod(periode);
    if (!doctorsRes.success || !doctorsRes.data) return { success: false, error: "Gagal memuat data dokter" };

    // Sum all penilaian per doctor to get total_indeks (total nilai = volume × jaspel_medis)
    const { data: allPenilaian, error: pErr } = await supabaseAdmin
      .from("penilaian_dokter").select("doctor_id, nilai")
      .gte("periode_layanan", startDate).lte("periode_layanan", endDate);
    if (pErr) return { success: false, error: pErr.message };

    // Group total nilai per doctor
    const nilaiMap = new Map<string, number>();
    for (const p of allPenilaian || []) {
      nilaiMap.set(p.doctor_id, (nilaiMap.get(p.doctor_id) || 0) + parseFloat(p.nilai));
    }

    // Total nilai across all doctors = pool for PIR calculation
    const totalNilaiSemua = Array.from(nilaiMap.values()).reduce((s, v) => s + v, 0);

    // Total pooling medis for the period
    const { data: poolingData } = await supabaseAdmin
      .from("pooling_pendapatan").select("doctor_id, pooling_medis")
      .gte("periode_layanan", startDate).lte("periode_layanan", endDate);
    const totalPooling = (poolingData || []).reduce((s: number, r: any) => s + parseFloat(r.pooling_medis || 0), 0);

    // PIR = total pooling / total nilai semua dokter
    const pir = totalNilaiSemua > 0 ? totalPooling / totalNilaiSemua : 0;

    let calculatedCount = 0;
    const errors: string[] = [];

    for (const doc of doctorsRes.data) {
      const totalIndeks = nilaiMap.get(doc.doctor_id) || 0;
      if (totalIndeks === 0) { errors.push(`${doc.doctor_name}: total indeks 0, dilewati`); continue; }

      const remunerasiFinal = pir * totalIndeks;

      const { error } = await supabaseAdmin.from("hasil_remunerasi").upsert({
        periode_layanan: startDate,
        doctor_id: doc.doctor_id,
        doctor_name: doc.doctor_name,
        spesialisasi: doc.spesialisasi,
        pendapatan_dokter: doc.pendapatan,
        total_indeks: totalIndeks,
        pir,
        remunerasi_final: remunerasiFinal,
        status: "draft",
        updated_at: new Date().toISOString(),
      }, { onConflict: "periode_layanan,doctor_id" });

      if (error) errors.push(`${doc.doctor_name}: ${error.message}`);
      else calculatedCount++;
    }

    await supabaseAdmin.from("audit_log_proses_jaspel").insert({
      action: "CALCULATE", table_name: "hasil_remunerasi",
      new_data: { periode, calculatedCount, pir, totalPooling, totalNilaiSemua },
    });

    return {
      success: true, count: calculatedCount,
      message: `Berhasil menghitung remunerasi ${calculatedCount} dokter. PIR = ${pir.toFixed(4)}`,
      errors: errors.length ? errors : undefined,
    };
  } catch (e: any) { return { success: false, error: e.message }; }
}

// ─── get results ─────────────────────────────────────────────────────────────

export async function getRemunerasiResults(periode: string) {
  try {
    const { startDate, endDate } = await getPeriodDates(periode);
    const { data, error } = await supabaseAdmin
      .from("hasil_remunerasi").select("*")
      .gte("periode_layanan", startDate).lte("periode_layanan", endDate)
      .order("remunerasi_final", { ascending: false });
    if (error) return { success: false, error: error.message };
    return { success: true, data: data || [] };
  } catch (e: any) { return { success: false, error: e.message }; }
}

export async function updateRemunerasiStatus(id: string, status: "draft" | "approved" | "paid") {
  try {
    const { error } = await supabaseAdmin
      .from("hasil_remunerasi").update({ status, updated_at: new Date().toISOString() }).eq("id", id);
    if (error) return { success: false, error: error.message };
    await supabaseAdmin.from("audit_log_proses_jaspel").insert({
      action: "UPDATE", table_name: "hasil_remunerasi", record_id: id, new_data: { status },
    });
    return { success: true };
  } catch (e: any) { return { success: false, error: e.message }; }
}

// ─── get penilaian detail for a doctor ───────────────────────────────────────

export async function getPenilaianDetail(doctorId: string, periode: string) {
  try {
    const { startDate, endDate } = await getPeriodDates(periode);
    const { data, error } = await supabaseAdmin
      .from("penilaian_dokter")
      .select("nilai, volume, patient_name, rm_no, tarif:tariffs(name), indeks:indeks_pengukuran(nama, tipe_skema)")
      .eq("doctor_id", doctorId)
      .gte("periode_layanan", startDate).lte("periode_layanan", endDate)
      .order("created_at", { ascending: false });
    if (error) return { success: false, error: error.message };
    return { success: true, data: data || [] };
  } catch (e: any) { return { success: false, error: e.message }; }
}
