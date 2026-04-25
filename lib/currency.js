const DEFAULT_USD_TO_BDT_RATE = 135;

export const toSafeNumber = (value, fallback = 0) => {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : fallback;
};

export const resolveUsdToBdtRate = (value, fallback = DEFAULT_USD_TO_BDT_RATE) =>
  toSafeNumber(value, fallback > 0 ? fallback : DEFAULT_USD_TO_BDT_RATE);

export const convertUsdToBdt = (usdAmount, usdToBdtRate = DEFAULT_USD_TO_BDT_RATE) =>
  toSafeNumber(usdAmount) * resolveUsdToBdtRate(usdToBdtRate);

export const convertBdtToUsd = (bdtAmount, usdToBdtRate = DEFAULT_USD_TO_BDT_RATE) => {
  const rate = resolveUsdToBdtRate(usdToBdtRate);
  return rate > 0 ? toSafeNumber(bdtAmount) / rate : 0;
};

export const formatUsd = (value) => `$${toSafeNumber(value).toFixed(2)}`;

export const formatBdt = (value, options = {}) => {
  const roundedValue =
    options.round === false ? toSafeNumber(value) : Math.round(toSafeNumber(value));

  return `Tk ${roundedValue.toLocaleString("en-BD", {
    maximumFractionDigits: options.round === false ? 2 : 0,
    minimumFractionDigits: options.minimumFractionDigits ?? 0,
  })}`;
};

export { DEFAULT_USD_TO_BDT_RATE };
