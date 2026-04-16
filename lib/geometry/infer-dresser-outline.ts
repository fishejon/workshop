import type { Part } from "@/lib/project-types";
import type { CaseOutlineV0 } from "@/lib/geometry/types";

const DRAWER_BOX_RE = /^Drawer box \(Col (\d+) · Row (\d+)\)$/;

const STACK_ROW_RE = /(\d+)\s+drawer row/;
const STACK_RAIL_RE = /at\s+([\d.]+)"/;

function isCaseSideName(name: string): boolean {
  return name === "Case side (left)" || name === "Case side (right)" || name === "Case side";
}

function findCaseTop(parts: Part[]): Part | undefined {
  return parts.find((p) => p.assembly === "Case" && p.name === "Case top");
}

function findCaseSide(parts: Part[]): Part | undefined {
  const left = parts.find((p) => p.assembly === "Case" && p.name === "Case side (left)");
  if (left) return left;
  const right = parts.find((p) => p.assembly === "Case" && p.name === "Case side (right)");
  if (right) return right;
  return parts.find((p) => p.assembly === "Case" && p.name === "Case side");
}

function findCaseBottom(parts: Part[]): Part | undefined {
  return parts.find((p) => p.assembly === "Case" && p.name === "Case bottom");
}

function findCaseBack(parts: Part[]): Part | undefined {
  return parts.find((p) => p.assembly === "Back" && p.name === "Case back");
}

function findToeKick(parts: Part[]): Part | undefined {
  return parts.find((p) => p.name === "Toe kick front");
}

function dividerCount(parts: Part[]): number {
  return parts.filter((p) => p.assembly === "Case" && p.name.startsWith("Case divider")).length;
}

/** Stack note appears on generated dresser carcass parts' grain notes. */
function parseStackFromAllParts(parts: Part[]): { rowCount: number; rail: number } | null {
  for (const p of parts) {
    const note = p.grainNote ?? "";
    const rowM = note.match(STACK_ROW_RE);
    if (!rowM) continue;
    const rowCount = Number.parseInt(rowM[1], 10);
    const railM = note.match(STACK_RAIL_RE);
    const rail = railM ? Number.parseFloat(railM[1]) : 0;
    if (!Number.isFinite(rowCount) || rowCount < 1) continue;
    return { rowCount, rail: Number.isFinite(rail) && rail >= 0 ? rail : 0 };
  }
  return null;
}

function drawerColumnRowMax(parts: Part[]): { maxCol: number; maxRow: number } | null {
  let maxCol = 0;
  let maxRow = 0;
  for (const p of parts) {
    if (p.assembly !== "Drawers") continue;
    const m = p.name.match(DRAWER_BOX_RE);
    if (!m) continue;
    const col = Number.parseInt(m[1], 10);
    const row = Number.parseInt(m[2], 10);
    if (Number.isFinite(col)) maxCol = Math.max(maxCol, col);
    if (Number.isFinite(row)) maxRow = Math.max(maxRow, row);
  }
  if (maxCol === 0 && maxRow === 0) return null;
  return { maxCol, maxRow };
}

function clampColumnCount(n: number): 1 | 2 | 3 {
  if (n >= 3) return 3;
  if (n === 2) return 2;
  return 1;
}

/**
 * Infer dresser schematic inputs from dresser-shaped parts (live cut list).
 * Returns null when the project does not look like a dresser carcass or math is inconsistent.
 */
export function inferDresserCaseOutlineFromParts(parts: Part[]): CaseOutlineV0 | null {
  const top = findCaseTop(parts);
  const side = findCaseSide(parts);
  if (!top || !side || !isCaseSideName(side.name)) return null;

  // Convention: `finished.l` is the board-length / grain axis.
  // For the dresser top that means outer width runs along `l`, and outer depth is `w`.
  const outerW = top.finished.l;
  const outerD = top.finished.w;
  const outerH = side.finished.l;
  const materialT = side.finished.t;

  if (![outerW, outerD, outerH, materialT].every((x) => Number.isFinite(x) && x > 0)) return null;

  if (Math.abs(side.finished.w - outerD) > 0.05 * Math.max(outerD, 1)) return null;

  const back = findCaseBack(parts);
  if (!back) return null;
  // Back is a panel with `l` along outer width; its height (drawer zone) is `w`.
  const drawerZone = back.finished.w;
  if (!Number.isFinite(drawerZone) || drawerZone <= 0) return null;

  const bottom = findCaseBottom(parts);
  const kickPart = findToeKick(parts);
  const kickH = kickPart ? kickPart.finished.w : 0;
  const bottomBand = bottom ? bottom.finished.t : 0;

  const divs = dividerCount(parts);
  const drawerMax = drawerColumnRowMax(parts);
  const stack = parseStackFromAllParts(parts);

  let columnCount = clampColumnCount(divs > 0 ? divs + 1 : drawerMax ? drawerMax.maxCol : 2);
  if (drawerMax && drawerMax.maxCol > 0) {
    columnCount = clampColumnCount(Math.max(columnCount, drawerMax.maxCol));
  }

  const rowCount = drawerMax?.maxRow ?? stack?.rowCount ?? null;
  if (rowCount === null || rowCount < 1) return null;

  const rail = stack?.rail ?? 0;

  const topBand = Math.max(0, outerH - kickH - bottomBand - drawerZone);
  const openingBudget = drawerZone - Math.max(0, rowCount - 1) * rail;
  if (!Number.isFinite(openingBudget) || openingBudget <= 0) return null;

  const each = openingBudget / rowCount;
  const rowOpeningHeightsInches = Array.from({ length: rowCount }, () => each);

  const outline: CaseOutlineV0 = {
    version: 0,
    source: "dresser-parts-inferred",
    outerW,
    outerH,
    outerD,
    columnCount,
    rowCount,
    rowOpeningHeightsInches,
    kickH: Number.isFinite(kickH) && kickH >= 0 ? kickH : 0,
    topBand,
    bottomBand: Number.isFinite(bottomBand) ? bottomBand : 0,
    rail: Number.isFinite(rail) && rail >= 0 ? rail : 0,
    materialT,
  };

  return outline;
}
