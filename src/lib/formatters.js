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

export function formatCompactINR(amount, includeSymbol = true) {
  if (amount === undefined || amount === null || isNaN(amount)) return includeSymbol ? "₹0" : "0";
  const num = Number(amount);
  const isNegative = num < 0;
  const abs = Math.abs(num);
  const prefix = isNegative ? "-" : "";
  const symbol = includeSymbol ? "₹" : "";

  if (abs === 0) return `${symbol}0`;

  if (abs >= 10000000) {
    const val = abs / 10000000;
    const formatted = val % 1 === 0 ? `${val.toFixed(1)} Cr` : (val < 10 ? `${val.toFixed(2)} Cr` : `${val.toFixed(1)} Cr`);
    return `${prefix}${symbol}${formatted}`;
  }
  if (abs >= 100000) {
    const val = abs / 100000;
    const formatted = val % 1 === 0 ? `${val.toFixed(0)} L` : `${val.toFixed(1)} L`;
    return `${prefix}${symbol}${formatted}`;
  }
  if (abs >= 1000) {
    const val = abs / 1000;
    return `${prefix}${symbol}${val.toFixed(1)} K`;
  }
  return `${prefix}${symbol}${abs.toLocaleString("en-IN")}`;
}

export function compactMoney(val) {
  return formatCompactINR(val);
}

export function amountToIndianWords(num) {
  if (num === undefined || num === null || isNaN(num) || Number(num) === 0) {
    return "Zero Rupees Only";
  }

  const n = Math.abs(Number(num));
  const integerPart = Math.floor(n);
  const decimalPart = Math.round((n - integerPart) * 100);

  const units = [
    "", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine",
    "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen",
    "Seventeen", "Eighteen", "Nineteen",
  ];
  const tens = [
    "", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety",
  ];

  function convertTwoDigits(val) {
    if (val === 0) return "";
    if (val < 20) return units[val];
    const t = Math.floor(val / 10);
    const u = val % 10;
    return `${tens[t]}${u > 0 ? " " + units[u] : ""}`;
  }

  function convertThreeDigits(val) {
    const h = Math.floor(val / 100);
    const rest = val % 100;
    let str = "";
    if (h > 0) {
      str += `${units[h]} Hundred`;
      if (rest > 0) str += " ";
    }
    if (rest > 0) {
      str += convertTwoDigits(rest);
    }
    return str;
  }

  let remaining = integerPart;
  const crores = Math.floor(remaining / 10000000);
  remaining %= 10000000;
  const lakhs = Math.floor(remaining / 100000);
  remaining %= 100000;
  const thousands = Math.floor(remaining / 1000);
  remaining %= 1000;
  const hundreds = remaining;

  const parts = [];
  if (crores > 0) {
    parts.push(`${convertTwoDigits(crores)} Crore`);
  }
  if (lakhs > 0) {
    parts.push(`${convertTwoDigits(lakhs)} Lakh`);
  }
  if (thousands > 0) {
    parts.push(`${convertTwoDigits(thousands)} Thousand`);
  }
  if (hundreds > 0) {
    parts.push(convertThreeDigits(hundreds));
  }

  let words = `Rupees ${parts.join(" ")}`.trim();
  if (decimalPart > 0) {
    words += ` and ${convertTwoDigits(decimalPart)} Paise`;
  }
  words += " Only";
  return words;
}


