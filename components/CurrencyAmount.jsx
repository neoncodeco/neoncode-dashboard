"use client";

import { convertUsdToBdt, formatBdt, formatUsd, resolveUsdToBdtRate, toSafeNumber } from "@/lib/currency";

export default function CurrencyAmount({
  value,
  usdToBdtRate,
  primaryClassName = "",
  secondaryClassName = "",
  showSecondary = true,
  secondaryPrefix = "≈ ",
  secondaryLabel,
  asRate = false,
}) {
  const numericValue = toSafeNumber(value);
  const rate = resolveUsdToBdtRate(usdToBdtRate);
  const primaryText = asRate ? formatBdt(rate, { round: false, minimumFractionDigits: 2 }) : formatUsd(numericValue);
  const secondaryText = secondaryLabel || (asRate ? "$1.00" : `${secondaryPrefix}${formatBdt(convertUsdToBdt(numericValue, rate))}`);

  return (
    <div>
      <p className={primaryClassName}>{primaryText}</p>
      {showSecondary ? <p className={secondaryClassName}>{secondaryText}</p> : null}
    </div>
  );
}
