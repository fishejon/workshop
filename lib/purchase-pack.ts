/**
 * Shared 1D stick packing (rough length × qty) for purchase scenarios and 2D board estimates.
 *
 * Pipeline (see also `lib/buy-2d/types.ts`): parts → rough cut lengths → stock length choice → FFD boards.
 */

import { packUniformStock, totalWaste, type CutPiece } from "./optimize-cuts";
import type { Part } from "./project-types";
import { roughCutPiecesForPack } from "./rough-sticks";

export type PackMetrics = {
  stockLength: number;
  stickCount: number;
  wasteInches: number;
};

/** Common retail hardwood stick lengths (inches), ascending. */
export const COMMON_STOCK_INCHES: readonly number[] = [
  48, 54, 60, 66, 72, 78, 84, 90, 96, 102, 108, 120, 132, 144,
];

export function candidateRetailStockLengths(maxTransport: number, minCut: number): number[] {
  if (minCut <= 0 || maxTransport <= 0) return [];
  if (minCut > maxTransport + 1e-6) return [];
  const fromCommon = COMMON_STOCK_INCHES.filter((l) => l <= maxTransport + 1e-6 && l >= minCut - 1e-6);
  const set = new Set(fromCommon);
  set.add(maxTransport);
  return Array.from(set).sort((a, b) => a - b);
}

export function tryPackCutPieces(pieces: CutPiece[], stockLength: number, kerf: number): PackMetrics | null {
  if (pieces.length === 0) {
    return { stockLength, stickCount: 0, wasteInches: 0 };
  }
  const maxCut = Math.max(...pieces.map((p) => p.lengthInches));
  if (maxCut > stockLength + 1e-6) return null;
  try {
    const boards = packUniformStock(pieces, stockLength, kerf);
    return {
      stockLength,
      stickCount: boards.length,
      wasteInches: totalWaste(boards),
    };
  } catch {
    return null;
  }
}

export function tryPackGroupParts(groupParts: Part[], stockLength: number, kerf: number): PackMetrics | null {
  const pieces = roughCutPiecesForPack(groupParts);
  return tryPackCutPieces(pieces, stockLength, kerf);
}

export function bestPackCutPieces(
  pieces: CutPiece[],
  maxTransport: number,
  kerf: number,
  mode: "minWaste" | "minBoardCount"
): PackMetrics | null {
  if (pieces.length === 0) {
    return { stockLength: maxTransport, stickCount: 0, wasteInches: 0 };
  }
  const minCut = Math.max(...pieces.map((p) => p.lengthInches));
  const candidates = candidateRetailStockLengths(maxTransport, minCut);
  if (candidates.length === 0) return null;

  let best: PackMetrics | null = null;

  for (const L of candidates) {
    const m = tryPackCutPieces(pieces, L, kerf);
    if (!m) continue;
    if (!best) {
      best = m;
      continue;
    }
    if (mode === "minBoardCount") {
      if (m.stickCount < best.stickCount) best = m;
      else if (m.stickCount === best.stickCount) {
        if (m.wasteInches < best.wasteInches - 1e-6) best = m;
        else if (Math.abs(m.wasteInches - best.wasteInches) <= 1e-6 && m.stockLength > best.stockLength) best = m;
      }
    } else {
      if (m.wasteInches < best.wasteInches - 1e-6) best = m;
      else if (Math.abs(m.wasteInches - best.wasteInches) <= 1e-6) {
        if (m.stickCount < best.stickCount) best = m;
        else if (m.stickCount === best.stickCount && m.stockLength < best.stockLength) best = m;
      }
    }
  }

  return best;
}

export function bestPackGroupParts(
  groupParts: Part[],
  maxTransport: number,
  kerf: number,
  mode: "minWaste" | "minBoardCount"
): PackMetrics | null {
  const pieces = roughCutPiecesForPack(groupParts);
  return bestPackCutPieces(pieces, maxTransport, kerf, mode);
}
