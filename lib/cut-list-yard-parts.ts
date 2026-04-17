import type { Part, Project } from "@/lib/project-types";

/** Drawer bottoms are sheet goods; keep them out of hardwood stick / BF yard math. */
export function isDrawerBottomPlywoodExcludedFromHardwoodYard(part: Part): boolean {
  return (
    part.assembly === "Drawers" &&
    part.material.label === "Drawer bottom (ply / hardboard)" &&
    part.material.thicknessCategory === "1/4 ply"
  );
}

/**
 * Parts included in hardwood yard stick packing, board-foot groups, and transport packing.
 * Drawer bottoms (ply / hardboard) are always excluded. Case back is optional when you buy ply separately.
 */
export function partsForHardwoodYardCutList(project: Project): Part[] {
  return project.parts.filter((p) => {
    if (isDrawerBottomPlywoodExcludedFromHardwoodYard(p)) return false;
    if (project.omitDresserCaseBackFromHardwoodCutList && p.assembly === "Back" && p.name === "Case back") {
      return false;
    }
    return true;
  });
}
