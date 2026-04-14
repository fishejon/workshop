/**
 * 2D buy estimate (width × length) — companion to 1D stick packing in `purchase-scenarios.ts`.
 *
 * Pipeline:
 * 1. `board-feet.groupPartsByMaterial` — same groups as BF/LF.
 * 2. `demand.ts` — each part → `DemandPiece[]` (rough W×L; panels → glue-up strips via `planPanelGlueUp`).
 * 3. `width-fit.ts` — each strip/cut may need `ceil(width ÷ stockWidth)` “width lanes” (rips).
 * 4. `purchase-pack` — FFD pack on expanded rough **lengths** only → estimated board count.
 *
 * This is a **yard planning estimate**, not optimal 2D nesting. BF/LF totals still come from `board-feet.ts`.
 */

export type DemandSource = "solid" | "panel_strip";

export type DemandPiece = {
  materialGroupKey: string;
  widthInches: number;
  lengthInches: number;
  quantity: number;
  source: DemandSource;
  partId?: string;
};

export type TwoDimensionalGroupEstimate = {
  key: string;
  materialLabel: string;
  thicknessCategory: string;
  /** Stock width used for rip math (group override or project default). */
  stockWidthAssumedInches: number;
  /** Boards after width expansion + length FFD (same scenario mode as 1D plan). */
  estimatedBoards2d: number;
  /** Length-only stick count for the same group (existing 1D model). */
  estimatedSticks1d: number;
  recommendedStockLengthInches: number;
  flags: string[];
  detail: string;
};

export type TwoDimensionalBoardEstimate = {
  headline: string;
  detail: string;
  groups: TwoDimensionalGroupEstimate[];
  totalEstimatedBoards2d: number;
  assumptions: string[];
};
