// Tax Engine for Jaspel Medis (PP 58 Tahun 2023 - Tarif Efektif Rata-rata / TER)

export interface TERTaxRate {
    category: "A" | "B" | "C";
    minBruto: number;
    maxBruto: number;
    rate: number;
}

export const calculateMonthlyTaxTER = (
    bruto: number,
    category: "A" | "B" | "C",
    rates: TERTaxRate[]
): number => {
    const applicableRate = rates.find(
        (r) => r.category === category && bruto >= r.minBruto && bruto <= r.maxBruto
    );

    if (!applicableRate) return 0;
    return bruto * applicableRate.rate;
};

export const calculateAnnualReconciliation = (
    annualBruto: number,
    totalTaxPaidJanNov: number,
    ptkp: number,
    biayaJabatanRate: number = 0.05,
    maxBiayaJabatan: number = 6000000
): number => {
    // 1. Calculate Biaya Jabatan
    const biayaJabatan = Math.min(annualBruto * biayaJabatanRate, maxBiayaJabatan);

    // 2. Net Income
    const netIncome = annualBruto - biayaJabatan;

    // 3. Taxable Income (PKP)
    const pkp = Math.max(0, netIncome - ptkp);

    // 4. Progressive Tax (Pasal 17 UU PPh)
    let annualTax = 0;
    let remainingPKP = pkp;

    const brackets = [
        { limit: 60000000, rate: 0.05 },
        { limit: 250000000, rate: 0.15 },
        { limit: 500000000, rate: 0.25 },
        { limit: 5000000000, rate: 0.30 },
        { limit: Infinity, rate: 0.35 },
    ];

    let prevLimit = 0;
    for (const bracket of brackets) {
        const taxableInBracket = Math.min(remainingPKP, bracket.limit - prevLimit);
        annualTax += taxableInBracket * bracket.rate;
        remainingPKP -= taxableInBracket;
        prevLimit = bracket.limit;
        if (remainingPKP <= 0) break;
    }

    // 5. December Tax = Total Annual Tax - Tax Paid Jan-Nov
    return Math.max(0, annualTax - totalTaxPaidJanNov);
};

export const getPTKPValue = (code: string): number => {
    const ptkpMap: Record<string, number> = {
        "TK/0": 54000000,
        "TK/1": 58500000,
        "TK/2": 63000000,
        "TK/3": 67500000,
        "K/0": 58500000,
        "K/1": 63000000,
        "K/2": 67500000,
        "K/3": 72000000,
    };
    return ptkpMap[code] || 54000000;
};
