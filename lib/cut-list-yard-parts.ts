import type { Part, Project } from "@/lib/project-types";

/**
 * Parts included in hardwood yard stick packing, board-foot groups, and transport packing.
 * Case back is often sheet goods; omit it when you buy plywood separately.
 */
export function partsForHardwoodYardCutList(project: Project): Part[] {
  if (!project.omitDresserCaseBackFromHardwoodCutList) return project.parts;
  return project.parts.filter((p) => !(p.assembly === "Back" && p.name === "Case back"));
}
