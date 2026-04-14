"use client";

import { useCallback, type KeyboardEvent, type ReactNode } from "react";
import type { ValidationIssue } from "@/lib/validation/types";

export const APP_SHELL_TAB_IDS = ["setup", "build", "shop", "about"] as const;
export type AppShellTabId = (typeof APP_SHELL_TAB_IDS)[number];

const TAB_META: Record<AppShellTabId, { label: string; task: string }> = {
  setup: { label: "Setup", task: "Set project defaults" },
  build: { label: "Build", task: "Define intent" },
  shop: { label: "Materials", task: "Validate procurement" },
  about: { label: "Review", task: "Release to shop" },
};

function focusTabButton(id: AppShellTabId) {
  document.getElementById(`tab-${id}`)?.focus();
}

/**
 * IA shell: Setup (project + transport), Build (planners only), Materials (two-column shop), About.
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

  const handleTabListKeyDown = useCallback(
    (e: KeyboardEvent<HTMLDivElement>) => {
      const el = document.activeElement;
      if (!el || el.getAttribute("role") !== "tab" || !el.id.startsWith("tab-")) return;
      const raw = el.id.slice("tab-".length);
      if (!APP_SHELL_TAB_IDS.includes(raw as AppShellTabId)) return;
      const currentId = raw as AppShellTabId;
      const idx = APP_SHELL_TAB_IDS.indexOf(currentId);
      let nextIdx = idx;

      if (e.key === "ArrowRight" || e.key === "ArrowDown") {
        e.preventDefault();
        nextIdx = (idx + 1) % APP_SHELL_TAB_IDS.length;
      } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
        e.preventDefault();
        nextIdx = (idx - 1 + APP_SHELL_TAB_IDS.length) % APP_SHELL_TAB_IDS.length;
      } else if (e.key === "Home") {
        e.preventDefault();
        nextIdx = 0;
      } else if (e.key === "End") {
        e.preventDefault();
        nextIdx = APP_SHELL_TAB_IDS.length - 1;
      }

      if (nextIdx !== idx) {
        const nextId = APP_SHELL_TAB_IDS[nextIdx];
        onChange(nextId);
        requestAnimationFrame(() => focusTabButton(nextId));
      }
    },
    [onChange]
  );

  return (
    <div className="space-y-6">
      <div className="gl-stepper-shell" aria-label="Guided sequence progress">
        <ol className="flex flex-wrap gap-1.5" aria-label="Guided sequence steps">
          {APP_SHELL_TAB_IDS.map((id, idx) => {
            const isCurrent = id === active;
            const isComplete = idx < activeStepIndex;
            return (
              <li
                key={id}
                className={`rounded-full border px-2.5 py-0.5 text-xs ${
                  isCurrent
                    ? "border-[var(--gl-accent)] bg-[color-mix(in_srgb,var(--gl-accent)_12%,var(--gl-surface))] text-[var(--gl-text-soft)]"
                    : isComplete
                      ? "border-[var(--gl-border)] bg-[var(--gl-surface)] text-[var(--gl-muted)]"
                      : "border-[var(--gl-border)] text-[var(--gl-muted)]/90"
                }`}
                aria-current={isCurrent ? "step" : undefined}
              >
                {idx + 1}. {TAB_META[id].label}
              </li>
            );
          })}
        </ol>
        <p className="mt-1.5 text-xs text-[var(--gl-muted)]/90">
          {remaining.length > 0 ? `Remaining: ${remaining.join(" -> ")}` : "Final step reached."}
        </p>
      </div>

      <div
        role="tablist"
        aria-label="Main sections"
        className="flex flex-wrap gap-2 border-b border-[var(--gl-border)] pb-4"
        onKeyDown={handleTabListKeyDown}
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
                  ? "border-[var(--gl-border-strong)] bg-[var(--gl-surface-muted)] text-[var(--gl-cream)]"
                  : "border-transparent bg-transparent text-[var(--gl-muted)] hover:border-[var(--gl-border)] hover:text-[var(--gl-cream-soft)]"
              }`}
            >
              <span className="block">{TAB_META[id].label}</span>
              <span className="block text-xs font-normal text-[var(--gl-muted)]">{TAB_META[id].task}</span>
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
            <div className="min-w-0 space-y-6">{buildLeft}</div>
          </div>
        ) : (
          <div className="space-y-6">
            {decisionStrip}
            <div className="gl-panel-muted p-4 text-sm text-[var(--gl-muted)]">
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
                <ul className="mt-2 list-disc space-y-1 pl-5 text-xs text-[var(--gl-warning)]">
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
