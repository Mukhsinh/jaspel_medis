"use server";

import { supabaseAdmin } from "@/lib/supabase";
import * as XLSX from "xlsx";

// ─── Template headers — exact match to public reference file ───────────────
const TEMPLATE_HEADERS = [
  "grup", "tahun", "bulan", "tgl", "ptd", "norm", "nama_pasien",
  "kelas_rawat", "bagian", "inacbg", "grouper", "sp", "sr",
  "tarif_inacbg", "tarif_sp", "tarif_sr", "total_tarif",
  "diaglist", "diagnosa_1", "diagnosa_2", "diagnosa_3", "diagnosa_4", "diagnosa_5",
  "proclist", "proc_1", "proc_2", "proc_3", "proc_4", "proc_5",
  "dpjp",
  "pendaftaran", "tindakan", "farmasi", "farmasi_regular", "farmasi_kronis",
  "lab_pk", "lab_pa", "rad", "bdrs", "pcr",
  "sewa_kamar", "askep_mandiri", "laboratorium", "farmasi", "perawatan",
  "partus", "adm_perawatan", "hnd", "visite_dokter_konsultasi", "radiologi",
  "gawat_darurat", "ekg", "rawat_jalan", "kamar_bedah", "alat_medis",
  "adm_rawat_jalan", "rawat_intensive", "pelayanan_darah", "tindakan_dokter",
  "ambulance_atau_pemulasaran_jenazah", "hemodialisa", "ponek", "lain_lain",
  "nicu_bayi_intensive", "trans_di_luar", "sewa_kamar_nicu", "layanan_non_medis",
  "laundry", "cathlab", "mcu", "diagnostik_elektromedik", "akomodasi_kamar",
  "lab_patologi_anatomi",
  "nota_gross", "retur_farmasi", "pembulatan", "nota_netto", "st_bpjs",
];

// Komponen biaya detail — kolom yang akan disimpan ke tabel detail_biaya
const BIAYA_COMPONENTS = [
  "pendaftaran", "tindakan", "farmasi_regular", "farmasi_kronis",
  "lab_pk", "lab_pa", "rad", "bdrs", "pcr",
  "sewa_kamar", "askep_mandiri", "laboratorium", "perawatan",
  "partus", "adm_perawatan", "hnd", "visite_dokter_konsultasi", "radiologi",
  "gawat_darurat", "ekg", "rawat_jalan", "kamar_bedah", "alat_medis",
  "adm_rawat_jalan", "rawat_intensive", "pelayanan_darah", "tindakan_dokter",
  "ambulance_atau_pemulasaran_jenazah", "hemodialisa", "ponek", "lain_lain",
  "nicu_bayi_intensive", "trans_di_luar", "sewa_kamar_nicu", "layanan_non_medis",
  "laundry", "cathlab", "mcu", "diagnostik_elektromedik", "akomodasi_kamar",
  "lab_patologi_anatomi",
];

// Generate downloadable template — same header structure as public reference file
export async function downloadPoolingTemplate() {
  try {
    const wb = XLSX.utils.book_new();

    // Example data rows matching the reference format
    const exampleRows = [
      [
        "01. KLAIM UTAMA", 2025, 1, "2025-01-15", 1, "001234", "RIZAL HAFIZ, DR., SP.PD",
        3, "PENYAKIT DALAM", "GANGGUAN SISTEM PENCERNAAN LAIN-LAIN (RINGAN)", "K-4-18-I", "-", "-",
        1242600, 0, 0, 1242600,
        "K30", "Dyspepsia", "", "", "", "",
        "-", "", "", "", "", "",
        "RIZAL HAFIZ, DR., SP.PD",
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
        620000, 0, 298000, 498083, 720000, 0, 50000, 0, 255000, 292500,
        255000, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 350000, 0,
        3338583, 37765, 82, 3300900, "DIBAYAR",
      ],
      [
        "01. KLAIM UTAMA", 2025, 1, "2025-01-20", 1, "001235", "SITI RAHAYU, DR., SP.OG",
        3, "KEBIDANAN", "PERSALINAN VAGINAL (RINGAN)", "O-6-13-I", "-", "-",
        1544900, 0, 0, 1544900,
        "O42.9", "Premature rupture of membranes", "", "", "", "",
        "73.4", "Medical induction of labor", "", "", "", "",
        "SITI RAHAYU, DR., SP.OG",
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
        275000, 0, 563500, 385686, 1770000, 0, 50000, 0, 275000, 0,
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 435000, 0, 0, 0, 0, 0, 0, 0, 0, 150000, 0,
        3904186, 0, 14, 3904200, "DIBAYAR",
      ],
    ];

    const wsData = [TEMPLATE_HEADERS, ...exampleRows];
    const ws = XLSX.utils.aoa_to_sheet(wsData);

    // Column widths
    ws["!cols"] = TEMPLATE_HEADERS.map((h) => {
      if (["nama_pasien", "dpjp", "inacbg", "grouper"].includes(h)) return { wch: 35 };
      if (["bagian", "diaglist", "diagnosa_1"].includes(h)) return { wch: 30 };
      if (h.startsWith("diagnosa_") || h.startsWith("proc")) return { wch: 20 };
      if (["nota_gross", "nota_netto", "total_tarif", "tarif_inacbg"].includes(h)) return { wch: 16 };
      if (h === "ambulance_atau_pemulasaran_jenazah") return { wch: 36 };
      return { wch: 14 };
    });

    XLSX.utils.book_append_sheet(wb, ws, "Rekap");

    const buf: Buffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });
    return {
      success: true,
      data: Array.from(buf) as number[],
      filename: "template_pooling_pendapatan.xlsx",
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// Get pooling data with filters
export async function getPoolingData(
  periode?: string,
  spesialisasi?: string,
  page: number = 1,
  limit: number = 50
) {
  try {
    let query = supabaseAdmin
      .from("pooling_pendapatan")
      .select("*", { count: "exact" });

    if (periode) {
      const [year, month] = periode.split("-");
      const startDate = `${year}-${month}-01`;
      const endDate = new Date(parseInt(year), parseInt(month), 0)
        .toISOString()
        .split("T")[0];
      query = query
        .gte("periode_layanan", startDate)
        .lte("periode_layanan", endDate);
    }

    if (spesialisasi) {
      query = query.eq("spesialisasi", spesialisasi);
    }

    const { data, error, count } = await query
      .order("periode_layanan", { ascending: false })
      .order("created_at", { ascending: false })
      .range((page - 1) * limit, page * limit - 1);

    if (error) return { success: false, error: error.message };

    return {
      success: true,
      data: data || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// Get detail biaya for a pooling record
export async function getDetailBiaya(poolingId: string) {
  try {
    const { data, error } = await supabaseAdmin
      .from("detail_biaya")
      .select("*")
      .eq("pooling_id", poolingId)
      .order("komponen_biaya");

    if (error) return { success: false, error: error.message };
    return { success: true, data: data || [] };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// Get unique periods from pooling data
export async function getAvailablePeriods() {
  try {
    const { data, error } = await supabaseAdmin
      .from("pooling_pendapatan")
      .select("periode_layanan")
      .order("periode_layanan", { ascending: false });

    if (error) return { success: false, error: error.message };

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
    return { success: false, error: error.message };
  }
}

// Get unique specializations
export async function getSpecializations() {
  try {
    const { data, error } = await supabaseAdmin
      .from("pooling_pendapatan")
      .select("spesialisasi")
      .order("spesialisasi");

    if (error) return { success: false, error: error.message };

    const specializations = Array.from(
      new Set((data || []).map((row: any) => row.spesialisasi))
    ).sort();

    return {
      success: true,
      data: specializations.map((s) => ({ spesialisasi: s })),
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// Update pooling record
export async function updatePoolingRecord(id: string, data: any) {
  try {
    const { data: updated, error } = await supabaseAdmin
      .from("pooling_pendapatan")
      .update({
        periode_layanan: data.periode_layanan,
        status_klaim: data.status_klaim,
        doctor_name: data.doctor_name,
        spesialisasi: data.spesialisasi,
        patient_name: data.patient_name,
        rm_no: data.rm_no,
        diagnosis_grouper: data.diagnosis_grouper,
        nilai_klaim_inacbgs: data.nilai_klaim_inacbgs,
        jasa_sarana: data.jasa_sarana,
        total_biaya: data.total_biaya,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();

    if (error) return { success: false, error: error.message };

    await supabaseAdmin.from("audit_log_proses_jaspel").insert({
      action: "UPDATE",
      table_name: "pooling_pendapatan",
      record_id: id,
      new_data: data,
    });

    return { success: true, data: updated };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// Delete pooling record
export async function deletePoolingRecord(id: string) {
  try {
    const { error } = await supabaseAdmin
      .from("pooling_pendapatan")
      .delete()
      .eq("id", id);

    if (error) return { success: false, error: error.message };

    await supabaseAdmin.from("audit_log_proses_jaspel").insert({
      action: "DELETE",
      table_name: "pooling_pendapatan",
      record_id: id,
    });

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// Import pooling data from Excel — supports the full INA-CBGs reference format
export async function importPoolingData(
  fileData: number[],
  bulan: number,
  tahun: number
) {
  try {
    const workbook = XLSX.read(Buffer.from(fileData), { type: "buffer", cellDates: true });
    // Accept sheet named "Rekap" (reference format) or first sheet
    const sheetName = workbook.SheetNames.includes("Rekap")
      ? "Rekap"
      : workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];

    const rawRows: any[][] = XLSX.utils.sheet_to_json(worksheet, {
      header: 1,
      defval: "",
    });

    if (rawRows.length < 2) {
      return { success: false, error: "File tidak berisi data" };
    }

    const headers: string[] = rawRows[0].map((h: any) =>
      String(h ?? "").trim().toLowerCase()
    );
    const dataRows = rawRows.slice(1).filter((r) => r.some((c) => c !== "" && c !== null));

    // Build column index map with variations
    const colMap: Record<string, number> = {};
    const variations: Record<string, string[]> = {
      dpjp: ["dpjp", "nama dokter", "dokter", "nama dpjp"],
      norm: ["norm", "no rm", "no. rm", "rm_no", "rekam medis"],
      nama_pasien: ["nama_pasien", "nama pasien", "pasien", "patient_name"],
      grouper: ["grouper", "kode inacbg", "kode", "inacbg_code", "diagnosis_grouper"],
      tarif_inacbg: ["tarif_inacbg", "tarif inacbg", "tarif klaim", "nilai klaim"],
      nota_netto: ["nota_netto", "nota netto", "biaya riil", "total biaya", "netto"],
      tgl: ["tgl", "tanggal", "tgl_layanan", "date"],
      st_bpjs: ["st_bpjs", "status bpjs", "status", "st_klaim"]
    };

    const requiredCols = ["dpjp", "norm", "nama_pasien", "grouper", "tarif_inacbg", "nota_netto"];

    requiredCols.forEach((rc: string) => {
      const foundIdx = headers.findIndex(h => variations[rc]?.includes(h) || h === rc);
      if (foundIdx !== -1) colMap[rc] = foundIdx;
    });

    const missingCols = requiredCols.filter((c: string) => colMap[c] === undefined);
    if (missingCols.length > 0) {
      return {
        success: false,
        error: `Kolom wajib tidak ditemukan: ${missingCols.join(", ")}. Pastikan menggunakan template yang benar atau kolom sudah sesuai.`,
      };
    }

    const col = (name: string): number => {
      if (colMap[name] !== undefined) return colMap[name];
      return headers.findIndex(h => variations[name]?.includes(h) || h === name);
    };

    let successCount = 0;
    const insertErrors: string[] = [];

    for (let i = 0; i < dataRows.length; i++) {
      const row = dataRows[i];
      const rowNum = i + 2;

      const getVal = (colName: string): any => {
        const idx = col(colName);
        return idx !== -1 ? row[idx] : "";
      };
      const getNum = (colName: string): number => {
        const v = getVal(colName);
        if (typeof v === "number") return v;
        return parseFloat(String(v ?? "0").replace(/[^0-9.-]/g, "")) || 0;
      };
      const getStr = (colName: string): string =>
        String(getVal(colName) ?? "").trim();

      const doctorName = getStr("dpjp");
      const rmNo = getStr("norm");
      const patientName = getStr("nama_pasien");
      const diagnosisGrouper = getStr("grouper");
      const diagnosisName = getStr("inacbg") || variations.grouper.map(v => getStr(v)).find(v => v !== "");
      const bagian = getStr("bagian") || "UMUM";
      const nilaiKlaim = getNum("tarif_inacbg");
      const notaNetto = getNum("nota_netto") || getNum("nota_gross") || 0;
      const statusRaw = getStr("st_bpjs").toLowerCase();
      const statusKlaim = (statusRaw.includes("pending") || statusRaw.includes("dispute")) ? "pending" : "regular";

      // Date parsing
      let periodeLayanan = `${tahun}-${String(bulan).padStart(2, "0")}-01`;
      const tglVal = getVal("tgl");
      if (tglVal && tglVal instanceof Date && !isNaN(tglVal.getTime())) {
        periodeLayanan = tglVal.toISOString().split("T")[0];
      } else if (typeof tglVal === "string" && tglVal.match(/^\d{1,2}[\/-]\d{1,2}[\/-]\d{2,4}$/)) {
        // Handle Indo format DD/MM/YYYY
        const parts = tglVal.split(/[\/-]/);
        if (parts.length === 3) {
          const d = parts[0].padStart(2, '0');
          const m = parts[1].padStart(2, '0');
          let y = parts[2];
          if (y.length === 2) y = "20" + y;
          periodeLayanan = `${y}-${m}-${d}`;
        }
      } else if (typeof tglVal === "string" && tglVal.match(/^\d{4}-\d{2}-\d{2}/)) {
        periodeLayanan = tglVal.substring(0, 10);
      }

      if (!doctorName || !rmNo) {
        insertErrors.push(`Baris ${rowNum}: Nama dokter atau RM No kosong`);
        continue;
      }

      const { data: doctorData } = await supabaseAdmin
        .from("doctors")
        .select("id, specialization")
        .ilike("name", `%${doctorName.replace(/^(dr\.|drg\.|dr\s|drg\s)/i, "").trim()}%`)
        .limit(1)
        .maybeSingle();

      const jasaSarana = notaNetto > nilaiKlaim ? notaNetto - nilaiKlaim : 0;

      const { data: inserted, error } = await supabaseAdmin
        .from("pooling_pendapatan")
        .insert({
          periode_layanan: periodeLayanan,
          bulan: parseInt(periodeLayanan.split("-")[1]),
          tahun: parseInt(periodeLayanan.split("-")[0]),
          status_klaim: statusKlaim,
          doctor_id: doctorData?.id ?? null,
          doctor_name: doctorName,
          spesialisasi: doctorData?.specialization ?? bagian,
          patient_name: patientName,
          rm_no: rmNo,
          diagnosis_grouper: diagnosisGrouper || diagnosisName,
          nilai_klaim_inacbgs: nilaiKlaim,
          jasa_sarana: jasaSarana,
          total_biaya: notaNetto,
          deficit: 0,
          pooling_medis: 0,
        })
        .select("id")
        .single();

      if (error) {
        insertErrors.push(`Baris ${rowNum}: ${error.message}`);
        continue;
      }

      // Insert detail biaya components (only non-zero values)
      const detailRows: { pooling_id: string; komponen_biaya: string; nilai: number }[] = [];
      for (const comp of BIAYA_COMPONENTS) {
        const val = getNum(comp);
        if (val > 0) {
          detailRows.push({
            pooling_id: inserted.id,
            komponen_biaya: comp.replace(/_/g, " "),
            nilai: val,
          });
        }
      }
      if (detailRows.length > 0) {
        await supabaseAdmin.from("detail_biaya").insert(detailRows);
      }

      successCount++;
    }

    await supabaseAdmin.from("audit_log_proses_jaspel").insert({
      action: "IMPORT",
      table_name: "pooling_pendapatan",
      new_data: { successCount, totalRows: dataRows.length, bulan, tahun },
    });

    return {
      success: true,
      count: successCount,
      total: dataRows.length,
      errors: insertErrors.length > 0 ? insertErrors : undefined,
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// Calculate pooling for a period
export async function calculatePooling(periode: string) {
  try {
    const [year, month] = periode.split("-");
    const startDate = `${year}-${month}-01`;
    const endDate = new Date(parseInt(year), parseInt(month), 0)
      .toISOString()
      .split("T")[0];

    const { data: records, error } = await supabaseAdmin
      .from("pooling_pendapatan")
      .select("id, doctor_id, doctor_name, nilai_klaim_inacbgs, total_biaya")
      .gte("periode_layanan", startDate)
      .lte("periode_layanan", endDate);

    if (error) return { success: false, error: error.message };

    const doctorMap = new Map<string, { total_klaim: number; total_biaya: number }>();
    for (const record of records || []) {
      const existing = doctorMap.get(record.doctor_id) || { total_klaim: 0, total_biaya: 0 };
      existing.total_klaim += parseFloat(record.nilai_klaim_inacbgs);
      existing.total_biaya += parseFloat(record.total_biaya);
      doctorMap.set(record.doctor_id, existing);
    }

    let updatedCount = 0;
    for (const [doctorId, doctor] of doctorMap.entries()) {
      const poolingMedis = doctor.total_klaim * 0.17;
      const deficit = doctor.total_biaya > doctor.total_klaim ? doctor.total_biaya - doctor.total_klaim : 0;

      const { error: updateError } = await supabaseAdmin
        .from("pooling_pendapatan")
        .update({ pooling_medis: poolingMedis, deficit, updated_at: new Date().toISOString() })
        .eq("doctor_id", doctorId)
        .gte("periode_layanan", startDate)
        .lte("periode_layanan", endDate);

      if (!updateError) updatedCount++;
    }

    await supabaseAdmin.from("audit_log_proses_jaspel").insert({
      action: "CALCULATE",
      table_name: "pooling_pendapatan",
      new_data: { periode, doctorCount: updatedCount },
    });

    return { success: true, count: updatedCount, message: `Berhasil menghitung pooling untuk ${updatedCount} dokter` };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// Export pooling data to Excel
export async function exportPoolingData(periode?: string, spesialisasi?: string) {
  try {
    let query = supabaseAdmin
      .from("pooling_pendapatan")
      .select("periode_layanan, status_klaim, doctor_name, spesialisasi, patient_name, rm_no, diagnosis_grouper, nilai_klaim_inacbgs, jasa_sarana, total_biaya, deficit, pooling_medis");

    if (periode) {
      const [year, month] = periode.split("-");
      const startDate = `${year}-${month}-01`;
      const endDate = new Date(parseInt(year), parseInt(month), 0).toISOString().split("T")[0];
      query = query.gte("periode_layanan", startDate).lte("periode_layanan", endDate);
    }
    if (spesialisasi) query = query.eq("spesialisasi", spesialisasi);

    const { data, error } = await query.order("periode_layanan", { ascending: false }).order("doctor_name");
    if (error) return { success: false, error: error.message };

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(data || []);
    ws["!cols"] = Array(12).fill({ wch: 18 });
    XLSX.utils.book_append_sheet(wb, ws, "Pooling Pendapatan");

    const buf: Buffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });
    return { success: true, data: Array.from(buf) as number[], filename: `pooling_pendapatan_${periode || "all"}.xlsx` };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
