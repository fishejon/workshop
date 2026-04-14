import type { CutPiece } from "../optimize-cuts";
import {
  bestPackCutPieces,
  tryPackCutPieces,
  type PackMetrics,
} from "../purchase-pack";
import type { DemandPiece } from "./types";
import { widthRipMultiplier } from "./width-fit";

export type PurchaseScenarioPackMode = "minWaste" | "minBoardCount" | "fitTransport" | "simpleTrip";

/** Expand width-rip lanes × quantity into length cuts for FFD packing. */
export function demandPiecesToCutPieces(demand: DemandPiece[], stockWidthInches: number): CutPiece[] {
  const out: CutPiece[] = [];
  for (const row of demand) {
    const rip = widthRipMultiplier(row.widthInches, stockWidthInches);
    const n = row.quantity * rip;
    for (let i = 0; i < n; i++) {
      out.push({ lengthInches: row.lengthInches });
    }
  }
  return out;
}

export function packDemandForScenario(
  demand: DemandPiece[],
  stockWidthInches: number,
  maxTransportInches: number,
  kerfInches: number,
  scenario: PurchaseScenarioPackMode
): PackMetrics | null {
  const cuts = demandPiecesToCutPieces(demand, stockWidthInches);
  if (scenario === "fitTransport" || scenario === "simpleTrip") {
    return tryPackCutPieces(cuts, maxTransportInches, kerfInches);
  }
  if (scenario === "minWaste") {
    return bestPackCutPieces(cuts, maxTransportInches, kerfInches, "minWaste");
  }
  return bestPackCutPieces(cuts, maxTransportInches, kerfInches, "minBoardCount");
}
