/**
 * Dresser case + drawer opening / box sizing for shop use.
 * Verify all numbers against your slide manufacturer’s worksheet — defaults are rules-of-thumb.
 */

export type DresserColumnCount = 1 | 2 | 3;

/** Sum of opening heights + (rowCount−1)× rail must equal drawer zone within tolerance. */
export const OPENING_HEIGHT_SUM_TOLERANCE_IN = 1 / 32;

export type DresserEngineInput = {
  outerWidth: number;
  outerHeight: number;
  outerDepth: number;
  materialThickness: number;
  columnCount: DresserColumnCount;
  rowCount: number;
  /** Clear height of each drawer opening, bottom to top, in inches (same for every column). */
  rowOpeningHeightsInches: number[];
  /** Optional toe kick; use 0 if the case sits on legs/feet with no recessed plinth. */
  kickHeight: number;
  /** From case top down to top of uppermost drawer opening (top panel + subtop + gap). */
  topAssemblyHeight: number;
  bottomPanelThickness: number;
  /** Horizontal frame member between stacked drawer openings. */
  railBetweenDrawers: number;
  backThickness: number;
  /** Space behind drawer box (blow-by, wiring, etc.). */
  rearClearanceForBox: number;
  /** Nominal slide length you’re buying (e.g. 22). Box depth is min(this, available). */
  slideLengthNominal: number;
  /** Total width subtracted from opening → drawer box width (typ. ~1/2" pair side-mount). */
  slideWidthClearance: number;
  /** Total height subtracted from opening → drawer box height. */
  slideHeightClearance: number;
};

export type DrawerCellResult = {
  columnIndex: number;
  rowIndex: number;
  label: string;
  openingWidth: number;
  openingHeight: number;
  boxWidth: number;
  boxHeight: number;
  boxDepth: number;
};

export type DresserEngineResult = {
  ok: true;
  columnInnerWidth: number;
  drawerZoneHeight: number;
  openingHeights: number[];
  cells: DrawerCellResult[];
  depthAvailableForBox: number;
};

export type DresserEngineError = { ok: false; message: string };

function sum(a: number[]): number {
  return a.reduce((s, x) => s + x, 0);
}

/** Vertical inches available for drawer openings after rails (each opening height you type must sum to this). */
export function budgetForRowOpeningHeights(input: {
  outerHeight: number;
  kickHeight: number;
  topAssemblyHeight: number;
  bottomPanelThickness: number;
  rowCount: number;
  railBetweenDrawers: number;
}): number | null {
  const drawerZone =
    input.outerHeight -
    input.kickHeight -
    input.bottomPanelThickness -
    input.topAssemblyHeight;
  if (drawerZone <= 0) return null;
  const railTotal = Math.max(0, input.rowCount - 1) * input.railBetweenDrawers;
  const openings = drawerZone - railTotal;
  return openings > 0 ? openings : null;
}

export function computeDresser(input: DresserEngineInput): DresserEngineResult | DresserEngineError {
  const t = input.materialThickness;
  if (input.outerWidth <= 0 || input.outerHeight <= 0 || input.outerDepth <= 0) {
    return { ok: false, message: "Overall width, height, and depth must be positive." };
  }
  if (t <= 0) return { ok: false, message: "Material thickness must be positive." };
  if (input.rowCount < 1) return { ok: false, message: "Need at least one drawer row." };
  if (input.rowOpeningHeightsInches.length !== input.rowCount) {
    return { ok: false, message: "Enter one opening height per row (inches)." };
  }

  const innerW = input.outerWidth - 2 * t;
  if (innerW <= 0) return { ok: false, message: "Sides consume the full width—increase width or reduce thickness." };

  const dividers = input.columnCount - 1;
  const columnInner = (innerW - dividers * t) / input.columnCount;
  if (columnInner <= 0) {
    return { ok: false, message: "Columns are too narrow—fewer columns, wider case, or thinner stock." };
  }

  const drawerZone =
    input.outerHeight -
    input.kickHeight -
    input.bottomPanelThickness -
    input.topAssemblyHeight;

  if (drawerZone <= 0) {
    return {
      ok: false,
      message:
        "No vertical room for drawers—lower top assembly / bottom, shorten kick, or increase overall height.",
    };
  }

  const railTotal = Math.max(0, input.rowCount - 1) * input.railBetweenDrawers;
  const requiredOpeningSum = drawerZone - railTotal;
  if (requiredOpeningSum <= 0) {
    return { ok: false, message: "Rails consume the drawer zone—fewer rows, thinner rails, or taller case." };
  }

  for (let i = 0; i < input.rowOpeningHeightsInches.length; i++) {
    const h = input.rowOpeningHeightsInches[i];
    if (!Number.isFinite(h) || h <= 0) {
      return { ok: false, message: `Row ${i + 1} opening height must be a positive length (inches).` };
    }
  }

  const actualSum = sum(input.rowOpeningHeightsInches);
  if (Math.abs(actualSum - requiredOpeningSum) > OPENING_HEIGHT_SUM_TOLERANCE_IN) {
    const diff = actualSum - requiredOpeningSum;
    const dir = diff > 0 ? "over" : "short";
    return {
      ok: false,
      message: `Row opening heights must add up to ${requiredOpeningSum.toFixed(3)}" (drawer zone ${drawerZone.toFixed(3)}" minus ${input.rowCount - 1} rail(s) at ${input.railBetweenDrawers.toFixed(3)}"). You’re ${Math.abs(diff).toFixed(3)}" ${dir}.`,
    };
  }

  const openingHeights = [...input.rowOpeningHeightsInches];

  const depthAvail = input.outerDepth - input.backThickness - input.rearClearanceForBox;
  if (depthAvail <= 0) {
    return { ok: false, message: "Depth is too shallow for a drawer box after back and clearance." };
  }

  const boxDepth = Math.min(input.slideLengthNominal, depthAvail);

  const cells: DrawerCellResult[] = [];
  for (let c = 0; c < input.columnCount; c++) {
    for (let r = 0; r < input.rowCount; r++) {
      const ow = columnInner;
      const oh = openingHeights[r] ?? 0;
      const bw = Math.max(0, ow - input.slideWidthClearance);
      const bh = Math.max(0, oh - input.slideHeightClearance);
      cells.push({
        columnIndex: c,
        rowIndex: r,
        label: `Col ${c + 1} · Row ${r + 1}`,
        openingWidth: ow,
        openingHeight: oh,
        boxWidth: bw,
        boxHeight: bh,
        boxDepth: boxDepth,
      });
    }
  }

  return {
    ok: true,
    columnInnerWidth: columnInner,
    drawerZoneHeight: drawerZone,
    openingHeights,
    cells,
    depthAvailableForBox: depthAvail,
  };
}

/** Overall case height from fixed bands + rails + known opening heights. */
export function outerHeightFromRowOpenings(
  base: Pick<
    DresserEngineInput,
    "kickHeight" | "bottomPanelThickness" | "topAssemblyHeight" | "railBetweenDrawers" | "rowCount"
  >,
  rowOpeningHeightsInches: number[]
): number {
  const railTotal = Math.max(0, base.rowCount - 1) * base.railBetweenDrawers;
  const openings = sum(rowOpeningHeightsInches);
  return base.kickHeight + base.bottomPanelThickness + base.topAssemblyHeight + railTotal + openings;
}
