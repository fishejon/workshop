"use client";

import type { AppShellTabId } from "@/components/AppShellTabs";

const FLOW: { id: AppShellTabId; title: string; blurb: string }[] = [
  { id: "setup", title: "Project", blurb: "Name, milling allowance, transport, max board stock, waste." },
  { id: "build", title: "Plan", blurb: "Pick a preset and enter intent." },
  { id: "shop", title: "Materials", blurb: "Cut list and rough-stick layout." },
];

type WorkshopFlowGuideProps = {
  active: AppShellTabId;
  onGoTo: (tab: AppShellTabId) => void;
  projectName: string;
  partCount: number;
  materialAssumptionsReviewed: boolean;
  canExportOrPrint: boolean;
};

function CheckRow({ done, label, detail }: { done: boolean; label: string; detail?: string }) {
  return (
    <li className="flex gap-2 text-sm text-[var(--gl-cream-soft)]">
      <span
        className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border text-xs font-semibold ${
          done
            ? "border-[var(--gl-success)] bg-[var(--gl-success-bg)] text-[var(--gl-success)]"
            : "border-[var(--gl-border)] bg-[var(--gl-surface-inset)] text-[var(--gl-muted)]"
        }`}
        aria-hidden
      >
        {done ? "✓" : ""}
      </span>
      <span>
        <span className={done ? "text-[var(--gl-cream)]" : ""}>{label}</span>
        {detail ? <span className="mt-0.5 block text-xs text-[var(--gl-muted)]">{detail}</span> : null}
      </span>
    </li>
  );
}

export function WorkshopFlowGuide({
  active,
  onGoTo,
  projectName,
  partCount,
  materialAssumptionsReviewed,
  canExportOrPrint,
}: WorkshopFlowGuideProps) {
  const named = projectName.trim().length > 0;
  const hasParts = partCount > 0;

  return (
    <section
      className="gl-panel-muted border border-[var(--gl-border)] p-4 sm:p-5"
      aria-labelledby="workshop-flow-title"
    >
      <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 id="workshop-flow-title" className="text-sm font-semibold text-[var(--gl-cream)]">
            Workshop flow
          </h2>
          <p className="mt-1 max-w-3xl text-xs leading-relaxed text-[var(--gl-muted)]">
            Work left to right through the tabs. Project sets defaults, Plan defines intent, and Materials shows the
            generated cut list and rough-stick layout.
          </p>
        </div>
      </div>

      <ol className="mt-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:gap-2" aria-label="Main steps">
        {FLOW.map((step, idx) => {
          const isCurrent = step.id === active;
          return (
            <li key={step.id} className="min-w-0 flex-1 sm:min-w-[10rem] sm:flex-none">
              <button
                type="button"
                onClick={() => onGoTo(step.id)}
                className={`w-full rounded-xl border px-3 py-2.5 text-left text-sm transition ${
                  isCurrent
                    ? "border-[var(--gl-accent)] bg-[color-mix(in_srgb,var(--gl-accent)_14%,var(--gl-surface))] text-[var(--gl-cream)]"
                    : "border-[var(--gl-border)] bg-[var(--gl-surface)] text-[var(--gl-muted)] hover:border-[var(--gl-border-strong)] hover:text-[var(--gl-cream-soft)]"
                }`}
                aria-current={isCurrent ? "step" : undefined}
              >
                <span className="text-xs font-medium text-[var(--gl-muted)]">
                  {idx + 1}. {step.title}
                </span>
                <span className="mt-0.5 block text-xs leading-snug text-[var(--gl-muted)]">{step.blurb}</span>
              </button>
            </li>
          );
        })}
      </ol>

      <details className="mt-4 rounded-xl border border-[var(--gl-border)] bg-[var(--gl-surface)] px-3 py-2 sm:px-4 sm:py-3">
        <summary className="cursor-pointer text-sm font-medium text-[var(--gl-cream-soft)]">
          Woodworker readiness checklist
        </summary>
        <p className="mt-2 text-xs text-[var(--gl-muted)]">
          Use this as a sanity check before you rely on outputs in the shop. Checked items reflect this project&apos;s
          current state in the browser (not a legal sign-off).
        </p>
        <ul className="mt-3 space-y-2.5">
          <CheckRow
            done={named}
            label="Project has a clear name"
            detail="Helps backups, CSV filename, and print header."
          />
          <CheckRow
            done={hasParts}
            label="Cut list has at least one row"
            detail="Generate from a Plan preset or add rows manually on Cut list."
          />
          <CheckRow
            done={materialAssumptionsReviewed}
            label="Material assumptions acknowledged (Review tab)"
            detail="Rough sizes, thickness category, waste, transport limits."
          />
          <CheckRow
            done={canExportOrPrint}
            label="Export / shop print unlocked"
            detail="Requires material checkpoint and no blocking validation issues."
          />
        </ul>
        <p className="mt-3 text-xs text-[var(--gl-muted)]">
          Longer reference: <code className="text-[var(--gl-cream-soft)]">docs/WOODWORKER_CHECKLIST.md</code> ·
          cohesion plan: <code className="text-[var(--gl-cream-soft)]">docs/plans/cohesion-woodworker-readiness.md</code>
        </p>
      </details>
    </section>
  );
}
