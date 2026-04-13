export type DrawerJoineryPresetId =
  | "butt"
  | "rabbet"
  | "dovetail_full_overlap"
  | "dovetail_half_lap";

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
  explanation: string;
};

const DEFAULT_HALF_LAP_RATIO = 0.5;
const DEFAULT_HEIGHT_ALLOWANCE = 0;

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

  if (preset === "butt") {
    return {
      widthAllowance: 0,
      heightAllowance: DEFAULT_HEIGHT_ALLOWANCE,
      explanation: "Butt-joint baseline: no additional joinery deduction.",
    };
  }

  if (preset === "rabbet") {
    const rabbetDepthPerSide = t * 0.5;
    return {
      widthAllowance: 2 * rabbetDepthPerSide,
      heightAllowance: DEFAULT_HEIGHT_ALLOWANCE,
      explanation: "Rabbet: width deduction = 2 × (0.5 × material thickness).",
    };
  }

  if (preset === "dovetail_full_overlap") {
    return {
      widthAllowance: 2 * t,
      heightAllowance: DEFAULT_HEIGHT_ALLOWANCE,
      explanation: "Dovetail full-overlap: width deduction = 2 × material thickness.",
    };
  }

  const ratio = safeNonNegative(input.halfLapRatio || DEFAULT_HALF_LAP_RATIO);
  const halfLapDepthPerSide =
    input.halfLapDepth !== undefined ? safeNonNegative(input.halfLapDepth) : t * ratio;
  return {
    widthAllowance: 2 * halfLapDepthPerSide,
    heightAllowance: DEFAULT_HEIGHT_ALLOWANCE,
    explanation:
      "Dovetail half-lap: width deduction = 2 × half-lap depth per side (default depth = 0.5 × material thickness).",
  };
}
