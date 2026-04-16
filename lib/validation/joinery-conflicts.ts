import type { Dimension3, Project } from "@/lib/project-types";
import type { ValidationIssueDraft } from "@/lib/validation/types";

type Axis = keyof Dimension3;

function dimensionDelta(axis: Axis, before: Dimension3, after: Dimension3): number {
  return after[axis] - before[axis];
}

const AXES: Axis[] = ["t", "w", "l"];
const EPSILON = 1e-6;

export function collectJoineryConflictIssues(project: Project): ValidationIssueDraft[] {
  const axisGroups = new Map<string, Array<{ jointId: string; ruleId: string; delta: number; partId: string }>>();

  for (const joint of project.joints) {
    for (const axis of AXES) {
      const delta = dimensionDelta(axis, joint.finishedBefore, joint.finishedAfter);
      if (Math.abs(delta) <= EPSILON) continue;
      const key = `${joint.primaryPartId}:${axis}`;
      const rows = axisGroups.get(key) ?? [];
      rows.push({ jointId: joint.id, ruleId: joint.ruleId, delta, partId: joint.primaryPartId });
      axisGroups.set(key, rows);
    }
  }

  const issues: ValidationIssueDraft[] = [];

  for (const [key, rows] of axisGroups.entries()) {
    if (rows.length < 2) continue;
    const [partId, axis] = key.split(":");
    const positive = rows.some((row) => row.delta > EPSILON);
    const negative = rows.some((row) => row.delta < -EPSILON);
    const ruleIds = [...new Set(rows.map((row) => row.ruleId))];

    if (positive && negative) {
      issues.push({
        severity: "high",
        code: "joinery_axis_direction_conflict",
        message: `Joinery conflict on part ${partId}: axis ${axis.toUpperCase()} has opposing adjustments from multiple rules.`,
        partId,
        ruleIds,
        source: "joinery",
      });
      continue;
    }

    if (ruleIds.length > 1 || rows.length > 1) {
      issues.push({
        severity: "warning",
        code: "joinery_repeated_axis_adjustment",
        message: `Joinery warning on part ${partId}: axis ${axis.toUpperCase()} is adjusted repeatedly (${rows.length} changes).`,
        partId,
        ruleIds,
        source: "joinery",
      });
    }
  }

  return issues;
}
