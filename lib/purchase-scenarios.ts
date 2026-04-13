/**
 * Heuristic purchase plans: 1D stick packing (rough L × qty) per material group.
 * BF/LF totals stay in board-feet.ts; scenarios add stock-length / stick-count guidance.
 */

import type { BoardFootGroup } from "./board-feet";
import { groupPartsByMaterial, materialGroupKey } from "./board-feet";
import { packUniformStock, totalWaste } from "./optimize-cuts";
import type { Part } from "./project-types";
import { roughCutsFromParts } from "./rough-sticks";

export type PurchaseScenarioId = "minWaste" | "minBoardCount" | "fitTransport" | "simpleTrip";

export type PurchaseScenarioInput = {
  parts: Part[];
  wasteFactorPercent: number;
  maxTransportLengthInches: number;
  /** Optional rates keyed by materialGroupKey(label, thicknessCategory). */
  costRatesByGroup?: Record<string, { perBoardFoot?: number; perLinearFoot?: number }>;
  /** Table-saw kerf between cuts on the same stick (inches). */
  kerfInches?: number;
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

/** Common retail hardwood stick lengths (inches), ascending. */
const COMMON_STOCK_INCHES: readonly number[] = [
  48, 54, 60, 66, 72, 78, 84, 90, 96, 102, 108, 120, 132, 144,
];

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

function candidateStockLengths(maxTransport: number, minCut: number): number[] {
  if (minCut <= 0 || maxTransport <= 0) return [];
  if (minCut > maxTransport + 1e-6) return [];
  const fromCommon = COMMON_STOCK_INCHES.filter((l) => l <= maxTransport + 1e-6 && l >= minCut - 1e-6);
  const set = new Set(fromCommon);
  set.add(maxTransport);
  return Array.from(set).sort((a, b) => a - b);
}

type PackMetrics = {
  stockLength: number;
  stickCount: number;
  wasteInches: number;
};

function tryPack(
  groupParts: Part[],
  stockLength: number,
  kerf: number
): PackMetrics | null {
  const pieces = roughCutsFromParts(groupParts);
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

function bestPackForScenario(
  groupParts: Part[],
  maxTransport: number,
  kerf: number,
  mode: "minWaste" | "minBoardCount"
): PackMetrics | null {
  const pieces = roughCutsFromParts(groupParts);
  if (pieces.length === 0) {
    return { stockLength: maxTransport, stickCount: 0, wasteInches: 0 };
  }
  const minCut = Math.max(...pieces.map((p) => p.lengthInches));
  const candidates = candidateStockLengths(maxTransport, minCut);
  if (candidates.length === 0) return null;

  let best: PackMetrics | null = null;

  for (const L of candidates) {
    const m = tryPack(groupParts, L, kerf);
    if (!m) continue;
    if (!best) {
      best = m;
      continue;
    }
    if (mode === "minBoardCount") {
      if (m.stickCount < best.stickCount) best = m;
      else if (m.stickCount === best.stickCount) {
        if (m.wasteInches < best.wasteInches - 1e-6) best = m;
        else if (Math.abs(m.wasteInches - best.wasteInches) <= 1e-6 && m.stockLength > best.stockLength)
          best = m;
      }
    } else {
      // minWaste
      if (m.wasteInches < best.wasteInches - 1e-6) best = m;
      else if (Math.abs(m.wasteInches - best.wasteInches) <= 1e-6) {
        if (m.stickCount < best.stickCount) best = m;
        else if (m.stickCount === best.stickCount && m.stockLength < best.stockLength) best = m;
      }
    }
  }

  return best;
}

function summarizeGroup(
  g: BoardFootGroup,
  metrics: PackMetrics | null,
  maxTransport: number,
  groupParts: Part[]
): MaterialGroupScenarioSummary {
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
  const groups = groupPartsByMaterial(input.parts, input.wasteFactorPercent);
  const summaries: MaterialGroupScenarioSummary[] = [];
  let totalSticks = 0;
  let totalWaste = 0;

  for (const g of groups) {
    const gp = partsForGroup(input.parts, g);
    const metrics = summarize(g, gp);
    summaries.push(summarizeGroup(g, metrics, maxTransport, gp));
    totalSticks += metrics?.stickCount ?? 0;
    totalWaste += metrics?.wasteInches ?? 0;
  }
  const groupCosts = summarizeGroupCosts(groups, input.costRatesByGroup);
  const totalCost = groupCosts.reduce((sum, row) => sum + row.totalCost, 0);

  const meta = PURCHASE_SCENARIO_META[scenario];
  const anyExceeds = summaries.some((s) => s.exceedsTransport);
  const headline = anyExceeds
    ? `One or more rough lengths exceed ${maxTransport.toFixed(0)}″ — split parts, revise rough L, or arrange delivery before counting sticks.`
    : scenario === "minWaste"
      ? `Favor stock lengths that trim offcut waste (kerf ${kerf}″ between cuts on the same stick).`
      : scenario === "minBoardCount"
        ? `Bias toward longer sticks (still ≤ ${maxTransport.toFixed(0)}″) to reduce how many boards you carry.`
        : scenario === "fitTransport"
          ? `Packing at your max carry length (${maxTransport.toFixed(0)}″) — every stick should ride home in one piece.`
          : `Use your max carry length (${maxTransport.toFixed(0)}″), confirm stick counts at the yard, and mill later—totals above stay rough-based.`;

  const detail =
    summaries.length === 0
      ? "Add parts to see stick-level hints."
      : anyExceeds
        ? "BF/LF still use rough T×W×L; fix transport-length violations before trusting stick counts."
        : `About ${totalSticks} stick${totalSticks === 1 ? "" : "s"} estimated (1D rough L only; width/thickness still come from BF groups).`;

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
    return buildResult(scenario, input, (_g, gp) => tryPack(gp, maxTransport, kerf));
  }
  if (scenario === "minWaste") {
    return buildResult(scenario, input, (_g, gp) => bestPackForScenario(gp, maxTransport, kerf, "minWaste"));
  }
  return buildResult(scenario, input, (_g, gp) => bestPackForScenario(gp, maxTransport, kerf, "minBoardCount"));
}

export function evaluateAllPurchaseScenarios(input: PurchaseScenarioInput): PurchaseScenarioResult[] {
  const ids: PurchaseScenarioId[] = ["minWaste", "minBoardCount", "fitTransport", "simpleTrip"];
  return ids.map((id) => evaluatePurchaseScenario(id, input));
}
