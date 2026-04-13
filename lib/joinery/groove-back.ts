import type { Dimension3 } from "@/lib/project-types";

/**
 * Groove for a thin (e.g. ¼") back panel, treated as a **floating panel** in dados/grooves
 * around the perimeter (left, right, top, bottom).
 *
 * **Assumption (MVP):** The part’s finished **W** and **L** are currently sized as if the panel
 * were flush to the **inner case opening** (full width × full height of the groove run). To float
 * in the groove, subtract **one groove depth per side** on each in-plane axis: **2× groove depth**
 * from W and **2× groove depth** from L. Thickness **T** is unchanged (panel stock thickness is
 * separate from groove depth).
 *
 * `panelThickness` does not change the math here; it is only used in the human-readable text so
 * the rule reads as “¼ back” (or whatever nominal thickness you pass).
 */
export function applyGrooveForQuarterBackPanel(params: {
  grooveDepth: number;
  panelThickness: number;
}): { explanation: string; finishedDimensionDeltas: Dimension3 } {
  const { grooveDepth: d, panelThickness } = params;
  const depth = Math.max(0, d);
  const thick = Math.max(0, panelThickness);
  const totalW = 2 * depth;
  const totalL = 2 * depth;

  const explanation = [
    `Groove for a ${thick.toFixed(3)}"-thick back (floating panel): each in-plane edge sits in a groove ${depth.toFixed(3)}" deep.`,
    `Assuming finished W×L were sized to the inner opening, reduce W by ${totalW.toFixed(3)}" and L by ${totalL.toFixed(3)}" (${depth.toFixed(3)}" per side on each axis).`,
    `Finished T is left unchanged (stock thickness).`,
  ].join(" ");

  return {
    explanation,
    finishedDimensionDeltas: { t: 0, w: -totalW, l: -totalL },
  };
}
