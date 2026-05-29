// Pooling Engine for Jaspel Medis
// Core Formula: Medical Pool Allocation = 17% × (Klaim INACBGs - Komponen Jasa Sarana)

export interface PoolingSummary {
    totalNetRevenue: number;
    medicalPool: number;
    conversionFactor: number;
}

export const calculateMedicalPool = (
    claims: { claimValue: number; saranaComponent: number }[]
): number => {
    return claims.reduce((acc, claim) => {
        const net = claim.claimValue - claim.saranaComponent;
        return acc + (net * 0.17);
    }, 0);
};

export const calculateConversionFactor = (
    totalMedicalPool: number,
    totalMedicalIndex: number
): number => {
    if (totalMedicalIndex === 0) return 0;
    if (totalMedicalIndex > totalMedicalPool) {
        return totalMedicalPool / totalMedicalIndex;
    }
    return 1.0; // Conversion factor is 1 if index is below pool (surplus scenario)
};

export const calculateIndividualBruto = (
    individualIndex: number,
    conversionFactor: number
): number => {
    return individualIndex * conversionFactor;
};
