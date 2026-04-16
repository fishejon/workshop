import type { Project } from "@/lib/project-types";
import type { CaseOutlineV0 } from "@/lib/geometry/types";
import { inferDresserCaseOutlineFromParts } from "@/lib/geometry/infer-dresser-outline";

/**
 * Derives a read-only dresser schematic outline from saved parts (optional `project.geometry` is unused here).
 */
export function buildCaseOutlineFromProject(project: Project): CaseOutlineV0 | null {
  return inferDresserCaseOutlineFromParts(project.parts);
}
