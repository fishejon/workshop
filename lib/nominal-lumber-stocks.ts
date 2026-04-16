/**
 * US **dimensional lumber** (softwood, S4S / construction “nominal” sizing).
 * `actualWidthInches` is the **dressed face width** — the second number in “N×M” when the board is
 * flat in the rack (e.g. 2×4 → 3½″ wide, not 4″).
 *
 * Thickness is documented for shop copy; procurement math in Grainline uses **width** only for
 * `maxPurchasableBoardWidthInches` / glue-up strip limits.
 */
export type NominalStockWidthChoice = {
  /** Stable id for `<select>` */
  id: string;
  /** e.g. "2×4" */
  nominal: string;
  /** Dressed thickness (in) */
  actualThicknessInches: number;
  /** Dressed face width used as purchasable stock width (in) */
  actualWidthInches: number;
  /** Short note for UI */
  note: string;
};

export const CUSTOM_STOCK_WIDTH_ID = "__custom__";

/**
 * Common furniture / construction sizes. Order: face width ascending, then thickness ascending
 * (so duplicates like 1×4 vs 2×4 sit together in the menu).
 */
export const NOMINAL_STOCK_WIDTH_CHOICES: readonly NominalStockWidthChoice[] = [
  { id: "1x2", nominal: "1×2", actualThicknessInches: 0.75, actualWidthInches: 1.5, note: "¾″ × 1½″" },
  { id: "2x2", nominal: "2×2", actualThicknessInches: 1.5, actualWidthInches: 1.5, note: "1½″ × 1½″" },
  { id: "1x3", nominal: "1×3", actualThicknessInches: 0.75, actualWidthInches: 2.5, note: "¾″ × 2½″" },
  { id: "2x3", nominal: "2×3", actualThicknessInches: 1.5, actualWidthInches: 2.5, note: "1½″ × 2½″" },
  { id: "1x4", nominal: "1×4", actualThicknessInches: 0.75, actualWidthInches: 3.5, note: "¾″ × 3½″" },
  { id: "2x4", nominal: "2×4", actualThicknessInches: 1.5, actualWidthInches: 3.5, note: "1½″ × 3½″" },
  { id: "4x4", nominal: "4×4", actualThicknessInches: 3.5, actualWidthInches: 3.5, note: "3½″ × 3½″" },
  { id: "1x6", nominal: "1×6", actualThicknessInches: 0.75, actualWidthInches: 5.5, note: "¾″ × 5½″" },
  { id: "2x6", nominal: "2×6", actualThicknessInches: 1.5, actualWidthInches: 5.5, note: "1½″ × 5½″" },
  { id: "4x6", nominal: "4×6", actualThicknessInches: 3.5, actualWidthInches: 5.5, note: "3½″ × 5½″" },
  { id: "1x8", nominal: "1×8", actualThicknessInches: 0.75, actualWidthInches: 7.25, note: "¾″ × 7¼″" },
  { id: "2x8", nominal: "2×8", actualThicknessInches: 1.5, actualWidthInches: 7.25, note: "1½″ × 7¼″" },
  { id: "1x10", nominal: "1×10", actualThicknessInches: 0.75, actualWidthInches: 9.25, note: "¾″ × 9¼″" },
  { id: "2x10", nominal: "2×10", actualThicknessInches: 1.5, actualWidthInches: 9.25, note: "1½″ × 9¼″" },
  { id: "1x12", nominal: "1×12", actualThicknessInches: 0.75, actualWidthInches: 11.25, note: "¾″ × 11¼″" },
  { id: "2x12", nominal: "2×12", actualThicknessInches: 1.5, actualWidthInches: 11.25, note: "1½″ × 11¼″" },
] as const;

const WIDTH_TOL = 0.02;

/** When several nominals share the same dressed face width, infer the usual “2×” call for construction lumber. */
function inferenceRank(c: NominalStockWidthChoice): number {
  if (c.id.startsWith("2x")) return 3;
  if (c.id.startsWith("1x")) return 2;
  if (c.id.startsWith("4x")) return 1;
  return 0;
}

export function choiceForActualWidthInches(inches: number): NominalStockWidthChoice | null {
  if (!Number.isFinite(inches) || inches <= 0) return null;
  const matches = NOMINAL_STOCK_WIDTH_CHOICES.filter((c) => Math.abs(c.actualWidthInches - inches) < WIDTH_TOL);
  if (matches.length === 0) return null;
  return matches.reduce((best, c) => {
    const rc = inferenceRank(c);
    const rb = inferenceRank(best);
    if (rc !== rb) return rc > rb ? c : best;
    if (c.actualThicknessInches !== best.actualThicknessInches) {
      return c.actualThicknessInches > best.actualThicknessInches ? c : best;
    }
    return c.id < best.id ? c : best;
  });
}

export function selectValueForWidthInches(inches: number): string {
  return choiceForActualWidthInches(inches)?.id ?? CUSTOM_STOCK_WIDTH_ID;
}

export function choiceById(id: string): NominalStockWidthChoice | undefined {
  return NOMINAL_STOCK_WIDTH_CHOICES.find((c) => c.id === id);
}

export function optionLabel(c: NominalStockWidthChoice): string {
  return `${c.nominal} — ${c.note} (face ${c.actualWidthInches}″ wide)`;
}
