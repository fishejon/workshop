/**
 * Imperial helpers: internal math uses decimal inches;
 * display rounds to the nearest 1/4" by default (hobby-friendly).
 * Shop-facing strings use `formatShopImperial` (nearest 1/16″).
 */

const DEFAULT_DENOM = 4;

/** Denominator for user-visible shop dimensions (parts, print, buy list, joinery summaries). */
export const SHOP_FRACTION_DENOMINATOR = 16;

export function roundToFraction(inches: number, denominator: number = DEFAULT_DENOM): number {
  const step = 1 / denominator;
  return Math.round(inches / step) * step;
}

function gcd(a: number, b: number): number {
  let x = Math.abs(Math.round(a));
  let y = Math.abs(Math.round(b));
  while (y) {
    const t = y;
    y = x % y;
    x = t;
  }
  return x || 1;
}

/**
 * Format decimal inches as a shop-style string, e.g. 36.5 → `36 1/2"`.
 * Rounds to nearest `denominator` (default quarters).
 */
export function formatImperial(inches: number, denominator: number = DEFAULT_DENOM): string {
  const rounded = roundToFraction(inches, denominator);
  const sign = rounded < 0 ? "-" : "";
  const abs = Math.abs(rounded);
  let whole = Math.floor(abs + 1e-9);
  const frac = abs - whole;

  if (Math.abs(frac) < 1e-6) {
    return `${sign}${whole}"`;
  }

  let num = Math.round(frac * denominator);
  if (num === denominator) {
    whole += 1;
    num = 0;
  }
  if (num === 0) {
    return `${sign}${whole}"`;
  }

  const g = gcd(num, denominator);
  const n = num / g;
  const d = denominator / g;
  const fracPart = whole > 0 ? ` ${n}/${d}` : `${n}/${d}`;
  return `${sign}${whole > 0 ? whole : ""}${fracPart}"`;
}

/** Input-friendly imperial string without the trailing quote mark. */
export function formatImperialInput(inches: number, denominator: number = DEFAULT_DENOM): string {
  return formatImperial(inches, denominator).replace(/"$/, "");
}

export function formatShopImperial(inches: number): string {
  return formatImperial(inches, SHOP_FRACTION_DENOMINATOR);
}

export function formatShopImperialInput(inches: number): string {
  return formatImperialInput(inches, SHOP_FRACTION_DENOMINATOR);
}

/**
 * Total lineal demand in feet, shown as whole feet plus remainder in nearest 1/16″ (no board-foot volume).
 */
export function formatLinearFeetShop(linearFeet: number): string {
  if (!Number.isFinite(linearFeet) || linearFeet <= 0) {
    return "0 lineal ft";
  }
  const totalInches = linearFeet * 12;
  const wholeFeet = Math.floor(totalInches / 12 + 1e-9);
  const remainderInches = totalInches - wholeFeet * 12;
  if (remainderInches < 1e-6) {
    return `${wholeFeet} lineal ft`;
  }
  return `${wholeFeet} ft ${formatShopImperial(remainderInches)} lineal`;
}

export function parseInches(input: string): number | null {
  const s = input
    .trim()
    .replace(/\s*(in|inch|inches)\.?$/i, "")
    .replace(/"$/, "")
    .trim();
  if (!s) return null;

  const decimal = Number(s);
  if (!Number.isNaN(decimal) && s.match(/^[-+]?\d*\.?\d+$/)) {
    return decimal;
  }

  const mixed = s.match(/^(-?)(\d+)\s+(\d+)\s*\/\s*(\d+)$/);
  if (mixed) {
    const sign = mixed[1] === "-" ? -1 : 1;
    const whole = Number(mixed[2]);
    const num = Number(mixed[3]);
    const den = Number(mixed[4]);
    if (den === 0) return null;
    return sign * (whole + num / den);
  }

  const fracOnly = s.match(/^(-?)(\d+)\s*\/\s*(\d+)$/);
  if (fracOnly) {
    const sign = fracOnly[1] === "-" ? -1 : 1;
    const num = Number(fracOnly[2]);
    const den = Number(fracOnly[3]);
    if (den === 0) return null;
    return sign * (num / den);
  }

  const wholeOnly = s.match(/^(-?\d+)$/);
  if (wholeOnly) {
    return Number(wholeOnly[1]);
  }

  return null;
}
