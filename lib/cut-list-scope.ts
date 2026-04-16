import { isMainPathJoineryEnabled } from "@/lib/main-path-joinery-flag";
import type { Project, ProjectJoint } from "@/lib/project-types";

/**
 * When `NEXT_PUBLIC_GL_MAIN_PATH_JOINERY=1`, the cut list, CSV, print, and `derivePartAssumptionsDetailed` use
 * `project.joints` the same way validation runs in `"full"` joinery mode. Default off for trust / gradual rollout.
 */
export function jointsEffectiveForCutList(project: Project): ProjectJoint[] {
  if (isMainPathJoineryEnabled()) return project.joints;
  return [];
}

/** Export / print gate: material assumptions only (joinery lives in labs). */
export function cutListExportCheckpointsReady(project: Project): boolean {
  return project.checkpoints.materialAssumptionsReviewed;
}
