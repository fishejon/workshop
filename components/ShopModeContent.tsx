"use client";

import Link from "next/link";
import { useProject } from "@/components/ProjectContext";
import { cutListExportCheckpointsReady } from "@/lib/cut-list-scope";
import { canExportOrPrintProject, getBlockingValidationIssues, validateProject } from "@/lib/validation";
import { validationIssueWhereHint } from "@/lib/validation/issue-action-hint";

/**
 * Large-type at-a-glance view for bench / phone (`/shop`). Read-only; editing stays on the main planner.
 */
export function ShopModeContent() {
  const { project } = useProject();
  const issues = validateProject(project);
  const blocking = getBlockingValidationIssues(issues);
  const checkpointsReady = cutListExportCheckpointsReady(project);
  const canPrint = canExportOrPrintProject(checkpointsReady, issues);

  return (
    <div className="mx-auto max-w-2xl space-y-8 px-4 py-10 sm:px-6">
      <nav className="flex flex-wrap gap-4 text-lg">
        <Link href="/" className="text-[var(--gl-copper-bright)] underline underline-offset-4">
          Full planner
        </Link>
        <Link href="/print" className="text-[var(--gl-copper-bright)] underline underline-offset-4">
          Shop print
        </Link>
        <Link href="/labs" className="text-[var(--gl-copper-bright)] underline underline-offset-4">
          Labs
        </Link>
      </nav>

      <header className="space-y-2">
        <p className="text-sm font-semibold uppercase tracking-widest text-[var(--gl-muted)]">Shop mode</p>
        <h1 className="font-display text-4xl leading-tight text-[var(--gl-cream)] sm:text-5xl">{project.name}</h1>
        <p className="text-xl text-[var(--gl-muted)]">
          {project.parts.length} part{project.parts.length === 1 ? "" : "s"} on cut list
        </p>
      </header>

      <section className="rounded-2xl border border-[var(--gl-border)] bg-[var(--gl-surface)] p-6" aria-labelledby="shop-status">
        <h2 id="shop-status" className="text-2xl font-semibold text-[var(--gl-cream)]">
          Export &amp; print
        </h2>
        <p className="mt-3 text-lg text-[var(--gl-muted)]">
          Material assumptions:{" "}
          <strong className="text-[var(--gl-cream-soft)]">
            {project.checkpoints.materialAssumptionsReviewed ? "Done" : "Not checked — use Materials on planner"}
          </strong>
        </p>
        <p className="mt-2 text-lg text-[var(--gl-muted)]">
          Status:{" "}
          <strong className={canPrint ? "text-[var(--gl-accent)]" : "text-[var(--gl-warning)]"}>
            {canPrint ? "Ready for CSV / print" : "Blocked"}
          </strong>
        </p>
      </section>

      {blocking.length > 0 ? (
        <section className="rounded-2xl border border-[color-mix(in_srgb,var(--gl-danger)_35%,var(--gl-border))] bg-[var(--gl-danger-bg)] p-6">
          <h2 className="text-2xl font-semibold text-[var(--gl-danger)]">Blocking ({blocking.length})</h2>
          <ul className="mt-4 space-y-4">
            {blocking.map((issue) => (
              <li key={issue.id} className="text-lg text-[var(--gl-danger)]">
                <p>{issue.message}</p>
                <p className="mt-1 text-base text-[var(--gl-muted)]">{validationIssueWhereHint(issue)}</p>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <p className="text-base text-[var(--gl-muted)]">
        This page is read-only. Change dimensions, assumptions, and parts on the main planner, then return here for a
        quick status readout at the bench.
      </p>
    </div>
  );
}
