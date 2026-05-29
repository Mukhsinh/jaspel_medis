// Remuneration Engine for Jaspel Medis (P1, P2, P3 Standards)

export interface RemunerationScoreParams {
    p1: {
        education: number;
        position: number;
        competency: number;
        certification: number;
    };
    p2: {
        volume: number;
        productivity: number;
        logbook: number;
    };
    p3: {
        attendance: number;
        discipline: number;
        managerial: number;
        strategic: number;
    };
}

export const calculateDoctorIndex = (params: RemunerationScoreParams): number => {
    const p1Score = Object.values(params.p1).reduce((a, b) => a + b, 0);
    const p2Score = Object.values(params.p2).reduce((a, b) => a + b, 0);
    const p3Score = Object.values(params.p3).reduce((a, b) => a + b, 0);

    return p1Score + p2Score + p3Score;
};

// Configurable weights (Sample representation)
export const scoringWeights = {
    P1: 0.4, // Pay for Position (40%)
    P2: 0.5, // Pay for Performance (50%)
    P3: 0.1, // Pay for Behavior (10%)
};
