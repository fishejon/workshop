export type PanelGlueUpInput = {
  targetPanelWidth: number;
  maxBoardWidth: number;
  minStripWidth?: number;
  widthPrecision?: number;
  edgeTrimAllowance?: number;
  overLengthAllowance?: number;
};

export type PanelGlueUpPlan = {
  stripCount: number;
  targetStripWidths: number[];
  seamPositions: number[];
  seamGuidance: string;
  roughOversizeRecommendation: {
    roughGlueUpWidth: number;
    edgeTrimAllowance: number;
    overLengthAllowance: number;
  };
};

export type PanelGlueUpResult = { ok: true; plan: PanelGlueUpPlan } | { ok: false; message: string };

const DEFAULT_MIN_STRIP_WIDTH = 2;
const DEFAULT_WIDTH_PRECISION = 1 / 64;
const DEFAULT_EDGE_TRIM_ALLOWANCE = 0.5;
const DEFAULT_OVER_LENGTH_ALLOWANCE = 2;
const MAX_STRIP_SEARCH_STEPS = 24;

function quantize(value: number, step: number): number {
  return Math.round(value / step) * step;
}

function distributeWidths(total: number, count: number, precision: number): number[] {
  if (count <= 1) return [total];
  const widths: number[] = [];
  let used = 0;
  for (let i = 0; i < count; i++) {
    if (i === count - 1) {
      widths.push(total - used);
      break;
    }
    const remaining = total - used;
    const remainingCount = count - i;
    const target = quantize(remaining / remainingCount, precision);
    widths.push(target);
    used += target;
  }
  return widths;
}

export function planPanelGlueUp(input: PanelGlueUpInput): PanelGlueUpResult {
  const minStripWidth = input.minStripWidth ?? DEFAULT_MIN_STRIP_WIDTH;
  const widthPrecision = input.widthPrecision ?? DEFAULT_WIDTH_PRECISION;
  const edgeTrimAllowance = input.edgeTrimAllowance ?? DEFAULT_EDGE_TRIM_ALLOWANCE;
  const overLengthAllowance = input.overLengthAllowance ?? DEFAULT_OVER_LENGTH_ALLOWANCE;

  if (!Number.isFinite(input.targetPanelWidth) || input.targetPanelWidth <= 0) {
    return { ok: false, message: "Target panel width must be a positive number." };
  }
  if (!Number.isFinite(input.maxBoardWidth) || input.maxBoardWidth <= 0) {
    return { ok: false, message: "Max board width must be a positive number." };
  }
  if (!Number.isFinite(minStripWidth) || minStripWidth <= 0) {
    return { ok: false, message: "Minimum strip width must be a positive number." };
  }
  if (!Number.isFinite(widthPrecision) || widthPrecision <= 0) {
    return { ok: false, message: "Width precision must be a positive number." };
  }

  const minimumStripCount = Math.max(1, Math.ceil(input.targetPanelWidth / input.maxBoardWidth));

  let stripCount = minimumStripCount;
  for (let extra = 0; extra < MAX_STRIP_SEARCH_STEPS; extra++) {
    const candidate = minimumStripCount + extra;
    const avgWidth = input.targetPanelWidth / candidate;
    if (avgWidth >= minStripWidth) {
      stripCount = candidate;
      break;
    }
  }

  const targetStripWidths = distributeWidths(input.targetPanelWidth, stripCount, widthPrecision);
  const seams: number[] = [];
  let running = 0;
  for (let i = 0; i < targetStripWidths.length - 1; i++) {
    running += targetStripWidths[i] ?? 0;
    seams.push(quantize(running, widthPrecision));
  }

  const roughGlueUpWidth = quantize(input.targetPanelWidth + edgeTrimAllowance * 2, widthPrecision);

  return {
    ok: true,
    plan: {
      stripCount,
      targetStripWidths,
      seamPositions: seams,
      seamGuidance:
        stripCount > 1
          ? "Alternate growth-ring orientation between adjacent strips and avoid placing a seam where hardware or joinery is concentrated."
          : "Single-board panel; no glue seams required.",
      roughOversizeRecommendation: {
        roughGlueUpWidth,
        edgeTrimAllowance,
        overLengthAllowance,
      },
    },
  };
}
