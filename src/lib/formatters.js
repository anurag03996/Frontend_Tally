/**
 * Indian currency & number formatting utilities
 */

export function formatIndianCurrency(amount, includeSymbol = true, options = {}) {
  if (amount === undefined || amount === null || isNaN(amount)) return includeSymbol ? "₹0" : "0";
  const num = Number(amount);
  const isNegative = num < 0;
  const absNum = Math.abs(num);

  const hasFractions = absNum % 1 !== 0;
  const maxDecimals = options.decimals !== undefined ? options.decimals : (hasFractions ? 2 : 0);
  const minDecimals = options.minDecimals !== undefined ? options.minDecimals : (options.decimals !== undefined ? options.decimals : 0);

  const formatted = new Intl.NumberFormat("en-IN", {
    maximumFractionDigits: maxDecimals,
    minimumFractionDigits: minDecimals,
  }).format(absNum);

  const prefix = isNegative ? "-" : "";
  const symbol = includeSymbol ? "₹" : "";
  return `${prefix}${symbol}${formatted}`;
}

export function formatCr(amount) {
  return formatIndianCurrency(amount);
}

export function formatLakhs(amount) {
  return formatIndianCurrency(amount);
}

export function formatNumber(val) {
  if (val === undefined || val === null || isNaN(val)) return "0";
  return new Intl.NumberFormat("en-IN").format(Math.round(Number(val)));
}

export function compactMoney(val) {
  return formatIndianCurrency(val);
}
