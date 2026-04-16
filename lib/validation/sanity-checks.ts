import type { Project } from "@/lib/project-types";
import type { ValidationIssueDraft } from "@/lib/validation/types";

const EPSILON = 1e-6;

function parseDrawerOpeningDimensions(note: string): { width: number; height: number } | null {
  const match = /opening\s+([0-9]+(?:\.[0-9]+)?)\s*[×x]\s*([0-9]+(?:\.[0-9]+)?)/i.exec(note);
  if (!match) return null;
  const width = Number.parseFloat(match[1] ?? "");
  const height = Number.parseFloat(match[2] ?? "");
  if (!Number.isFinite(width) || !Number.isFinite(height)) return null;
  return { width, height };
}

export type SanityValidationOptions = {
  /** Mortise/tenon length checks keyed off `project.joints`. Off for cut-list-only validation. */
  includeJoinerySanity?: boolean;
};

export function collectSanityValidationIssues(
  project: Project,
  options: SanityValidationOptions = {}
): ValidationIssueDraft[] {
  const { includeJoinerySanity = true } = options;
  const issues: ValidationIssueDraft[] = [];

  for (const part of project.parts) {
    const partLabel = part.name.trim() || "Unnamed part";

    if (part.rough.t + EPSILON < part.finished.t) {
      issues.push({
        severity: "high",
        code: "rough_less_than_finished",
        message: `${partLabel}: rough thickness is smaller than finished thickness.`,
        partId: part.id,
        source: "sanity",
      });
    }
    if (part.rough.w + EPSILON < part.finished.w) {
      issues.push({
        severity: "high",
        code: "rough_less_than_finished",
        message: `${partLabel}: rough width is smaller than finished width.`,
        partId: part.id,
        source: "sanity",
      });
    }
    if (part.rough.l + EPSILON < part.finished.l) {
      issues.push({
        severity: "high",
        code: "rough_less_than_finished",
        message: `${partLabel}: rough length is smaller than finished length.`,
        partId: part.id,
        source: "sanity",
      });
    }

    if (part.name.toLowerCase().includes("drawer box")) {
      const opening = parseDrawerOpeningDimensions(part.grainNote);
      if (opening) {
        if (opening.width <= 0 || opening.height <= 0 || part.finished.w <= 0 || part.finished.l <= 0) {
          issues.push({
            severity: "high",
            code: "invalid_opening_budget",
            message: `${partLabel}: opening or drawer box dimensions are non-positive; check opening budgets and clearances.`,
            partId: part.id,
            source: "sanity",
          });
        }
        if (part.finished.w > opening.width + EPSILON) {
          issues.push({
            severity: "high",
            code: "drawer_box_wider_than_opening",
            message: `${partLabel}: drawer box width (${part.finished.w.toFixed(3)}") exceeds opening width (${opening.width.toFixed(3)}").`,
            partId: part.id,
            source: "sanity",
          });
        }
      }
    }
  }

  if (!includeJoinerySanity) {
    return issues;
  }

  for (const joint of project.joints) {
    if (joint.ruleId !== "mortise_tenon_rail" && joint.ruleId !== "mortise_tenon_stile") continue;
    const tenonLength = joint.params.tenonLengthPerEnd;
    if (!Number.isFinite(tenonLength) || tenonLength < 0) continue;
    const totalTenon = tenonLength * 2;
    if (totalTenon + EPSILON >= joint.finishedBefore.l) {
      issues.push({
        severity: "high",
        code: "tenon_too_long_for_part",
        message: `Joinery ${joint.ruleId}: total tenon length (${totalTenon.toFixed(3)}") is not valid for part length (${joint.finishedBefore.l.toFixed(3)}").`,
        partId: joint.primaryPartId,
        ruleIds: [joint.ruleId],
        source: "sanity",
      });
    }
  }

  return issues;
}
