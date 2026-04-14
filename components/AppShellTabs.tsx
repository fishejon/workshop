"use client";

import type { ReactNode } from "react";
import type { ValidationIssue } from "@/lib/validation/types";

export const APP_SHELL_TAB_IDS = ["setup", "build", "shop", "about"] as const;
export type AppShellTabId = (typeof APP_SHELL_TAB_IDS)[number];

const TAB_META: Record<AppShellTabId, { label: string; task: string }> = {
  setup: { label: "Setup", task: "Set project defaults" },
  build: { label: "Build", task: "Define intent" },
  shop: { label: "Materials", task: "Validate procurement" },
  about: { label: "Review", task: "Release to shop" },
};

/**
 * IA shell: Setup (project + transport), Build (planners + shop column), Shop (two-column shop), About.
 * `shopMaterialsLeft` / `shopMaterialsRight` are the same panels as the Build aside, split for Materials’ wide grid.
 */
export function AppShellTabs({
  active,
  onChange,
  setupPanel,
  issuesPanel,
  buildLeft,
  shopMaterialsLeft,
  shopMaterialsRight,
  aboutPanel,
  canExportOrPrint,
  blockingValidationIssues,
  decisionStrip,
}: {
  active: AppShellTabId;
  onChange: (id: AppShellTabId) => void;
  setupPanel: ReactNode;
  issuesPanel: ReactNode;
  buildLeft: ReactNode;
  shopMaterialsLeft: ReactNode;
  shopMaterialsRight: ReactNode;
  aboutPanel: ReactNode;
  canExportOrPrint: boolean;
  blockingValidationIssues: ValidationIssue[];
  decisionStrip: ReactNode;
}) {
  const activeStepIndex = APP_SHELL_TAB_IDS.indexOf(active);
  const remaining = APP_SHELL_TAB_IDS.slice(activeStepIndex + 1).map((id) => TAB_META[id].label);

  return (
    <div className="space-y-6">
      <div
        className="rounded-xl border border-white/10 bg-white/[0.03] p-3"
        aria-label="Guided sequence progress"
      >
        <ol className="flex flex-wrap gap-2" aria-label="Guided sequence steps">
          {APP_SHELL_TAB_IDS.map((id, idx) => {
            const isCurrent = id === active;
            const isComplete = idx < activeStepIndex;
            return (
              <li
                key={id}
                className={`rounded-full border px-3 py-1 text-xs ${
                  isCurrent
                    ? "border-[var(--gl-copper-bright)] bg-[var(--gl-copper)]/20 text-[var(--gl-cream)]"
                    : isComplete
                      ? "border-white/20 bg-white/[0.06] text-[var(--gl-cream-soft)]"
                      : "border-white/10 text-[var(--gl-muted)]"
                }`}
                aria-current={isCurrent ? "step" : undefined}
              >
                {idx + 1}. {TAB_META[id].label}
              </li>
            );
          })}
        </ol>
        <p className="mt-2 text-xs text-[var(--gl-muted)]">
          {remaining.length > 0 ? `Remaining: ${remaining.join(" -> ")}` : "Final step reached."}
        </p>
      </div>

      <div
        role="tablist"
        aria-label="Main sections"
        className="flex flex-wrap gap-2 border-b border-white/10 pb-4"
      >
        {APP_SHELL_TAB_IDS.map((id) => {
          const selected = active === id;
          return (
            <button
              key={id}
              type="button"
              role="tab"
              id={`tab-${id}`}
              aria-selected={selected}
              aria-controls="panel-main"
              tabIndex={selected ? 0 : -1}
              onClick={() => onChange(id)}
              className={`rounded-t-lg border border-b-0 px-4 py-2.5 text-sm font-medium transition ${
                selected
                  ? "border-white/20 bg-white/[0.08] text-[var(--gl-cream)]"
                  : "border-transparent bg-transparent text-[var(--gl-muted)] hover:border-white/10 hover:text-[var(--gl-cream-soft)]"
              }`}
            >
              <span className="block">{TAB_META[id].label}</span>
              <span className="block text-[10px] font-normal text-[var(--gl-muted)]">{TAB_META[id].task}</span>
            </button>
          );
        })}
      </div>

      <div role="tabpanel" id="panel-main" aria-labelledby={`tab-${active}`} className="min-w-0">
        {active === "about" ? (
          aboutPanel
        ) : active === "setup" ? (
          <div className="mx-auto max-w-4xl">{setupPanel}</div>
        ) : active === "build" ? (
          <div className="space-y-6">
            {decisionStrip}
            <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(300px,380px)] lg:items-start">
              <div className="min-w-0 space-y-6">{buildLeft}</div>
              <aside className="min-w-0 space-y-6 lg:sticky lg:top-6">
                <div className="space-y-6">
                  {issuesPanel}
                  {shopMaterialsLeft}
                  {shopMaterialsRight}
                </div>
              </aside>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {decisionStrip}
            <div className="rounded-xl border border-white/10 bg-black/20 p-4 text-sm text-[var(--gl-muted)]">
              <p>
                Validate procurement against your current parts assumptions before release. Export CSV from the parts
                header, or open{" "}
                {canExportOrPrint ? (
                  <a
                    href="/print"
                    className="font-medium text-[var(--gl-copper-bright)] underline-offset-2 hover:underline"
                  >
                    shop print
                  </a>
                ) : (
                  <span className="font-medium text-[var(--gl-muted)]" aria-label="Shop print locked">
                    shop print (locked)
                  </span>
                )}{" "}
                for a paper-friendly sheet.
              </p>
              {!canExportOrPrint && blockingValidationIssues.length > 0 ? (
                <ul className="mt-2 list-disc space-y-1 pl-5 text-xs text-amber-200/90">
                  {blockingValidationIssues.slice(0, 3).map((issue) => (
                    <li key={issue.id}>{issue.message}</li>
                  ))}
                </ul>
              ) : null}
            </div>
            {issuesPanel}
            <div className="grid min-w-0 gap-10 lg:grid-cols-[minmax(0,1.2fr)_minmax(300px,380px)] lg:items-start">
              <div className="min-w-0 space-y-6">{shopMaterialsLeft}</div>
              <aside className="min-w-0 space-y-6 lg:sticky lg:top-6">{shopMaterialsRight}</aside>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
