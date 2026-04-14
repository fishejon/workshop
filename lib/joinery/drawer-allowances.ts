export type DrawerJoineryPresetId =
  | "butt"
  | "rabbet"
  | "dovetail_full_overlap"
  | "dovetail_half_lap";

export type DrawerJoineryFormulaId =
  | "width=0"
  | "width=2*(0.5*t)"
  | "width=2*t"
  | "width=2*half_lap_depth";

export type DrawerAllowancePresetInput = {
  preset: DrawerJoineryPresetId;
  materialThickness: number;
  /**
   * Fraction of thickness used for half-lap depth per side.
   * Ignored when explicit `halfLapDepth` is provided.
   */
  halfLapRatio?: number;
  /** Explicit half-lap depth per side (inches). */
  halfLapDepth?: number;
};

export type DrawerAllowanceResult = {
  widthAllowance: number;
  heightAllowance: number;
  presetLabel: string;
  formulaId: DrawerJoineryFormulaId;
  provenance: string;
  explanation: string;
};

const DEFAULT_HALF_LAP_RATIO = 0.5;
const DEFAULT_HEIGHT_ALLOWANCE = 0;

export const DRAWER_JOINERY_PRESET_META: Record<
  DrawerJoineryPresetId,
  { label: string; engineeringLabel: string }
> = {
  butt: {
    label: "Butt-joint baseline",
    engineeringLabel: "Baseline (butt): width deduction = 0",
  },
  rabbet: {
    label: "Rabbeted front/back",
    engineeringLabel: "Rabbet: width deduction = 2 x (0.5 x t)",
  },
  dovetail_full_overlap: {
    label: "Dovetail, full overlap",
    engineeringLabel: "Dovetail full-overlap: width deduction = 2 x t",
  },
  dovetail_half_lap: {
    label: "Dovetail, half-lap",
    engineeringLabel: "Dovetail half-lap: width deduction = 2 x lapDepthSide",
  },
};

function safeNonNegative(value: number | undefined): number {
  if (value === undefined || !Number.isFinite(value)) return 0;
  return Math.max(0, value);
}

/**
 * Compute additional drawer-box allowances beyond slide clearances.
 * All return values are total deductions (not per-side).
 */
export function computeDrawerJoineryAllowances(input: DrawerAllowancePresetInput): DrawerAllowanceResult {
  const t = safeNonNegative(input.materialThickness);
  const preset = input.preset;
  const presetMeta = DRAWER_JOINERY_PRESET_META[preset];

  if (preset === "butt") {
    const formulaId: DrawerJoineryFormulaId = "width=0";
    return {
      widthAllowance: 0,
      heightAllowance: DEFAULT_HEIGHT_ALLOWANCE,
      presetLabel: presetMeta.label,
      formulaId,
      provenance: `${presetMeta.label} [${formulaId}] @ t=${t.toFixed(3)}in`,
      explanation: "Butt-joint baseline: no additional joinery deduction.",
    };
  }

  if (preset === "rabbet") {
    const rabbetDepthPerSide = t * 0.5;
    const formulaId: DrawerJoineryFormulaId = "width=2*(0.5*t)";
    return {
      widthAllowance: 2 * rabbetDepthPerSide,
      heightAllowance: DEFAULT_HEIGHT_ALLOWANCE,
      presetLabel: presetMeta.label,
      formulaId,
      provenance: `${presetMeta.label} [${formulaId}] @ t=${t.toFixed(3)}in`,
      explanation: "Rabbet: width deduction = 2 × (0.5 × material thickness).",
    };
  }

  if (preset === "dovetail_full_overlap") {
    const formulaId: DrawerJoineryFormulaId = "width=2*t";
    return {
      widthAllowance: 2 * t,
      heightAllowance: DEFAULT_HEIGHT_ALLOWANCE,
      presetLabel: presetMeta.label,
      formulaId,
      provenance: `${presetMeta.label} [${formulaId}] @ t=${t.toFixed(3)}in`,
      explanation: "Dovetail full-overlap: width deduction = 2 × material thickness.",
    };
  }

  const ratio = safeNonNegative(input.halfLapRatio || DEFAULT_HALF_LAP_RATIO);
  const halfLapDepthPerSide =
    input.halfLapDepth !== undefined ? safeNonNegative(input.halfLapDepth) : t * ratio;
  const formulaId: DrawerJoineryFormulaId = "width=2*half_lap_depth";
  const depthSource =
    input.halfLapDepth !== undefined
      ? `halfLapDepthSide=${halfLapDepthPerSide.toFixed(3)}in`
      : `halfLapDepthSide=${halfLapDepthPerSide.toFixed(3)}in (ratio=${ratio.toFixed(3)} x t)`;
  return {
    widthAllowance: 2 * halfLapDepthPerSide,
    heightAllowance: DEFAULT_HEIGHT_ALLOWANCE,
    presetLabel: presetMeta.label,
    formulaId,
    provenance: `${presetMeta.label} [${formulaId}] @ t=${t.toFixed(3)}in, ${depthSource}`,
    explanation:
      "Dovetail half-lap: width deduction = 2 × half-lap depth per side (default depth = 0.5 × material thickness).",
  };
}
