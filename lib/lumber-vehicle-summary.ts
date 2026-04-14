/**
 * Lineal-first lumber summary: total lineal per material group, boards ÷ vehicle length,
 * and 1D kerf pack on max transport length (same stick model as rough layout).
 */

import type { BoardFootGroup } from "./board-feet";
import { materialGroupKey } from "./board-feet";
import type { BoardPlan, CutPiece } from "./optimize-cuts";
import { packUniformStock, totalWaste } from "./optimize-cuts";
import type { Part } from "./project-types";
import { roughCutsFromParts } from "./rough-sticks";

const DEFAULT_PACK_KERF_IN = 0.125;

export type LumberVehicleRow = {
  key: string;
  materialLabel: string;
  thicknessCategory: string;
  /** e.g. "White oak — 4/4" */
  lumberTypeLabel: string;
  adjustedLinearFeet: number;
  /** adjusted LF × 12 */
  totalLinealInches: number;
  vehicleMaxInches: number;
  /** ceil(total lineal inches ÷ vehicle max) — planning boards if every inch came off full-length sticks */
  boardsByVehicleLength: number;
  packedBoards: BoardPlan[] | null;
  packWasteInches: number | null;
  packError: string | null;
};

export function partsInMaterialGroup(parts: Part[], groupKey: string): Part[] {
  return parts.filter(
    (p) => materialGroupKey(p.material.label, p.material.thicknessCategory) === groupKey
  );
}

export function boardsNeededByVehicleLength(totalLinealInches: number, vehicleInches: number): number {
  if (totalLinealInches <= 0) return 0;
  if (!(vehicleInches > 0)) return 0;
  return Math.ceil(totalLinealInches / vehicleInches - 1e-9);
}

function packGroupToBoardPlans(
  groupParts: Part[],
  stockLength: number,
  kerf: number
): { boards: BoardPlan[] | null; error: string | null; waste: number | null } {
  const pieces: CutPiece[] = roughCutsFromParts(groupParts).map((c) => ({
    lengthInches: c.lengthInches,
    label: c.label,
  }));
  if (pieces.length === 0) {
    return { boards: [], error: null, waste: 0 };
  }
  const maxCut = Math.max(...pieces.map((p) => p.lengthInches));
  if (maxCut > stockLength + 1e-6) {
    return {
      boards: null,
      error: `Longest cut (${maxCut.toFixed(3)}″) is longer than vehicle max (${stockLength.toFixed(3)}″).`,
      waste: null,
    };
  }
  try {
    const boards = packUniformStock(pieces, stockLength, kerf);
    return { boards, error: null, waste: totalWaste(boards) };
  } catch (e) {
    return {
      boards: null,
      error: e instanceof Error ? e.message : "Could not pack cuts.",
      waste: null,
    };
  }
}

export function buildLumberVehicleRows(
  groups: BoardFootGroup[],
  allParts: Part[],
  vehicleMaxInches: number,
  kerfInches: number = DEFAULT_PACK_KERF_IN
): LumberVehicleRow[] {
  return groups.map((g) => {
    const groupParts = partsInMaterialGroup(allParts, g.key);
    const totalLinealInches = g.adjustedLinearFeet * 12;
    const boardsByVehicleLength = boardsNeededByVehicleLength(totalLinealInches, vehicleMaxInches);
    const { boards, error, waste } = packGroupToBoardPlans(groupParts, vehicleMaxInches, kerfInches);
    return {
      key: g.key,
      materialLabel: g.materialLabel,
      thicknessCategory: g.thicknessCategory,
      lumberTypeLabel: `${g.materialLabel} — ${g.thicknessCategory}`,
      adjustedLinearFeet: g.adjustedLinearFeet,
      totalLinealInches,
      vehicleMaxInches,
      boardsByVehicleLength,
      packedBoards: boards,
      packWasteInches: waste,
      packError: error,
    };
  });
}
