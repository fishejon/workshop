/**
 * Purchase scenarios orchestrator.
 * - BF/LF and cost groups come from `board-feet.ts`.
 * - Board-count estimation comes from `buy-2d/*` (width + length constrained model).
 */

import { computeTwoDimensionalBoardEstimate } from "./buy-2d/estimate";
import type { TwoDimensionalBoardEstimate } from "./buy-2d/types";
import type { BoardFootGroup } from "./board-feet";
import { groupPartsByMaterial } from "./board-feet";
import type { Part } from "./project-types";

export type PurchaseScenarioId = "minWaste" | "minBoardCount" | "fitTransport" | "simpleTrip";

export type PurchaseScenarioInput = {
  parts: Part[];
  wasteFactorPercent: number;
  maxTransportLengthInches: number;
  /** Widest single board assumed available at the yard for width-lane estimation. */
  maxPurchasableBoardWidthInches?: number;
  /** Optional rates keyed by materialGroupKey(label, thicknessCategory). */
  costRatesByGroup?: Record<string, { perBoardFoot?: number; perLinearFoot?: number }>;
  /** Table-saw kerf between cuts on the same stick (inches). */
  kerfInches?: number;
  /** Optional per `materialGroupKey` max stock width for 2D rip math (falls back to maxPurchasableBoardWidthInches). */
  stockWidthByMaterialGroup?: Record<string, number>;
};

export type PurchaseScenarioResult = {
  scenario: PurchaseScenarioId;
  /** Short label for selectors. */
  title: string;
  /** Primary engineering summary line for the selected optimization. */
  headline: string;
  /** Supporting engineering detail. */
  detail: string;
  kerfInches: number;
  maxTransportLengthInches: number;
  groupCosts: ScenarioGroupCostSummary[];
  totalEstimatedCost: number;
  /** Effective max board width used in 2D lane expansion (defaults when input omitted). */
  maxPurchasableBoardWidthInches: number;
  /**
   * Parallel width×length estimate: expands panel glue-up strips and width-rip multipliers, then packs lengths.
   * Labeled as an estimate in UI—not a substitute for yard verification.
   */
  twoDimensional: TwoDimensionalBoardEstimate;
};

export type ScenarioGroupCostSummary = {
  key: string;
  materialLabel: string;
  thicknessCategory: string;
  adjustedBoardFeet: number;
  adjustedLinearFeet: number;
  perBoardFoot?: number;
  perLinearFoot?: number;
  boardFootCost: number;
  linearFootCost: number;
  totalCost: number;
};

const DEFAULT_KERF_IN = 0.125;
const DEFAULT_MAX_PURCHASABLE_BOARD_WIDTH_IN = 20;

function effectiveMaxPurchasableBoardWidthInches(input: PurchaseScenarioInput): number {
  const w = input.maxPurchasableBoardWidthInches;
  if (typeof w === "number" && Number.isFinite(w) && w > 0) return w;
  return DEFAULT_MAX_PURCHASABLE_BOARD_WIDTH_IN;
}

export const PURCHASE_SCENARIO_META: Record<
  PurchaseScenarioId,
  { title: string; shortHint: string }
> = {
  minWaste: {
    title: "Objective: min trim waste",
    shortHint: "Optimize stock-length allocation to minimize aggregate end-trim residuals.",
  },
  minBoardCount: {
    title: "Objective: min board count",
    shortHint: "Optimize allocation to minimize total boards under transport and width constraints.",
  },
  fitTransport: {
    title: "Constraint: transport cap",
    shortHint: "Fix stock length at max transport and solve width-lane + length packing.",
  },
  simpleTrip: {
    title: "Baseline: fixed carry length",
    shortHint: "Single carry-length procurement baseline with 2D lane expansion.",
  },
};

function buildResult(
  scenario: PurchaseScenarioId,
  input: PurchaseScenarioInput
): PurchaseScenarioResult {
  const kerf = input.kerfInches ?? DEFAULT_KERF_IN;
  const maxTransport = input.maxTransportLengthInches;
  const maxPurchasableBoardWidthInches = effectiveMaxPurchasableBoardWidthInches(input);
  const groups = groupPartsByMaterial(input.parts, input.wasteFactorPercent);
  const groupCosts = summarizeGroupCosts(groups, input.costRatesByGroup);
  const totalCost = groupCosts.reduce((sum, row) => sum + row.totalCost, 0);

  const scenarioHeadline =
    scenario === "minWaste"
      ? `Objective function: minimize end-trim waste under transport-length and stock-width constraints (kerf ${kerf}″ in length packing stage).`
      : scenario === "minBoardCount"
        ? `Objective function: minimize board count with stock length ≤ ${maxTransport.toFixed(0)}″ and configured stock-width assumptions.`
        : scenario === "fitTransport"
          ? `Constraint set: enforce fixed stock length at transport cap (${maxTransport.toFixed(0)}″) and solve width-lane expansion + length packing.`
          : `Baseline mode: fixed carry-length procurement model (${maxTransport.toFixed(0)}″) with deterministic 2D lane expansion.`;

  const twoDimensional = computeTwoDimensionalBoardEstimate({
    parts: input.parts,
    wasteFactorPercent: input.wasteFactorPercent,
    maxTransportLengthInches: maxTransport,
    maxPurchasableBoardWidthInches,
    stockWidthByMaterialGroup: input.stockWidthByMaterialGroup,
    kerfInches: kerf,
    scenario,
  });
  const detail =
    twoDimensional.groups.length === 0
      ? "No demand rows available; add parts with valid rough dimensions."
      : `${twoDimensional.detail} Total estimated boards: ~${twoDimensional.totalEstimatedBoards2d}.`;

  return {
    scenario,
    title: PURCHASE_SCENARIO_META[scenario].title,
    headline: scenarioHeadline,
    detail,
    kerfInches: kerf,
    maxTransportLengthInches: maxTransport,
    groupCosts,
    totalEstimatedCost: totalCost,
    maxPurchasableBoardWidthInches,
    twoDimensional,
  };
}

function normalizeRate(v: number | undefined): number | undefined {
  if (typeof v !== "number" || !Number.isFinite(v) || v < 0) return undefined;
  return v;
}

function summarizeGroupCosts(
  groups: BoardFootGroup[],
  ratesByGroup: PurchaseScenarioInput["costRatesByGroup"]
): ScenarioGroupCostSummary[] {
  return groups.map((g) => {
    const rate = ratesByGroup?.[g.key];
    const perBoardFoot = normalizeRate(rate?.perBoardFoot);
    const perLinearFoot = normalizeRate(rate?.perLinearFoot);
    const boardFootCost = g.adjustedBoardFeet * (perBoardFoot ?? 0);
    const linearFootCost = g.adjustedLinearFeet * (perLinearFoot ?? 0);
    return {
      key: g.key,
      materialLabel: g.materialLabel,
      thicknessCategory: g.thicknessCategory,
      adjustedBoardFeet: g.adjustedBoardFeet,
      adjustedLinearFeet: g.adjustedLinearFeet,
      perBoardFoot,
      perLinearFoot,
      boardFootCost,
      linearFootCost,
      totalCost: boardFootCost + linearFootCost,
    };
  });
}

/**
 * Evaluate one scenario. Packing is per material/thickness group using rough L × quantity.
 */
export function evaluatePurchaseScenario(
  scenario: PurchaseScenarioId,
  input: PurchaseScenarioInput
): PurchaseScenarioResult {
  return buildResult(scenario, input);
}

export function evaluateAllPurchaseScenarios(input: PurchaseScenarioInput): PurchaseScenarioResult[] {
  const ids: PurchaseScenarioId[] = ["minWaste", "minBoardCount", "fitTransport", "simpleTrip"];
  return ids.map((id) => evaluatePurchaseScenario(id, input));
}
