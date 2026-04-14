/**
 * Dresser case (carcass) cut-list math — rectilinear, dados/rabbets not modeled per joint.
 *
 * Assumptions (verify in your build):
 * - **Sides & dividers**: Side thickness comes from `materialThickness`. Divider thickness defaults
 *   to side thickness but can be set explicitly with `dividerThickness`.
 * - **Top**: One primary top board, thickness defaults to side thickness but can be overridden with
 *   `topPanelThickness`. Full outer W×D (add overhang manually if needed; `topAssemblyHeight` is
 *   only used for back height / notes, not top stock T).
 * - **Bottom**: Thickness = `bottomPanelThickness`. Sits between sides: width = inner width
 *   (outerW − 2×sideT), depth = inner depth from front inside face to back panel inside face:
 *   outerD − sideT − backThickness (one rear side rabbet / inset back).
 * - **Back**: Thickness = `backThickness`. Width = inner width. Height = drawer stack zone only
 *   (kick is open at front; back does not extend into plinth): outerH − kick − bottomPanel − topAssembly.
 *   Omit back part if `backThickness` ≤ 0.
 * - **Toe kick facing**: One front strip between sides when kick > 0: thickness × inner width × kick
 *   height (grain runs horizontal along width). Classified as Base.
 * - **Horizontal rails between drawer rows** are not emitted here — only the shell. `rowCount` and
 *   `railBetweenDrawers` appear in grain notes for context. **Shelf dados** are not modeled—add shelf parts or a
 *   future joinery rule when needed.
 */

import type { AssemblyId, Dimension3, PartStatus } from "./project-types";
import { planPanelGlueUp, type PanelGlueUpPlan } from "./panel-glueup";

export type DresserCarcassInput = {
  outerWidth: number;
  outerHeight: number;
  outerDepth: number;
  materialThickness: number;
  dividerThickness?: number;
  topPanelThickness?: number;
  maxPurchasableBoardWidth?: number;
  columnCount: 1 | 2 | 3;
  kickHeight: number;
  topAssemblyHeight: number;
  bottomPanelThickness: number;
  rowCount: number;
  railBetweenDrawers: number;
  backThickness: number;
};

export type DresserCarcassPartSpec = {
  name: string;
  assembly: Extract<AssemblyId, "Case" | "Base" | "Back">;
  quantity: number;
  finished: Dimension3;
  grainNote?: string;
  glueUpPlan?: PanelGlueUpPlan;
  status: PartStatus;
};

export type DresserCarcassResult =
  | { ok: true; parts: DresserCarcassPartSpec[]; drawerZoneHeight: number }
  | { ok: false; message: string };

function drawerZoneHeight(input: DresserCarcassInput): number | null {
  const z =
    input.outerHeight -
    input.kickHeight -
    input.bottomPanelThickness -
    input.topAssemblyHeight;
  return z > 0 ? z : null;
}

export function buildDresserCarcassParts(input: DresserCarcassInput): DresserCarcassResult {
  const sideT = input.materialThickness;
  const dividerT = input.dividerThickness ?? sideT;
  const topT = input.topPanelThickness ?? sideT;
  const { outerWidth: W, outerHeight: H, outerDepth: D } = input;

  if (!Number.isFinite(W) || W <= 0 || !Number.isFinite(H) || H <= 0 || !Number.isFinite(D) || D <= 0) {
    return { ok: false, message: "Overall width, height, and depth must be positive numbers." };
  }
  if (!Number.isFinite(sideT) || sideT <= 0 || !Number.isFinite(dividerT) || dividerT <= 0 || !Number.isFinite(topT) || topT <= 0) {
    return { ok: false, message: "Case side, divider, and top panel thickness must be positive." };
  }
  if (input.kickHeight < 0 || input.topAssemblyHeight < 0 || input.bottomPanelThickness < 0) {
    return { ok: false, message: "Kick, top assembly, and bottom panel values must be ≥ 0." };
  }
  if (input.backThickness < 0) {
    return { ok: false, message: "Back thickness must be ≥ 0." };
  }
  if (!Number.isFinite(input.rowCount) || input.rowCount < 1) {
    return { ok: false, message: "Row count must be at least 1." };
  }
  if (input.railBetweenDrawers < 0) {
    return { ok: false, message: "Rail between drawers must be ≥ 0." };
  }

  const innerW = W - 2 * sideT;
  if (innerW <= 0) {
    return { ok: false, message: "Sides consume the full width—increase width or reduce thickness." };
  }

  const dividers = input.columnCount - 1;
  const columnInner = (innerW - dividers * dividerT) / input.columnCount;
  if (columnInner <= 0) {
    return { ok: false, message: "Columns are too narrow—fewer columns, wider case, or thinner stock." };
  }

  const dz = drawerZoneHeight(input);
  if (dz === null) {
    return {
      ok: false,
      message:
        "No vertical room for the drawer zone—adjust overall height, kick, bottom panel, or top assembly.",
    };
  }

  const bottomDepth = D - sideT - input.backThickness;
  if (bottomDepth <= 0) {
    return { ok: false, message: "Depth is too shallow for bottom panel after side and back thickness." };
  }

  const backH = dz;
  if (input.backThickness > 0 && backH <= 0) {
    return { ok: false, message: "Back panel height computed non-positive—check vertical breakdown." };
  }

  const stackNote = `${input.rowCount} drawer row(s), ${input.rowCount - 1} rail gap(s) at ${input.railBetweenDrawers.toFixed(3)}"`;
  const maxPurchasableBoardWidth = input.maxPurchasableBoardWidth;

  function maybePlanGlueUp(targetPanelWidth: number): PanelGlueUpPlan | undefined {
    if (!Number.isFinite(maxPurchasableBoardWidth) || (maxPurchasableBoardWidth ?? 0) <= 0) return undefined;
    if (targetPanelWidth <= (maxPurchasableBoardWidth ?? 0)) return undefined;
    const result = planPanelGlueUp({
      targetPanelWidth,
      maxBoardWidth: maxPurchasableBoardWidth ?? 0,
    });
    return result.ok ? result.plan : undefined;
  }

  function formatGlueUpNote(plan: PanelGlueUpPlan | undefined): string {
    if (!plan) return "";
    const stripWidths = plan.targetStripWidths.map((w) => `${w.toFixed(3)}"`).join(" + ");
    const seamLocations = plan.seamPositions.map((s) => `${s.toFixed(3)}"`).join(", ");
    return `Glue-up plan: ${plan.stripCount} strip(s) (${stripWidths}) · Seams at ${seamLocations} from one edge · Rough glue-up width ${plan.roughOversizeRecommendation.roughGlueUpWidth.toFixed(3)}" (+${plan.roughOversizeRecommendation.edgeTrimAllowance.toFixed(3)}" per edge, +${plan.roughOversizeRecommendation.overLengthAllowance.toFixed(3)}" extra length) · ${plan.seamGuidance}`;
  }

  const parts: DresserCarcassPartSpec[] = [];

  const sideGlueUp = maybePlanGlueUp(D);
  const sideNote = [
    `Grain vertical (along L / case height) · Full-height side · ${stackNote}`,
    formatGlueUpNote(sideGlueUp),
  ]
    .filter(Boolean)
    .join(" · ");
  parts.push(
    {
      name: "Case side (left)",
      assembly: "Case",
      quantity: 1,
      finished: { t: sideT, w: D, l: H },
      grainNote: sideNote,
      glueUpPlan: sideGlueUp,
      status: "solid",
    },
    {
      name: "Case side (right)",
      assembly: "Case",
      quantity: 1,
      finished: { t: sideT, w: D, l: H },
      grainNote: sideNote,
      glueUpPlan: sideGlueUp,
      status: "solid",
    }
  );

  const topGlueUp = maybePlanGlueUp(W);
  parts.push({
    name: "Case top",
    assembly: "Case",
    quantity: 1,
    finished: { t: topT, w: W, l: D },
    grainNote: [
      `Grain typically along W (front edge); confirm rift/flat preference · Full outer top · ${stackNote} (top assembly height ${input.topAssemblyHeight.toFixed(3)}" is total band above drawers)`,
      formatGlueUpNote(topGlueUp),
    ]
      .filter(Boolean)
      .join(" · "),
    glueUpPlan: topGlueUp,
    status: "solid",
  });

  parts.push({
    name: "Case bottom",
    assembly: "Case",
    quantity: 1,
    finished: { t: input.bottomPanelThickness, w: innerW, l: bottomDepth },
    grainNote: `Grain along W to match top/sides shop practice · Between sides; depth allows inset back (${input.backThickness.toFixed(3)}") and one side thickness at rear · ${stackNote}`,
    status: "solid",
  });

  for (let i = 0; i < dividers; i++) {
    parts.push({
      name: `Case divider ${i + 1}`,
      assembly: "Case",
      quantity: 1,
      finished: { t: dividerT, w: D, l: H },
      grainNote: `Grain vertical (along L) · Full-depth vertical partition · ${stackNote}`,
      status: "solid",
    });
  }

  if (input.kickHeight > 0) {
    parts.push({
      name: "Toe kick front",
      assembly: "Base",
      quantity: 1,
      finished: { t: sideT, w: innerW, l: input.kickHeight },
      grainNote:
        "Grain horizontal along strip length (W) · Front facing strip between sides; confirm recess and side notches on site",
      status: "solid",
    });
  }

  if (input.backThickness > 0) {
    parts.push({
      name: "Case back",
      assembly: "Back",
      quantity: 1,
      finished: { t: input.backThickness, w: innerW, l: backH },
      grainNote: `Panel—grain vertical or horizontal per design · Drawer-stack back only (height = drawer zone ${dz.toFixed(3)}") · ${stackNote}`,
      status: "panel",
    });
  }

  return { ok: true, parts, drawerZoneHeight: dz };
}
