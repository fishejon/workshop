import { formatJointRuleLabel, summarizePartProvenance } from "@/lib/part-provenance";
import { materialGroupKey } from "@/lib/board-feet";
import { planPanelGlueUp } from "@/lib/panel-glueup";
import type { Part, Project, ProjectJoint } from "@/lib/project-types";

/** Default when legacy projects omit `maxPurchasableBoardWidthInches` (see `parseProject`). */
export const DEFAULT_MAX_PURCHASABLE_BOARD_WIDTH_IN = 20;

export type PartAssumptions = {
  joinery: string;
  glueUp: string;
};

export type PartAssumptionsProjectInput = Pick<
  Project,
  "maxPurchasableBoardWidthInches" | "stockWidthByMaterialGroup"
>;

export type GlueUpBoardWidthSource = "material_override" | "project_setting" | "project_default";

export type DerivedPartAssumptions = {
  assumptions: PartAssumptions;
  provenance: ReturnType<typeof summarizePartProvenance>;
  provenanceSummary: string;
  glueUpPlan: {
    applicable: boolean;
    required: boolean;
    stripCount: number;
    targetStripWidths: number[];
    seamPositions: number[];
    maxBoardWidthInches: number;
    boardWidthSource: GlueUpBoardWidthSource;
  };
};

function effectiveProjectMaxBoardWidthInches(project: PartAssumptionsProjectInput): {
  value: number;
  source: Exclude<GlueUpBoardWidthSource, "material_override">;
} {
  const w = project.maxPurchasableBoardWidthInches;
  if (typeof w === "number" && Number.isFinite(w) && w > 0) {
    return { value: w, source: "project_setting" };
  }
  return { value: DEFAULT_MAX_PURCHASABLE_BOARD_WIDTH_IN, source: "project_default" };
}

/** Project-level max board face width when no part exists in a group (edge case). */
export function projectDefaultPurchasableStockWidthInches(project: PartAssumptionsProjectInput): number {
  return effectiveProjectMaxBoardWidthInches(project).value;
}

/** Dressed stock width (in) used for glue-up / buy math for this part's material group. */
export function purchasableStockWidthInchesForPart(
  part: Part,
  project: PartAssumptionsProjectInput
): { value: number; source: GlueUpBoardWidthSource } {
  const projectBoardWidth = effectiveProjectMaxBoardWidthInches(project);
  const key = materialGroupKey(part.material.label, part.material.thicknessCategory);
  const override = project.stockWidthByMaterialGroup?.[key];
  if (typeof override === "number" && Number.isFinite(override) && override > 0) {
    return { value: override, source: "material_override" };
  }
  return projectBoardWidth;
}

export function derivePartAssumptionsDetailed(
  part: Part,
  joints: ProjectJoint[],
  project: PartAssumptionsProjectInput
): DerivedPartAssumptions {
  const provenance = summarizePartProvenance(part, joints);
  const boardWidth = purchasableStockWidthInchesForPart(part, project);
  const maxBoardWidth = boardWidth.value;

  let joinery = "No recorded joinery dimension deltas.";
  if (provenance.joineryChangeCount > 0) {
    joinery =
      provenance.lastJoineryRuleId
        ? `Joinery-adjusted finished size (${provenance.joineryChangeCount}x, latest: ${formatJointRuleLabel(
            provenance.lastJoineryRuleId
          )}).`
        : `Joinery-adjusted finished size (${provenance.joineryChangeCount}x).`;
  } else if (part.grainNote.includes("box formula:")) {
    joinery = "Drawer box sizing uses formula noted in grain/joinery note.";
  } else if (part.grainNote.includes("joinery ref:")) {
    joinery = "Joinery assumption is captured in grain/joinery note.";
  }

  if (part.status !== "panel") {
    return {
      assumptions: {
        joinery,
        glueUp: "Glue-up check not applicable (non-panel part).",
      },
      provenance,
      provenanceSummary:
        provenance.roughSource === "manual"
          ? "Rough dimensions are manual; no panel glue-up analysis for non-panel parts."
          : "Rough dimensions are derived; no panel glue-up analysis for non-panel parts.",
      glueUpPlan: {
        applicable: false,
        required: false,
        stripCount: 0,
        targetStripWidths: [],
        seamPositions: [],
        maxBoardWidthInches: maxBoardWidth,
        boardWidthSource: boardWidth.source,
      },
    };
  }

  const glueUpPlan = planPanelGlueUp({
    targetPanelWidth: part.finished.w,
    maxBoardWidth,
  });
  if (!glueUpPlan.ok) {
    return {
      assumptions: {
        joinery,
        glueUp: "Glue-up plan unavailable (invalid panel width input).",
      },
      provenance,
      provenanceSummary: "Provenance available, but glue-up plan failed due to invalid panel width inputs.",
      glueUpPlan: {
        applicable: true,
        required: false,
        stripCount: 0,
        targetStripWidths: [],
        seamPositions: [],
        maxBoardWidthInches: maxBoardWidth,
        boardWidthSource: boardWidth.source,
      },
    };
  }

  const needsGlueUp = glueUpPlan.plan.stripCount > 1;
  const stripWidthsLabel = glueUpPlan.plan.targetStripWidths.map((w) => w.toFixed(3)).join(", ");
  const seamsLabel =
    glueUpPlan.plan.seamPositions.length > 0
      ? glueUpPlan.plan.seamPositions.map((s) => s.toFixed(3)).join(", ")
      : "none";
  const boardWidthSourceLabel =
    boardWidth.source === "material_override"
      ? "material override"
      : boardWidth.source === "project_setting"
        ? "project max width"
        : "default max width";

  return {
    assumptions: {
      joinery,
      glueUp: needsGlueUp
        ? `Glue-up required assumption: ${glueUpPlan.plan.stripCount} strips for ${part.finished.w.toFixed(3)}" target width (max board width ${maxBoardWidth.toFixed(3)}", source: ${boardWidthSourceLabel}; strips: [${stripWidthsLabel}], seams @ [${seamsLabel}]).`
        : `Single-board panel assumption: ${part.finished.w.toFixed(3)}" target width is within max board width ${maxBoardWidth.toFixed(3)}" (source: ${boardWidthSourceLabel}).`,
    },
    provenance,
    provenanceSummary:
      `Rough source: ${provenance.roughSource}. ` +
      `Joinery changes: ${provenance.joineryChangeCount}. ` +
      `Joinery mate refs: ${provenance.joineryReferenceCount}.` +
      (provenance.lastJoineryRuleId ? ` Latest rule: ${formatJointRuleLabel(provenance.lastJoineryRuleId)}.` : ""),
    glueUpPlan: {
      applicable: true,
      required: needsGlueUp,
      stripCount: glueUpPlan.plan.stripCount,
      targetStripWidths: glueUpPlan.plan.targetStripWidths,
      seamPositions: glueUpPlan.plan.seamPositions,
      maxBoardWidthInches: maxBoardWidth,
      boardWidthSource: boardWidth.source,
    },
  };
}

export function derivePartAssumptions(
  part: Part,
  joints: ProjectJoint[],
  project: PartAssumptionsProjectInput
): PartAssumptions {
  return derivePartAssumptionsDetailed(part, joints, project).assumptions;
}
