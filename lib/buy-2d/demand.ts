import { materialGroupKey } from "../board-feet";
import { planPanelGlueUp } from "../panel-glueup";
import type { Part } from "../project-types";
import type { DemandPiece } from "./types";

/**
 * Non-panels: one row per part type using **rough W × rough L** (buy dimensions).
 * Panels: decompose into glue-up strips (same length as rough L) so board count can reflect multiple rips per panel.
 */
export function demandPiecesForPart(part: Part, maxBoardWidthForGlueUp: number): DemandPiece[] {
  const key = materialGroupKey(part.material.label, part.material.thicknessCategory);

  if (part.status === "panel") {
    const glue = planPanelGlueUp({
      targetPanelWidth: part.finished.w,
      maxBoardWidth: maxBoardWidthForGlueUp,
    });
    if (glue.ok) {
      const q = Math.floor(Number(part.quantity));
      if (!Number.isFinite(q) || q < 1 || !(part.rough.l > 0)) return [];
      return glue.plan.targetStripWidths.map((w) => ({
        materialGroupKey: key,
        widthInches: w,
        lengthInches: part.rough.l,
        quantity: q,
        source: "panel_strip" as const,
        partId: part.id,
      }));
    }
    /* fall through: treat as solid rough block if glue-up cannot be planned */
  }

  const q = Math.floor(Number(part.quantity));
  if (!Number.isFinite(q) || q < 1 || !(part.rough.w > 0) || !(part.rough.l > 0)) return [];
  return [
    {
      materialGroupKey: key,
      widthInches: part.rough.w,
      lengthInches: part.rough.l,
      quantity: q,
      source: "solid",
      partId: part.id,
    },
  ];
}

export function demandPiecesForParts(parts: Part[], maxBoardWidthForGlueUp: number): DemandPiece[] {
  return parts.flatMap((p) => demandPiecesForPart(p, maxBoardWidthForGlueUp));
}
