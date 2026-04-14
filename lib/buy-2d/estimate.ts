import type { BoardFootGroup } from "../board-feet";
import { groupPartsByMaterial, materialGroupKey } from "../board-feet";
import {
  bestPackGroupParts,
  tryPackGroupParts,
  type PackMetrics,
} from "../purchase-pack";
import type { Part } from "../project-types";
import { demandPiecesForParts } from "./demand";
import { packDemandForScenario, type PurchaseScenarioPackMode } from "./pack-boards-v1";
import type { TwoDimensionalBoardEstimate, TwoDimensionalGroupEstimate } from "./types";

const DEFAULT_MAX_WIDTH = 20;

export type TwoDimensionalEstimateInput = {
  parts: Part[];
  wasteFactorPercent: number;
  maxTransportLengthInches: number;
  maxPurchasableBoardWidthInches?: number;
  /** Optional per `materialGroupKey` stock width (in) for rip math. */
  stockWidthByMaterialGroup?: Record<string, number>;
  kerfInches: number;
  scenario: PurchaseScenarioPackMode;
};

function effectiveProjectMaxWidth(w: number | undefined): number {
  if (typeof w === "number" && Number.isFinite(w) && w > 0) return w;
  return DEFAULT_MAX_WIDTH;
}

function stockWidthForGroup(
  key: string,
  projectMax: number,
  overrides: Record<string, number> | undefined
): number {
  const o = overrides?.[key];
  if (typeof o === "number" && Number.isFinite(o) && o > 0) return o;
  return projectMax;
}

function partsInGroup(parts: Part[], g: BoardFootGroup): Part[] {
  return parts.filter((p) => materialGroupKey(p.material.label, p.material.thicknessCategory) === g.key);
}

function pack1dForScenario(
  groupParts: Part[],
  scenario: PurchaseScenarioPackMode,
  maxTransport: number,
  kerf: number
): PackMetrics | null {
  if (scenario === "fitTransport" || scenario === "simpleTrip") {
    return tryPackGroupParts(groupParts, maxTransport, kerf);
  }
  if (scenario === "minWaste") {
    return bestPackGroupParts(groupParts, maxTransport, kerf, "minWaste");
  }
  return bestPackGroupParts(groupParts, maxTransport, kerf, "minBoardCount");
}

/**
 * Width×length board estimate for the same scenario as the active 1D purchase plan.
 */
export function computeTwoDimensionalBoardEstimate(input: TwoDimensionalEstimateInput): TwoDimensionalBoardEstimate {
  const projectMax = effectiveProjectMaxWidth(input.maxPurchasableBoardWidthInches);
  const glueMax = projectMax;
  const kerf = input.kerfInches;
  const maxTransport = input.maxTransportLengthInches;
  const overrides = input.stockWidthByMaterialGroup ?? {};
  const groups = groupPartsByMaterial(input.parts, input.wasteFactorPercent);

  const groupEstimates: TwoDimensionalGroupEstimate[] = [];
  let total2d = 0;

  for (const g of groups) {
    const gp = partsInGroup(input.parts, g);
    const stockW = stockWidthForGroup(g.key, projectMax, overrides);
    const demand = demandPiecesForParts(gp, glueMax);
    const pack2d = packDemandForScenario(demand, stockW, maxTransport, kerf, input.scenario);
    const pack1d = pack1dForScenario(gp, input.scenario, maxTransport, kerf);

    const flags: string[] = [];
    if (demand.some((row) => row.widthInches > stockW + 1e-6)) {
      flags.push(
        `One or more cuts are wider than this group’s ${stockW.toFixed(1)}″ stock assumption—expect multiple width rips or wider lumber.`
      );
    }

    const sticks1d = pack1d?.stickCount ?? 0;
    const boards2d = pack2d?.stickCount ?? 0;
    total2d += boards2d;

    const detail =
      sticks1d === boards2d
        ? `Matches length-only stick count (${boards2d}) for this group.`
        : `Length-only plan: ${sticks1d} stick(s); 2D model (panels as strips + width rips): ~${boards2d} board(s).`;

    groupEstimates.push({
      key: g.key,
      materialLabel: g.materialLabel,
      thicknessCategory: g.thicknessCategory,
      stockWidthAssumedInches: stockW,
      estimatedBoards2d: boards2d,
      estimatedSticks1d: sticks1d,
      recommendedStockLengthInches: pack2d?.stockLength ?? pack1d?.stockLength ?? maxTransport,
      flags: Array.from(new Set(flags)),
      detail,
    });
  }

  const assumptions = [
    `Stock width for rips defaults to ${projectMax.toFixed(1)}″ (Setup) unless a group override is set.`,
    "Panels are split into glue-up strips for counting; BF/LF above still use each part’s rough volume.",
    "No cross-board nesting, defect allowance, or sheet-good layout—verify at the yard.",
  ];

  const headline =
    groupEstimates.length === 0
      ? "Add parts for a 2D board estimate."
      : `2D estimate: about ${total2d} board${total2d === 1 ? "" : "s"} (width rips + panel strips + length packing)—not a final tally.`;

  const detail =
    groupEstimates.length === 0
      ? ""
      : "Compare “length-only sticks” in the purchase plan above; larger gaps mean glue-ups or wide rips dominate.";

  return {
    headline,
    detail,
    groups: groupEstimates,
    totalEstimatedBoards2d: total2d,
    assumptions,
  };
}
