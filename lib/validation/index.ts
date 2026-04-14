import type { Project } from "@/lib/project-types";
import { collectJoineryConflictIssues } from "@/lib/validation/joinery-conflicts";
import { collectSanityValidationIssues } from "@/lib/validation/sanity-checks";
import type { ValidationIssue, ValidationIssueDraft } from "@/lib/validation/types";

function makeIssueId(draft: ValidationIssueDraft): string {
  const part = draft.partId ?? "none";
  const rules = (draft.ruleIds ?? []).slice().sort().join(",");
  return `${draft.source}:${draft.code}:${part}:${rules}:${draft.message}`;
}

function sortIssues(issues: ValidationIssue[]): ValidationIssue[] {
  const severityOrder: Record<ValidationIssue["severity"], number> = { high: 0, warning: 1 };
  return [...issues].sort((a, b) => {
    return (
      severityOrder[a.severity] - severityOrder[b.severity] ||
      a.code.localeCompare(b.code) ||
      (a.partId ?? "").localeCompare(b.partId ?? "") ||
      a.message.localeCompare(b.message)
    );
  });
}

function dedupeIssues(drafts: ValidationIssueDraft[]): ValidationIssue[] {
  const map = new Map<string, ValidationIssue>();
  for (const draft of drafts) {
    const id = makeIssueId(draft);
    if (map.has(id)) continue;
    map.set(id, { ...draft, id });
  }
  return sortIssues([...map.values()]);
}

export function validateProject(project: Project): ValidationIssue[] {
  return dedupeIssues([...collectSanityValidationIssues(project), ...collectJoineryConflictIssues(project)]);
}

export function getBlockingValidationIssues(issues: ValidationIssue[]): ValidationIssue[] {
  return issues.filter((issue) => issue.severity === "high");
}

export function getWarningValidationIssues(issues: ValidationIssue[]): ValidationIssue[] {
  return issues.filter((issue) => issue.severity === "warning");
}

export function canExportOrPrintProject(checkpointsReady: boolean, issues: ValidationIssue[]): boolean {
  return checkpointsReady && getBlockingValidationIssues(issues).length === 0;
}
