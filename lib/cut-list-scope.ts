import type { Project, ProjectJoint } from "@/lib/project-types";

/**
 * When false, the main app cut list, CSV, print, and validation ignore `project.joints`.
 * `/labs` still mutates joints for experiments; re-enable here to fold joinery back into the product path.
 */
export const CUT_LIST_JOINERY_ENABLED = false;

export function jointsEffectiveForCutList(project: Project): ProjectJoint[] {
  if (CUT_LIST_JOINERY_ENABLED) return project.joints;
  return [];
}

/** Export / print gate: material assumptions only (joinery lives in labs). */
export function cutListExportCheckpointsReady(project: Project): boolean {
  return project.checkpoints.materialAssumptionsReviewed;
}
