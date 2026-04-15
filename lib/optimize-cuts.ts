import { roundToFraction } from "./imperial";

export type CutPiece = {
  lengthInches: number;
  label?: string;
  /** Stable id for this rough-length instance; preserved through packing. */
  roughInstanceId?: string;
};

export type BoardPlan = {
  index: number;
  stockLengthInches: number;
  cuts: CutPiece[];
  /** Remaining length after cuts and kerfs (decimal inches). */
  wasteInches: number;
};

/**
 * First-fit decreasing: pack cuts onto boards of uniform stock length.
 * Kerf is applied between cuts on the same board (not after the final cut).
 */
export function packUniformStock(
  pieces: CutPiece[],
  stockLengthInches: number,
  kerfInches: number
): BoardPlan[] {
  if (stockLengthInches <= 0 || kerfInches < 0) {
    return [];
  }

  const expanded: CutPiece[] = [];
  for (const p of pieces) {
    if (p.lengthInches <= 0) continue;
    expanded.push({ ...p });
  }

  expanded.sort((a, b) => {
    if (b.lengthInches !== a.lengthInches) return b.lengthInches - a.lengthInches;
    const ai = a.roughInstanceId ?? "";
    const bi = b.roughInstanceId ?? "";
    return ai.localeCompare(bi);
  });

  type Board = { cuts: CutPiece[]; used: number; needsKerf: boolean };

  const boards: Board[] = [];

  const startBoard = (first: CutPiece): Board => ({
    cuts: [first],
    used: first.lengthInches,
    needsKerf: true,
  });

  const fits = (board: Board, len: number): boolean => {
    const extra = board.needsKerf ? kerfInches : 0;
    return board.used + extra + len <= stockLengthInches + 1e-6;
  };

  const place = (board: Board, len: CutPiece) => {
    const extra = board.needsKerf ? kerfInches : 0;
    board.used += extra + len.lengthInches;
    board.cuts.push(len);
    board.needsKerf = true;
  };

  for (const piece of expanded) {
    if (piece.lengthInches > stockLengthInches + 1e-6) {
      throw new Error(
        `Every cut must be ≤ stock length (${stockLengthInches.toFixed(3)}").`
      );
    }

    let placed = false;
    for (const b of boards) {
      if (fits(b, piece.lengthInches)) {
        place(b, piece);
        placed = true;
        break;
      }
    }
    if (!placed) {
      boards.push(startBoard(piece));
    }
  }

  return boards.map((b, i) => {
    const waste = roundToFraction(Math.max(0, stockLengthInches - b.used), 16);
    return {
      index: i + 1,
      stockLengthInches,
      cuts: b.cuts,
      wasteInches: waste,
    };
  });
}

export function totalWaste(boards: BoardPlan[]): number {
  return boards.reduce((s, b) => s + b.wasteInches, 0);
}
