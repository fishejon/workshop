import type { JointRuleId } from "@/lib/joinery/types";
import { formatImperial } from "@/lib/imperial";

/** Nominal ¼″ groove + ¼″ panel label for quarter-back style rules (matches construction presets). */
export const QUARTER_BACK_GROOVE_DEPTH_IN = 0.25;
export const QUARTER_BACK_PANEL_THICKNESS_IN = 0.25;

/** When no primary part is selected, assume this finished T for dado / tenon scaling (typical ¾″ stock). */
export const DEFAULT_FALLBACK_STOCK_THICKNESS_IN = 0.75;

/** Upper cap for recommended tenon length per end (inches), aligned with frame presets. */
export const RECOMMENDED_TENON_LENGTH_CAP_IN = 1;

/**
 * Stock thickness used for recommendations when the primary part is missing or invalid.
 */
export function resolveStockThicknessIn(primaryFinishedT: number | null | undefined): number {
  if (primaryFinishedT != null && Number.isFinite(primaryFinishedT) && primaryFinishedT > 0) {
    return primaryFinishedT;
  }
  return DEFAULT_FALLBACK_STOCK_THICKNESS_IN;
}

/**
 * Dado depth: min(¼″, ⅓ of stock thickness) so dados stay shallow on thin stock.
 */
export function recommendedDadoDepthIn(stockThicknessIn: number): number {
  const t = Math.max(0, stockThicknessIn);
  const third = t / 3;
  return Math.min(QUARTER_BACK_GROOVE_DEPTH_IN, third);
}

/**
 * Tenon length per end: ~½ × stock thickness, capped for thick members.
 */
export function recommendedTenonLengthPerEndIn(stockThicknessIn: number): number {
  const t = Math.max(0, stockThicknessIn);
  const half = t * 0.5;
  return Math.min(half, RECOMMENDED_TENON_LENGTH_CAP_IN);
}

export type RecommendedJoineryParams =
  | { ruleId: "groove_quarter_back"; grooveDepth: number; panelThickness: number }
  | { ruleId: "dado_shelf_width"; dadoDepth: number }
  | {
      ruleId: "mortise_tenon_rail" | "mortise_tenon_stile";
      tenonLengthPerEnd: number;
    };

export function recommendedParamsForRule(
  ruleId: JointRuleId,
  primaryFinishedThicknessIn: number | null | undefined
): RecommendedJoineryParams {
  const stockT = resolveStockThicknessIn(primaryFinishedThicknessIn ?? null);
  switch (ruleId) {
    case "groove_quarter_back":
      return {
        ruleId,
        grooveDepth: QUARTER_BACK_GROOVE_DEPTH_IN,
        panelThickness: QUARTER_BACK_PANEL_THICKNESS_IN,
      };
    case "dado_shelf_width":
      return { ruleId, dadoDepth: recommendedDadoDepthIn(stockT) };
    case "mortise_tenon_rail":
    case "mortise_tenon_stile":
      return { ruleId, tenonLengthPerEnd: recommendedTenonLengthPerEndIn(stockT) };
  }
}

/** Strip trailing `"` from `formatImperial` so values work with `parseInches`. */
export function formatInchesForJoineryField(inches: number): string {
  return formatImperial(inches).replace(/"$/, "");
}

/**
 * Single-line copy for the main Joinery UI when using stock-derived recommendations.
 */
export function recommendedJoinerySummaryLine(
  ruleId: JointRuleId,
  primaryFinishedThicknessIn: number | null | undefined,
  opts?: { hasSelectedPart: boolean; partLabel?: string }
): string {
  const hasPart = opts?.hasSelectedPart ?? false;
  const partBit = hasPart && opts?.partLabel
    ? `from ${opts.partLabel.trim() || "part"} finished T ${formatImperial(resolveStockThicknessIn(primaryFinishedThicknessIn))}`
    : hasPart
      ? `from selected part finished T ${formatImperial(resolveStockThicknessIn(primaryFinishedThicknessIn))}`
      : `using ${formatImperial(DEFAULT_FALLBACK_STOCK_THICKNESS_IN)} stock T until you select a primary part`;

  const rec = recommendedParamsForRule(ruleId, primaryFinishedThicknessIn);
  switch (rec.ruleId) {
    case "groove_quarter_back":
      return `Groove ${formatImperial(rec.grooveDepth)}, panel ${formatImperial(rec.panelThickness)} (¼ back convention; ${partBit}).`;
    case "dado_shelf_width":
      return `Dado depth ${formatImperial(rec.dadoDepth)} (${partBit}; min of ¼″ and ⅓ stock).`;
    case "mortise_tenon_rail":
    case "mortise_tenon_stile":
      return `Tenon length ${formatImperial(rec.tenonLengthPerEnd)} per end (${partBit}; ½× thickness, max ${formatImperial(RECOMMENDED_TENON_LENGTH_CAP_IN)}).`;
    default:
      return "";
  }
}
