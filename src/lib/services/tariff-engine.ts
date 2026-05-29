// Tariff Engine for Jaspel Medis

export interface TariffCalculationResult {
  bruto: number;
  description: string;
}

export const calculateTariff = (
  type: string,
  baseFee: number,
  params: {
    isHadir?: boolean;
    isSpPD?: boolean;
    isUmum?: boolean;
    category?: string;
    isDPJPHadir?: boolean;
  }
): TariffCalculationResult => {
  let bruto = baseFee;
  let description = "";

  switch (type) {
    case "RAWAT_JALAN":
      if (params.isHadir === false) {
        bruto = baseFee * 0.5;
        description = "Dokter tidak hadir (50% tarif)";
      } else {
        description = "Pemeriksaan dokter spesialis";
      }
      break;

    case "HEMODIALISA":
      if (params.isSpPD) {
        bruto = baseFee * 0.8;
        description = "SpPD (80%)";
      } else if (params.isUmum) {
        bruto = baseFee * 0.2;
        description = "Dokter Umum Pendamping (20%)";
      }
      break;

    case "RAWAT_INAP":
      description = "Visite spesialis";
      break;

    case "KAMAR_BEDAH":
      const surgeryRates: Record<string, number> = {
        SEDANG: 300000,
        BESAR: 450000,
        KHUSUS_1: 650000,
        KHUSUS_2: 950000,
        KHUSUS_3: 1250000,
        KHUSUS_4: 1550000,
        KHUSUS_5: 1850000,
      };
      bruto = surgeryRates[params.category || "SEDANG"] || baseFee;
      description = `Kategori Bedah: ${params.category}`;
      break;

    default:
      description = "Tindakan Medis";
  }

  return { bruto, description };
};

export const calculateMultipleProcedures = (fees: number[]): number => {
  if (fees.length === 0) return 0;
  const sortedFees = [...fees].sort((a, b) => b - a);
  let total = sortedFees[0]; // 100% highest
  if (sortedFees.length > 1) {
    total += sortedFees[1] * 0.5; // 50% second highest
  }
  // others 0%
  return total;
};
