/**
 * Imperial helpers: internal math uses decimal inches;
 * display rounds to the nearest 1/4" by default (hobby-friendly).
 */

const DEFAULT_DENOM = 4;

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

export function parseInches(input: string): number | null {
  const s = input.trim();
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
