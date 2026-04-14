import { boardFeetForPart, linearFeetForPart } from "@/lib/board-feet";
import { derivePartAssumptionsDetailed } from "@/lib/part-assumptions";
import type { Part, Project, ProjectJoint } from "@/lib/project-types";

function csvEscape(s: string): string {
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

export function partsToCsv(
  parts: Part[],
  joints: ProjectJoint[],
  project: Pick<Project, "maxPurchasableBoardWidthInches" | "stockWidthByMaterialGroup">
): string {
  const headers = [
    "name",
    "assembly",
    "quantity",
    "finished_t_in",
    "finished_w_in",
    "finished_l_in",
    "rough_t_in",
    "rough_w_in",
    "rough_l_in",
    "rough_manual",
    "board_feet_each",
    "board_feet_total",
    "linear_feet_each",
    "linear_feet_total",
    "material",
    "thickness_category",
    "grain_note",
    "joinery_assumption",
    "glue_up_assumption",
    "provenance_summary",
    "rough_source",
    "joinery_change_count",
    "joinery_reference_count",
    "last_joinery_rule_id",
    "glue_up_applicable",
    "glue_up_required",
    "glue_up_strip_count",
    "glue_up_target_strip_widths_in",
    "glue_up_seam_positions_in",
    "glue_up_max_board_width_in",
    "glue_up_board_width_source",
    "status",
  ];
  const rows = parts.map((p) => {
    const qty = Math.max(1, p.quantity);
    const bfEach = boardFeetForPart(p);
    const lfEach = linearFeetForPart(p);
    const derived = derivePartAssumptionsDetailed(p, joints, project);
    return [
      csvEscape(p.name),
      p.assembly,
      p.quantity,
      p.finished.t,
      p.finished.w,
      p.finished.l,
      p.rough.t,
      p.rough.w,
      p.rough.l,
      p.rough.manual,
      bfEach,
      bfEach * qty,
      lfEach,
      lfEach * qty,
      csvEscape(p.material.label),
      csvEscape(p.material.thicknessCategory),
      csvEscape(p.grainNote),
      csvEscape(derived.assumptions.joinery),
      csvEscape(derived.assumptions.glueUp),
      csvEscape(derived.provenanceSummary),
      derived.provenance.roughSource,
      derived.provenance.joineryChangeCount,
      derived.provenance.joineryReferenceCount,
      csvEscape(derived.provenance.lastJoineryRuleId ?? ""),
      derived.glueUpPlan.applicable,
      derived.glueUpPlan.required,
      derived.glueUpPlan.stripCount,
      csvEscape(derived.glueUpPlan.targetStripWidths.map((n) => n.toFixed(3)).join(";")),
      csvEscape(derived.glueUpPlan.seamPositions.map((n) => n.toFixed(3)).join(";")),
      derived.glueUpPlan.maxBoardWidthInches,
      derived.glueUpPlan.boardWidthSource,
      p.status,
    ].join(",");
  });
  return [headers.join(","), ...rows].join("\n");
}
