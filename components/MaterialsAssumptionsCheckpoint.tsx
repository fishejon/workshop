"use client";

import { useProject } from "@/components/ProjectContext";

/**
 * Acknowledgment gate for CSV + shop print (`cutListExportCheckpointsReady` in `lib/cut-list-scope.ts`).
 * Lives at the top of the Materials tab so users confirm after seeing yard list and parts.
 */
export function MaterialsAssumptionsCheckpoint() {
  const { project, setCheckpointReviewed } = useProject();
  const checked = project.checkpoints.materialAssumptionsReviewed;

  return (
    <section
      id="material-assumptions-section"
      className="rounded-xl border border-[var(--gl-border)] bg-[var(--gl-surface-muted)] p-4"
      aria-labelledby="material-assumptions-title"
    >
      <h2 id="material-assumptions-title" className="text-sm font-semibold text-[var(--gl-cream)]">
        Material assumptions
      </h2>
      <p className="mt-1 text-xs leading-relaxed text-[var(--gl-muted)]">
        Check this after you have reviewed the yard list and cut list. It unlocks{" "}
        <strong className="text-[var(--gl-cream-soft)]">Export CSV</strong> and{" "}
        <strong className="text-[var(--gl-cream-soft)]">Print shop sheet</strong> when there are no blocking validation
        issues.
      </p>
      <label className="mt-3 flex cursor-pointer items-start gap-2 text-sm text-[var(--gl-cream-soft)]">
        <input
          type="checkbox"
          className="mt-0.5"
          checked={checked}
          onChange={(e) => setCheckpointReviewed("materialAssumptionsReviewed", e.target.checked)}
          aria-describedby="material-assumptions-title"
        />
        <span>
          I have reviewed rough vs finished sizes, material labels, thickness category, waste factor, and transport
          limits for this cut list.
        </span>
      </label>
    </section>
  );
}
