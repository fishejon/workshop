"use client";

import { useCallback, type KeyboardEvent, type ReactNode } from "react";
import type { ValidationIssue } from "@/lib/validation/types";

export const APP_SHELL_TAB_IDS = ["setup", "build", "shop", "about"] as const;
export type AppShellTabId = (typeof APP_SHELL_TAB_IDS)[number];

const TAB_META: Record<AppShellTabId, { label: string; task: string }> = {
  setup: { label: "Project", task: "Name & shop defaults" },
  build: { label: "Plan", task: "Presets & parts" },
  shop: { label: "Cut list", task: "Parts & lumber" },
  about: { label: "Review", task: "Checklist & print" },
};

function focusTabButton(id: AppShellTabId) {
  document.getElementById(`tab-${id}`)?.focus();
}

/**
 * Option A shell: Project, Plan, Cut list (single column + buy list disclosure), Review.
 */
export function AppShellTabs({
  active,
  onChange,
  setupPanel,
  issuesPanel,
  planPanel,
  cutListPartsTable,
  cutListBuyListPanel,
  aboutPanel,
  blockingValidationIssues,
  decisionStrip,
}: {
  active: AppShellTabId;
  onChange: (id: AppShellTabId) => void;
  setupPanel: ReactNode;
  issuesPanel: ReactNode;
  planPanel: ReactNode;
  cutListPartsTable: ReactNode;
  cutListBuyListPanel: ReactNode;
  aboutPanel: ReactNode;
  blockingValidationIssues: ValidationIssue[];
  decisionStrip: ReactNode;
}) {
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
      <div
        role="tablist"
        aria-label="Main sections"
        className="flex flex-wrap gap-2 border-b border-[var(--gl-border)] pb-4"
        onKeyDown={handleTabListKeyDown}
      >
        {APP_SHELL_TAB_IDS.map((id) => {
          const selected = id === active;
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
            <div className="min-w-0 space-y-6">{planPanel}</div>
          </div>
        ) : (
          <div className="space-y-6">
            {decisionStrip}
            <details className="gl-panel-muted p-4">
              <summary className="cursor-pointer text-sm font-medium text-[var(--gl-cream-soft)]">
                Show validation issues
              </summary>
              <div className="mt-3">{issuesPanel}</div>
            </details>
            {blockingValidationIssues.length > 0 ? (
              <ul
                className="list-disc space-y-1 pl-5 text-xs text-[var(--gl-warning)]"
                aria-label="Blocking issues summary"
              >
                {blockingValidationIssues.slice(0, 4).map((issue) => (
                  <li key={issue.id}>{issue.message}</li>
                ))}
              </ul>
            ) : null}
            <div className="min-w-0 space-y-4">
              {cutListPartsTable}
              <details className="gl-panel border border-[var(--gl-border)] p-4">
                <summary className="cursor-pointer text-sm font-medium text-[var(--gl-cream-soft)]">
                  Lumber & buy list
                </summary>
                <p className="mt-2 text-xs text-[var(--gl-muted)]">
                  Board feet, purchase scenarios, and stock-width helpers. Use{" "}
                  <span className="font-medium text-[var(--gl-cream-soft)]">Export CSV</span> on the cut list table
                  when Review unlocks export.
                </p>
                <div className="mt-4">{cutListBuyListPanel}</div>
              </details>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
