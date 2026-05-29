"use server";

import { supabaseAdmin } from "@/lib/supabase";
import { revalidatePath } from "next/cache";

// ============================================================================
// KATEGORI CRUD OPERATIONS
// ============================================================================

export async function createKategori(data: {
  nama: string;
  deskripsi?: string;
  urutan?: number;
}) {
  try {
    const { data: kategori, error } = await supabaseAdmin
      .from("kategori_remunerasi")
      .insert({
        nama: data.nama,
        deskripsi: data.deskripsi,
        urutan: data.urutan ?? 0,
      })
      .select()
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    // Audit log
    await supabaseAdmin.from("audit_log_proses_jaspel").insert({
      action: "CREATE",
      table_name: "kategori_remunerasi",
      record_id: kategori.id,
      new_data: kategori,
    });

    revalidatePath("/proses/konfigurasi-remunerasi");
    return { success: true, data: kategori };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function updateKategori(id: string, data: {
  nama?: string;
  deskripsi?: string;
  urutan?: number;
}) {
  try {
    // Get old data for audit
    const { data: oldData } = await supabaseAdmin
      .from("kategori_remunerasi")
      .select("*")
      .eq("id", id)
      .single();

    const { data: kategori, error } = await supabaseAdmin
      .from("kategori_remunerasi")
      .update(data)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    // Audit log
    await supabaseAdmin.from("audit_log_proses_jaspel").insert({
      action: "UPDATE",
      table_name: "kategori_remunerasi",
      record_id: id,
      old_data: oldData,
      new_data: kategori,
    });

    revalidatePath("/proses/konfigurasi-remunerasi");
    return { success: true, data: kategori };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function deleteKategori(id: string) {
  try {
    // Get old data for audit
    const { data: oldData } = await supabaseAdmin
      .from("kategori_remunerasi")
      .select("*")
      .eq("id", id)
      .single();

    const { error } = await supabaseAdmin
      .from("kategori_remunerasi")
      .delete()
      .eq("id", id);

    if (error) {
      return { success: false, error: error.message };
    }

    // Audit log
    await supabaseAdmin.from("audit_log_proses_jaspel").insert({
      action: "DELETE",
      table_name: "kategori_remunerasi",
      record_id: id,
      old_data: oldData,
    });

    revalidatePath("/proses/konfigurasi-remunerasi");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function getKonfigurasiTree() {
  try {
    // Get all categories with their indicators and indices
    const { data: categories, error: catError } = await supabaseAdmin
      .from("kategori_remunerasi")
      .select(`
        *,
        indikator:indikator_remunerasi(
          *,
          indeks:indeks_pengukuran(
            *,
            volume_group:volume_aktivitas(*)
          )
        )
      `)
      .order("urutan", { ascending: true });

    if (catError) {
      return { success: false, error: catError.message };
    }

    return { success: true, data: categories };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// ============================================================================
// INDIKATOR CRUD OPERATIONS
// ============================================================================

export async function createIndikator(data: {
  kategori_id: string;
  nama: string;
  deskripsi?: string;
  urutan?: number;
}) {
  try {
    const { data: indikator, error } = await supabaseAdmin
      .from("indikator_remunerasi")
      .insert({
        kategori_id: data.kategori_id,
        nama: data.nama,
        deskripsi: data.deskripsi,
        urutan: data.urutan ?? 0,
      })
      .select()
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    // Audit log
    await supabaseAdmin.from("audit_log_proses_jaspel").insert({
      action: "CREATE",
      table_name: "indikator_remunerasi",
      record_id: indikator.id,
      new_data: indikator,
    });

    revalidatePath("/proses/konfigurasi-remunerasi");
    return { success: true, data: indikator };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function updateIndikator(id: string, data: {
  nama?: string;
  deskripsi?: string;
  urutan?: number;
}) {
  try {
    const { data: oldData } = await supabaseAdmin
      .from("indikator_remunerasi")
      .select("*")
      .eq("id", id)
      .single();

    const { data: indikator, error } = await supabaseAdmin
      .from("indikator_remunerasi")
      .update(data)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    // Audit log
    await supabaseAdmin.from("audit_log_proses_jaspel").insert({
      action: "UPDATE",
      table_name: "indikator_remunerasi",
      record_id: id,
      old_data: oldData,
      new_data: indikator,
    });

    revalidatePath("/proses/konfigurasi-remunerasi");
    return { success: true, data: indikator };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function deleteIndikator(id: string) {
  try {
    const { data: oldData } = await supabaseAdmin
      .from("indikator_remunerasi")
      .select("*")
      .eq("id", id)
      .single();

    const { error } = await supabaseAdmin
      .from("indikator_remunerasi")
      .delete()
      .eq("id", id);

    if (error) {
      return { success: false, error: error.message };
    }

    // Audit log
    await supabaseAdmin.from("audit_log_proses_jaspel").insert({
      action: "DELETE",
      table_name: "indikator_remunerasi",
      record_id: id,
      old_data: oldData,
    });

    revalidatePath("/proses/konfigurasi-remunerasi");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// ============================================================================
// INDEKS CRUD OPERATIONS
// ============================================================================

export async function createIndeks(data: {
  indikator_id: string;
  nama: string;
  tipe_skema: "indeks" | "aktivitas";
  label_pengukuran?: string;
  skala_indeks?: number;
  volume_group_id?: string;
  tarif_kategori?: string[];
  urutan?: number;
}) {
  try {
    if (data.tipe_skema === "indeks" && (!data.label_pengukuran || data.skala_indeks === undefined)) {
      return { success: false, error: "Label pengukuran dan skala indeks harus diisi untuk tipe indeks" };
    }
    if (data.tipe_skema === "aktivitas" && !data.volume_group_id) {
      return { success: false, error: "Volume group harus dipilih untuk tipe aktivitas" };
    }

    const { data: indeks, error } = await supabaseAdmin
      .from("indeks_pengukuran")
      .insert({
        indikator_id: data.indikator_id,
        nama: data.nama,
        tipe_skema: data.tipe_skema,
        label_pengukuran: data.label_pengukuran,
        skala_indeks: data.skala_indeks,
        volume_group_id: data.volume_group_id,
        tarif_kategori: data.tarif_kategori ?? [],
        urutan: data.urutan ?? 0,
      })
      .select()
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    // Audit log
    await supabaseAdmin.from("audit_log_proses_jaspel").insert({
      action: "CREATE",
      table_name: "indeks_pengukuran",
      record_id: indeks.id,
      new_data: indeks,
    });

    revalidatePath("/proses/konfigurasi-remunerasi");
    return { success: true, data: indeks };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function updateIndeks(id: string, data: {
  nama?: string;
  tipe_skema?: "indeks" | "aktivitas";
  label_pengukuran?: string;
  skala_indeks?: number;
  volume_group_id?: string;
  tarif_kategori?: string[];
  urutan?: number;
}) {
  try {
    const { data: oldData } = await supabaseAdmin
      .from("indeks_pengukuran")
      .select("*")
      .eq("id", id)
      .single();

    const { data: indeks, error } = await supabaseAdmin
      .from("indeks_pengukuran")
      .update(data)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    // Audit log
    await supabaseAdmin.from("audit_log_proses_jaspel").insert({
      action: "UPDATE",
      table_name: "indeks_pengukuran",
      record_id: id,
      old_data: oldData,
      new_data: indeks,
    });

    revalidatePath("/proses/konfigurasi-remunerasi");
    return { success: true, data: indeks };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function deleteIndeks(id: string) {
  try {
    const { data: oldData } = await supabaseAdmin
      .from("indeks_pengukuran")
      .select("*")
      .eq("id", id)
      .single();

    const { error } = await supabaseAdmin
      .from("indeks_pengukuran")
      .delete()
      .eq("id", id);

    if (error) {
      return { success: false, error: error.message };
    }

    // Audit log
    await supabaseAdmin.from("audit_log_proses_jaspel").insert({
      action: "DELETE",
      table_name: "indeks_pengukuran",
      record_id: id,
      old_data: oldData,
    });

    revalidatePath("/proses/konfigurasi-remunerasi");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// ============================================================================
// VOLUME AKTIVITAS CRUD OPERATIONS
// ============================================================================

export async function createVolumeGroup(data: {
  nama: string;
  deskripsi?: string;
  satuan?: string;
}) {
  try {
    const { data: volume, error } = await supabaseAdmin
      .from("volume_aktivitas")
      .insert({
        nama: data.nama,
        deskripsi: data.deskripsi,
        satuan: data.satuan,
      })
      .select()
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    // Audit log
    await supabaseAdmin.from("audit_log_proses_jaspel").insert({
      action: "CREATE",
      table_name: "volume_aktivitas",
      record_id: volume.id,
      new_data: volume,
    });

    revalidatePath("/proses/konfigurasi-remunerasi");
    return { success: true, data: volume };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function updateVolumeGroup(id: string, data: {
  nama?: string;
  deskripsi?: string;
  satuan?: string;
}) {
  try {
    const { data: oldData } = await supabaseAdmin
      .from("volume_aktivitas")
      .select("*")
      .eq("id", id)
      .single();

    const { data: volume, error } = await supabaseAdmin
      .from("volume_aktivitas")
      .update(data)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    // Audit log
    await supabaseAdmin.from("audit_log_proses_jaspel").insert({
      action: "UPDATE",
      table_name: "volume_aktivitas",
      record_id: id,
      old_data: oldData,
      new_data: volume,
    });

    revalidatePath("/proses/konfigurasi-remunerasi");
    return { success: true, data: volume };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function deleteVolumeGroup(id: string) {
  try {
    const { data: oldData } = await supabaseAdmin
      .from("volume_aktivitas")
      .select("*")
      .eq("id", id)
      .single();

    const { error } = await supabaseAdmin
      .from("volume_aktivitas")
      .delete()
      .eq("id", id);

    if (error) {
      return { success: false, error: error.message };
    }

    // Audit log
    await supabaseAdmin.from("audit_log_proses_jaspel").insert({
      action: "DELETE",
      table_name: "volume_aktivitas",
      record_id: id,
      old_data: oldData,
    });

    revalidatePath("/proses/konfigurasi-remunerasi");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function getVolumeGroups() {
  try {
    const { data, error } = await supabaseAdmin
      .from("volume_aktivitas")
      .select("*")
      .order("nama", { ascending: true });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, data };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// Fetch master tariffs for aktivitas scheme reference (jasa pelayanan medis)
export async function getMasterTarifs() {
  try {
    const { data, error } = await supabaseAdmin
      .from("tariffs")
      .select("id, code, name, category, base_amount, jasa_pelayanan_medis, jaspel_pct")
      .eq("is_active", true)
      .order("category", { ascending: true })
      .order("name", { ascending: true });

    if (error) return { success: false, error: error.message };
    return { success: true, data: data ?? [] };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
