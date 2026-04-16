"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useProject } from "@/components/ProjectContext";
import { prefersReducedMotion } from "@/lib/motion-preference";
import type { ValidationIssue } from "@/lib/validation/types";

type IssueNavTarget =
  | { kind: "anchor"; anchorId: string; label: string }
  | { kind: "labs"; href: string; label: string };

const ISSUE_FALLBACK_TARGETS: Record<ValidationIssue["source"], IssueNavTarget> = {
  sanity: { kind: "anchor", anchorId: "parts-table-section", label: "Materials · parts table" },
  joinery: { kind: "labs", href: "/labs#joinery-panel-section", label: "Labs · Joinery" },
};

const ISSUE_CODE_TARGETS: Partial<Record<ValidationIssue["code"], IssueNavTarget>> = {
  rough_less_than_finished: { kind: "anchor", anchorId: "parts-table-section", label: "Materials · parts table" },
  invalid_opening_budget: { kind: "anchor", anchorId: "build-planner-section", label: "Plan tab · preset" },
  drawer_box_wider_than_opening: { kind: "anchor", anchorId: "build-planner-section", label: "Plan tab · preset" },
  tenon_too_long_for_part: { kind: "labs", href: "/labs#joinery-panel-section", label: "Labs · Joinery" },
  joinery_axis_direction_conflict: { kind: "labs", href: "/labs#joinery-panel-section", label: "Labs · Joinery" },
  joinery_repeated_axis_adjustment: { kind: "labs", href: "/labs#joinery-panel-section", label: "Labs · Joinery" },
};

function getIssueTarget(issue: ValidationIssue): IssueNavTarget {
  if (issue.partId) {
    return { kind: "anchor", anchorId: `part-row-${issue.partId}`, label: "Materials · part row" };
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

  function renderAction(target: IssueNavTarget) {
    if (target.kind === "labs") {
      return (
        <Link
          href={target.href}
          className="mt-1 inline-block text-xs font-medium text-[var(--gl-copper-bright)] underline decoration-dotted underline-offset-2 hover:text-[var(--gl-cream)]"
        >
          Open {target.label}
        </Link>
      );
    }
    return (
      <button
        type="button"
        className="mt-1 text-xs font-medium text-[var(--gl-cream-soft)] underline decoration-dotted underline-offset-2 hover:text-[var(--gl-cream)]"
        onClick={() => jumpToAnchor(target.anchorId)}
        aria-label={`Jump to ${target.label} for issue`}
      >
        Jump to {target.label}
      </button>
    );
  }

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
        <p className="mt-3 text-xs text-[var(--gl-accent)]">No issues currently detected.</p>
      ) : (
        <div className="mt-3 space-y-3">
          {blockingWithTargets.length > 0 ? (
            <div className="rounded-xl border border-[color-mix(in_srgb,var(--gl-danger)_30%,var(--gl-border))] bg-[var(--gl-danger-bg)] p-3">
              <p className="text-xs font-medium text-[var(--gl-danger)]">
                Blocking issues ({blockingWithTargets.length})
              </p>
              <ul className="mt-2 space-y-2" aria-label="Blocking issues list">
                {blockingWithTargets.map(({ issue, target }) => (
                  <li key={issue.id} className="rounded border border-[var(--gl-border)] bg-[var(--gl-surface)] p-2">
                    <p className="text-xs text-[var(--gl-danger)]">{issue.message}</p>
                    {renderAction(target)}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {warningWithTargets.length > 0 ? (
            <div className="rounded-lg border border-[color-mix(in_srgb,var(--gl-warning)_30%,var(--gl-border))] bg-[var(--gl-warning-bg)] p-3">
              <p className="text-xs font-medium text-[var(--gl-warning)]">Warnings ({warningWithTargets.length})</p>
              <ul className="mt-2 space-y-2" aria-label="Warning issues list">
                {warningWithTargets.map(({ issue, target }) => (
                  <li key={issue.id} className="rounded border border-[var(--gl-border)] bg-[var(--gl-surface)] p-2">
                    <p className="text-xs text-[var(--gl-warning)]">{issue.message}</p>
                    {renderAction(target)}
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
