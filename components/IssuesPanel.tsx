"use client";

import { useMemo } from "react";
import { useProject } from "@/components/ProjectContext";
import { prefersReducedMotion } from "@/lib/motion-preference";
import type { ValidationIssue } from "@/lib/validation/types";

const ISSUE_FALLBACK_TARGETS: Record<ValidationIssue["source"], { anchorId: string; label: string }> = {
  sanity: { anchorId: "parts-table-section", label: "Parts table" },
  joinery: { anchorId: "joinery-panel-section", label: "Joinery panel" },
};

const ISSUE_CODE_TARGETS: Partial<
  Record<ValidationIssue["code"], { anchorId: string; label: string }>
> = {
  rough_less_than_finished: { anchorId: "parts-table-section", label: "Parts table" },
  invalid_opening_budget: { anchorId: "build-planner-section", label: "Build planner" },
  drawer_box_wider_than_opening: { anchorId: "build-planner-section", label: "Build planner" },
  tenon_too_long_for_part: { anchorId: "joinery-panel-section", label: "Joinery panel" },
  joinery_axis_direction_conflict: { anchorId: "joinery-panel-section", label: "Joinery panel" },
  joinery_repeated_axis_adjustment: { anchorId: "joinery-panel-section", label: "Joinery panel" },
};

function getIssueTarget(issue: ValidationIssue): { anchorId: string; label: string } {
  if (issue.partId) {
    return { anchorId: `part-row-${issue.partId}`, label: "Affected part row" };
  }
  return ISSUE_CODE_TARGETS[issue.code] ?? ISSUE_FALLBACK_TARGETS[issue.source];
}

function jumpToAnchor(anchorId: string) {
  const target = document.getElementById(anchorId);
  if (!target) return;
  if (!target.hasAttribute("tabindex")) {
    target.setAttribute("tabindex", "-1");
  }
  target.scrollIntoView({
    behavior: prefersReducedMotion() ? "auto" : "smooth",
    block: "center",
  });
  target.focus({ preventScroll: true });
}

export function IssuesPanel({ title = "Issues panel" }: { title?: string }) {
  const { blockingValidationIssues, warningValidationIssues } = useProject();
  const hasIssues = blockingValidationIssues.length > 0 || warningValidationIssues.length > 0;

  const blockingWithTargets = useMemo(
    () => blockingValidationIssues.map((issue) => ({ issue, target: getIssueTarget(issue) })),
    [blockingValidationIssues]
  );
  const warningWithTargets = useMemo(
    () => warningValidationIssues.map((issue) => ({ issue, target: getIssueTarget(issue) })),
    [warningValidationIssues]
  );

  return (
    <section
      className="gl-panel-muted p-4"
      role="region"
      aria-labelledby="issues-panel-title"
      aria-live="polite"
    >
      <h2 id="issues-panel-title" className="text-sm font-semibold text-[var(--gl-cream)]">
        {title}
      </h2>
      <p className="mt-1 text-xs text-[var(--gl-muted)]">
        Blocking: {blockingValidationIssues.length}. Warnings: {warningValidationIssues.length}.
      </p>

      {!hasIssues ? (
        <p className="mt-3 text-xs text-[var(--gl-copper-bright)]">No issues currently detected.</p>
      ) : (
        <div className="mt-3 space-y-3">
          {blockingWithTargets.length > 0 ? (
            <div className="rounded-xl border border-red-300/30 bg-red-500/10 p-3">
              <p className="text-xs font-medium text-red-100">
                Blocking issues ({blockingWithTargets.length})
              </p>
              <ul className="mt-2 space-y-2" aria-label="Blocking issues list">
                {blockingWithTargets.map(({ issue, target }) => (
                  <li key={issue.id} className="rounded border border-white/10 bg-black/20 p-2">
                    <p className="text-xs text-red-100/95">{issue.message}</p>
                    <button
                      type="button"
                      className="mt-1 text-xs font-medium text-[var(--gl-cream-soft)] underline decoration-dotted underline-offset-2 hover:text-[var(--gl-cream)]"
                      onClick={() => jumpToAnchor(target.anchorId)}
                      aria-label={`Jump to ${target.label} for blocking issue`}
                    >
                      Jump to {target.label}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {warningWithTargets.length > 0 ? (
            <div className="rounded-lg border border-amber-300/30 bg-amber-500/10 p-3">
              <p className="text-xs font-medium text-amber-100">Warnings ({warningWithTargets.length})</p>
              <ul className="mt-2 space-y-2" aria-label="Warning issues list">
                {warningWithTargets.map(({ issue, target }) => (
                  <li key={issue.id} className="rounded border border-white/10 bg-black/20 p-2">
                    <p className="text-xs text-amber-100/95">{issue.message}</p>
                    <button
                      type="button"
                      className="mt-1 text-xs font-medium text-[var(--gl-cream-soft)] underline decoration-dotted underline-offset-2 hover:text-[var(--gl-cream)]"
                      onClick={() => jumpToAnchor(target.anchorId)}
                      aria-label={`Jump to ${target.label} for warning`}
                    >
                      Jump to {target.label}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      )}
    </section>
  );
}
