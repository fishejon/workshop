/**
 * Heuristic purchase plans: 1D stick packing (rough L × qty) per material group.
 * BF/LF totals stay in board-feet.ts; scenarios add stock-length / stick-count guidance.
 */

import { computeTwoDimensionalBoardEstimate } from "./buy-2d/estimate";
import type { TwoDimensionalBoardEstimate } from "./buy-2d/types";
import type { BoardFootGroup } from "./board-feet";
import { groupPartsByMaterial, materialGroupKey } from "./board-feet";
import {
  bestPackGroupParts,
  tryPackGroupParts,
  type PackMetrics,
} from "./purchase-pack";
import type { Part } from "./project-types";
import { roughCutsFromParts } from "./rough-sticks";

export type PurchaseScenarioId = "minWaste" | "minBoardCount" | "fitTransport" | "simpleTrip";

export type PurchaseScenarioInput = {
  parts: Part[];
  wasteFactorPercent: number;
  maxTransportLengthInches: number;
  /**
   * Widest single board assumed available at the yard. Used only for width-direction caveats;
   * stick packing remains 1D on rough length.
   */
  maxPurchasableBoardWidthInches?: number;
  /** Optional rates keyed by materialGroupKey(label, thicknessCategory). */
  costRatesByGroup?: Record<string, { perBoardFoot?: number; perLinearFoot?: number }>;
  /** Table-saw kerf between cuts on the same stick (inches). */
  kerfInches?: number;
  /** Optional per `materialGroupKey` max stock width for 2D rip math (falls back to maxPurchasableBoardWidthInches). */
  stockWidthByMaterialGroup?: Record<string, number>;
};

export type MaterialGroupScenarioSummary = {
  key: string;
  materialLabel: string;
  thicknessCategory: string;
  /** Suggested nominal stick length to buy (inches). */
  recommendedStockLengthInches: number;
  estimatedStickCount: number;
  /** Sum of end waste across packed sticks (inches). */
  estimatedWasteInches: number;
  /** Longest single rough L in this group. */
  maxCutLengthInches: number;
  /** True when the longest cut exceeds max transport — cannot fit on a single carry-length board. */
  exceedsTransport: boolean;
  /**
   * True when some part in this group spans wider than `maxPurchasableBoardWidthInches` (see
   * `partWidthInchesForPurchaseCaveat` — panels use finished W, other statuses use rough W).
   */
  exceedsPurchasableBoardWidth: boolean;
};

export type PurchaseScenarioResult = {
  scenario: PurchaseScenarioId;
  /** Short label for selectors. */
  title: string;
  /** One line for UI. */
  headline: string;
  /** Supporting detail (still compact). */
  detail: string;
  kerfInches: number;
  maxTransportLengthInches: number;
  groups: MaterialGroupScenarioSummary[];
  groupCosts: ScenarioGroupCostSummary[];
  totalEstimatedSticks: number;
  totalEstimatedWasteInches: number;
  totalEstimatedCost: number;
  /** Effective max board width used for width caveats (defaults when input omitted). */
  maxPurchasableBoardWidthInches: number;
  /** Any material group has a part wider than max purchasable width (conservative flag only). */
  anyExceedsPurchasableBoardWidth: boolean;
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

/**
 * Width caveat rule (documented): stick math is length-only. For a conservative “can one board cover this span?”
 * check we compare **panel** parts on **finished width** (face / glue-up target) and **non-panel** parts on **rough width**
 * (stock width after allowance). This does not inflate stick counts—it only surfaces warnings.
 */
export function partWidthInchesForPurchaseCaveat(part: Part): number {
  return part.status === "panel" ? part.finished.w : part.rough.w;
}

function effectiveMaxPurchasableBoardWidthInches(input: PurchaseScenarioInput): number {
  const w = input.maxPurchasableBoardWidthInches;
  if (typeof w === "number" && Number.isFinite(w) && w > 0) return w;
  return DEFAULT_MAX_PURCHASABLE_BOARD_WIDTH_IN;
}

function groupExceedsPurchasableBoardWidth(groupParts: Part[], maxWidth: number): boolean {
  if (!Number.isFinite(maxWidth) || maxWidth <= 0) return false;
  return groupParts.some((p) => partWidthInchesForPurchaseCaveat(p) > maxWidth + 1e-6);
}

export const PURCHASE_SCENARIO_META: Record<
  PurchaseScenarioId,
  { title: string; shortHint: string }
> = {
  minWaste: {
    title: "Minimize offcuts",
    shortHint: "Pick stock length to reduce leftover length per group.",
  },
  minBoardCount: {
    title: "Fewest boards",
    shortHint: "Prefer longer sticks (within your max) to cut board count.",
  },
  fitTransport: {
    title: "Fits your vehicle",
    shortHint: `Pack assuming every board is ≤ your max transport length.`,
  },
  simpleTrip: {
    title: "Simple yard trip",
    shortHint: "One carry length, verify counts at the rack—good enough to leave with wood.",
  },
};

function partsForGroup(parts: Part[], g: BoardFootGroup): Part[] {
  const key = g.key;
  return parts.filter((p) => materialGroupKey(p.material.label, p.material.thicknessCategory) === key);
}

function summarizeGroup(
  g: BoardFootGroup,
  metrics: PackMetrics | null,
  maxTransport: number,
  groupParts: Part[]
): Omit<MaterialGroupScenarioSummary, "exceedsPurchasableBoardWidth"> {
  const pieces = roughCutsFromParts(groupParts);
  const maxCut = pieces.length ? Math.max(...pieces.map((p) => p.lengthInches)) : 0;
  const exceedsTransport = maxCut > maxTransport + 1e-6;

  if (!metrics) {
    return {
      key: g.key,
      materialLabel: g.materialLabel,
      thicknessCategory: g.thicknessCategory,
      recommendedStockLengthInches: maxTransport,
      estimatedStickCount: 0,
      estimatedWasteInches: 0,
      maxCutLengthInches: maxCut,
      exceedsTransport,
    };
  }

  return {
    key: g.key,
    materialLabel: g.materialLabel,
    thicknessCategory: g.thicknessCategory,
    recommendedStockLengthInches: metrics.stockLength,
    estimatedStickCount: metrics.stickCount,
    estimatedWasteInches: metrics.wasteInches,
    maxCutLengthInches: maxCut,
    exceedsTransport,
  };
}

function buildResult(
  scenario: PurchaseScenarioId,
  input: PurchaseScenarioInput,
  summarize: (g: BoardFootGroup, parts: Part[]) => PackMetrics | null
): PurchaseScenarioResult {
  const kerf = input.kerfInches ?? DEFAULT_KERF_IN;
  const maxTransport = input.maxTransportLengthInches;
  const maxPurchasableBoardWidthInches = effectiveMaxPurchasableBoardWidthInches(input);
  const groups = groupPartsByMaterial(input.parts, input.wasteFactorPercent);
  const summaries: MaterialGroupScenarioSummary[] = [];
  let totalSticks = 0;
  let totalWaste = 0;

  for (const g of groups) {
    const gp = partsForGroup(input.parts, g);
    const metrics = summarize(g, gp);
    const base = summarizeGroup(g, metrics, maxTransport, gp);
    const exceedsPurchasableBoardWidth = groupExceedsPurchasableBoardWidth(gp, maxPurchasableBoardWidthInches);
    summaries.push({ ...base, exceedsPurchasableBoardWidth });
    totalSticks += metrics?.stickCount ?? 0;
    totalWaste += metrics?.wasteInches ?? 0;
  }
  const groupCosts = summarizeGroupCosts(groups, input.costRatesByGroup);
  const totalCost = groupCosts.reduce((sum, row) => sum + row.totalCost, 0);

  const meta = PURCHASE_SCENARIO_META[scenario];
  const anyExceedsTransport = summaries.some((s) => s.exceedsTransport);
  const anyExceedsWidth = summaries.some((s) => s.exceedsPurchasableBoardWidth);

  const scenarioHeadline =
    scenario === "minWaste"
      ? `Favor stock lengths that trim offcut waste (kerf ${kerf}″ between cuts on the same stick).`
      : scenario === "minBoardCount"
        ? `Bias toward longer sticks (still ≤ ${maxTransport.toFixed(0)}″) to reduce how many boards you carry.`
        : scenario === "fitTransport"
          ? `Packing at your max carry length (${maxTransport.toFixed(0)}″) — every stick should ride home in one piece.`
          : `Use your max carry length (${maxTransport.toFixed(0)}″), confirm stick counts at the yard, and mill later—totals above stay rough-based.`;

  let headline = scenarioHeadline;
  if (anyExceedsTransport) {
    headline = `One or more rough lengths exceed ${maxTransport.toFixed(0)}″ — split parts, revise rough L, or arrange delivery before counting sticks.`;
  } else if (anyExceedsWidth) {
    headline = `Width caveat: at least one part spans more than your ${maxPurchasableBoardWidthInches.toFixed(0)}″ purchasable-board assumption (see Setup). Stick counts below are still a length-only estimate—plan rips, glue-ups, or wider stock separately. ${scenarioHeadline}`;
  }

  let detail =
    summaries.length === 0
      ? "Add parts to see stick-level hints."
      : anyExceedsTransport
        ? "BF/LF still use rough T×W×L; fix transport-length violations before trusting stick counts."
        : `About ${totalSticks} stick${totalSticks === 1 ? "" : "s"} estimated (1D rough L only; width/thickness still come from BF groups).`;

  if (anyExceedsWidth && !anyExceedsTransport && summaries.length > 0) {
    detail = `${detail} Width check uses finished width for panels and rough width for solid stock—wider than ${maxPurchasableBoardWidthInches.toFixed(1)}″ does not add sticks here.`;
  }

  const twoDimensional = computeTwoDimensionalBoardEstimate({
    parts: input.parts,
    wasteFactorPercent: input.wasteFactorPercent,
    maxTransportLengthInches: maxTransport,
    maxPurchasableBoardWidthInches,
    stockWidthByMaterialGroup: input.stockWidthByMaterialGroup,
    kerfInches: kerf,
    scenario,
  });

  return {
    scenario,
    title: meta.title,
    headline,
    detail,
    kerfInches: kerf,
    maxTransportLengthInches: maxTransport,
    groups: summaries,
    groupCosts,
    totalEstimatedSticks: totalSticks,
    totalEstimatedWasteInches: totalWaste,
    totalEstimatedCost: totalCost,
    maxPurchasableBoardWidthInches,
    anyExceedsPurchasableBoardWidth: anyExceedsWidth,
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
  const kerf = input.kerfInches ?? DEFAULT_KERF_IN;
  const maxTransport = input.maxTransportLengthInches;

  if (scenario === "fitTransport" || scenario === "simpleTrip") {
    return buildResult(scenario, input, (_g, gp) => tryPackGroupParts(gp, maxTransport, kerf));
  }
  if (scenario === "minWaste") {
    return buildResult(scenario, input, (_g, gp) => bestPackGroupParts(gp, maxTransport, kerf, "minWaste"));
  }
  return buildResult(scenario, input, (_g, gp) => bestPackGroupParts(gp, maxTransport, kerf, "minBoardCount"));
}

export function evaluateAllPurchaseScenarios(input: PurchaseScenarioInput): PurchaseScenarioResult[] {
  const ids: PurchaseScenarioId[] = ["minWaste", "minBoardCount", "fitTransport", "simpleTrip"];
  return ids.map((id) => evaluatePurchaseScenario(id, input));
}
