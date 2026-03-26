export const TARIFF_BANDS = {
  PEAK: "Peak",
  NORMAL: "Normal",
  OFF_PEAK: "Off-Peak",
};

export const TARIFF_RATES = {
  [TARIFF_BANDS.PEAK]: 7.8,
  [TARIFF_BANDS.NORMAL]: 6.3,
  [TARIFF_BANDS.OFF_PEAK]: 5.5,
};

export function getTariffBand(hour, isCommercial = false) {
  const value = Number(hour);

  if (value >= 18 && value <= 21) return TARIFF_BANDS.PEAK;
  if ((value >= 15 && value <= 17) || (value >= 22 && value <= 24)) return TARIFF_BANDS.NORMAL;
  if (!isCommercial && value >= 6 && value <= 9) return TARIFF_BANDS.PEAK;
  return TARIFF_BANDS.OFF_PEAK;
}

export function getTariffRate(hour, isCommercial = false) {
  return TARIFF_RATES[getTariffBand(hour, isCommercial)];
}
