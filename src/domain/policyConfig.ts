// Demo lending policy. Thresholds match the ones the original demo narrative used.
export const POLICY = {
  dtiAuto: 0.33,
  dtiMax: 0.45,
  scoreAuto: 640,
  scoreMin: 580,
  docQualityMin: 0.7,
  netIncomeFactor: 0.72,
  rates: [
    { minScore: 720, aprPct: 6.9 },
    { minScore: 680, aprPct: 7.9 },
    { minScore: 0, aprPct: 8.9 },
  ],
  counterOfferMin: 5000,
  counterOfferStep: 1000,
} as const;
