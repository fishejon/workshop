import { formatJointRuleLabel, summarizePartProvenance } from "@/lib/part-provenance";
import { planPanelGlueUp } from "@/lib/panel-glueup";
import type { Part, Project, ProjectJoint } from "@/lib/project-types";

/** Default when legacy projects omit `maxPurchasableBoardWidthInches` (see `parseProject`). */
export const DEFAULT_MAX_PURCHASABLE_BOARD_WIDTH_IN = 20;

export type PartAssumptions = {
  joinery: string;
  glueUp: string;
};

function effectiveMaxBoardWidthInches(project: Pick<Project, "maxPurchasableBoardWidthInches">): number {
  const w = project.maxPurchasableBoardWidthInches;
  if (typeof w === "number" && Number.isFinite(w) && w > 0) return w;
  return DEFAULT_MAX_PURCHASABLE_BOARD_WIDTH_IN;
}

export function derivePartAssumptions(
  part: Part,
  joints: ProjectJoint[],
  project: Pick<Project, "maxPurchasableBoardWidthInches">
): PartAssumptions {
  const provenance = summarizePartProvenance(part, joints);
  const maxBoardWidth = effectiveMaxBoardWidthInches(project);

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
      joinery,
      glueUp: "Glue-up check not applicable (non-panel part).",
    };
  }

  const glueUpPlan = planPanelGlueUp({
    targetPanelWidth: part.finished.w,
    maxBoardWidth,
  });
  if (!glueUpPlan.ok) {
    return {
      joinery,
      glueUp: "Glue-up plan unavailable (invalid panel width input).",
    };
  }

  const needsGlueUp = glueUpPlan.plan.stripCount > 1;
  return {
    joinery,
    glueUp: needsGlueUp
      ? `Glue-up required assumption: ${glueUpPlan.plan.stripCount} strips for ${part.finished.w.toFixed(3)}" target width (max board width ${maxBoardWidth.toFixed(3)}").`
      : `Single-board panel assumption: ${part.finished.w.toFixed(3)}" target width is within max board width ${maxBoardWidth.toFixed(3)}".`,
  };
}
