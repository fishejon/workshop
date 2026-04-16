/**
 * Map project "max usable / purchasable face width" + thickness category to a **yard-style** nominal
 * (1×8, 2×6, …) for shopping copy. Uses dressed widths from `NOMINAL_STOCK_WIDTH_CHOICES` with a small
 * slack so 7¼″ rack 1×8 still reads as the right call when the planner holds ~7½″ of face.
 */

import type { NominalStockWidthChoice } from "./nominal-lumber-stocks";
import { NOMINAL_STOCK_WIDTH_CHOICES } from "./nominal-lumber-stocks";

/** ~½″: bridges nominal vs dressed rounding for rack callouts (e.g. 7½″ intent → 1×8). */
const WIDTH_PURCHASE_SLACK_IN = 0.5;

function targetDressedThicknessInches(thicknessCategory: string): number {
  const t = thicknessCategory.toLowerCase();
  if (/\b8\/4\b|\btwo\s*inch\b|\b2\s*["″]\s*thick\b/.test(t)) return 1.5;
  if (/\b6\/4\b/.test(t)) return 1.25;
  if (/\b5\/4\b/.test(t)) return 1.125;
  return 0.75;
}

function nominalCatalogWidthInches(c: NominalStockWidthChoice): number {
  const m = /^[124]x(\d+)$/.exec(c.id);
  if (m) return Number(m[1]);
  return Math.ceil(c.actualWidthInches);
}

/**
 * Smallest nominal (matching thickness family) that reasonably covers `purchasableFaceWidthInches`.
 */
export function nominalBoardForPurchasableFaceWidth(
  purchasableFaceWidthInches: number,
  thicknessCategory: string
): NominalStockWidthChoice | null {
  if (!Number.isFinite(purchasableFaceWidthInches) || purchasableFaceWidthInches <= 0) return null;

  const targetT = targetDressedThicknessInches(thicknessCategory);
  const T_TOL = 0.06;
  const byThickness = NOMINAL_STOCK_WIDTH_CHOICES.filter(
    (c) => Math.abs(c.actualThicknessInches - targetT) < T_TOL
  );
  const pool = byThickness.length > 0 ? byThickness : [...NOMINAL_STOCK_WIDTH_CHOICES];

  const withSlack = pool.filter(
    (c) => c.actualWidthInches + WIDTH_PURCHASE_SLACK_IN >= purchasableFaceWidthInches - 1e-9
  );
  if (withSlack.length > 0) {
    return withSlack.reduce((a, b) => (a.actualWidthInches <= b.actualWidthInches ? a : b));
  }

  const strict = pool.filter((c) => c.actualWidthInches + 1e-9 >= purchasableFaceWidthInches);
  if (strict.length > 0) {
    return strict.reduce((a, b) => (a.actualWidthInches <= b.actualWidthInches ? a : b));
  }

  const needNom = Math.ceil(purchasableFaceWidthInches - 1e-9);
  const byNom = pool.filter((c) => nominalCatalogWidthInches(c) >= needNom);
  if (byNom.length > 0) {
    return byNom.reduce((a, b) =>
      nominalCatalogWidthInches(a) !== nominalCatalogWidthInches(b)
        ? nominalCatalogWidthInches(a) < nominalCatalogWidthInches(b)
          ? a
          : b
        : a.actualWidthInches <= b.actualWidthInches
          ? a
          : b
    );
  }

  return pool.reduce((a, b) => (a.actualWidthInches > b.actualWidthInches ? a : b));
}

export function formatYardLumberLine(
  nominal: NominalStockWidthChoice | null,
  materialLabel: string,
  thicknessCategory: string
): string {
  const mat = materialLabel.trim();
  const tc = thicknessCategory.trim();
  if (!mat) return tc || "Lumber";
  if (nominal) {
    return `${nominal.nominal} ${mat} — ${tc} (${nominal.note})`;
  }
  return `${mat} — ${tc}`;
}
