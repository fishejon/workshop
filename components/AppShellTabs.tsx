"use client";

import { useCallback, type KeyboardEvent, type ReactNode } from "react";
import { MaterialsAssumptionsCheckpoint } from "@/components/MaterialsAssumptionsCheckpoint";
import type { ValidationIssue } from "@/lib/validation/types";

export const APP_SHELL_TAB_IDS = ["setup", "build", "shop"] as const;
export type AppShellTabId = (typeof APP_SHELL_TAB_IDS)[number];

const TAB_META: Record<AppShellTabId, { label: string; task: string }> = {
  setup: { label: "Project", task: "Name & shop defaults" },
  build: { label: "Plan", task: "Presets & parts" },
  shop: { label: "Materials", task: "Cut list" },
};

function focusTabButton(id: AppShellTabId) {
  document.getElementById(`tab-${id}`)?.focus();
}

/** Main shell: Project, Plan, Materials (yard list + parts; material assumptions gate export/print). */
export function AppShellTabs({
  active,
  onChange,
  setupPanel,
  planPanel,
  cutListPartsTable,
  blockingValidationIssues,
  decisionStrip,
  disableShopTab = false,
}: {
  active: AppShellTabId;
  onChange: (id: AppShellTabId) => void;
  setupPanel: ReactNode;
  planPanel: ReactNode;
  cutListPartsTable: ReactNode;
  blockingValidationIssues: ValidationIssue[];
  decisionStrip: ReactNode;
  disableShopTab?: boolean;
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
        className="flex flex-wrap gap-2"
        onKeyDown={handleTabListKeyDown}
      >
        {APP_SHELL_TAB_IDS.map((id) => {
          const selected = id === active;
          const disabled = id === "shop" && disableShopTab;
          return (
            <button
              key={id}
              type="button"
              role="tab"
              id={`tab-${id}`}
              aria-selected={selected}
              aria-controls="panel-main"
              aria-disabled={disabled}
              tabIndex={selected ? 0 : -1}
              onClick={() => {
                if (!disabled) onChange(id);
              }}
              className={`rounded-lg border px-4 py-2.5 text-sm font-medium transition ${
                selected
                  ? "border-[var(--gl-border-strong)] bg-[var(--gl-surface-muted)] text-[var(--gl-cream)]"
                  : "border-[var(--gl-border)] bg-transparent text-[var(--gl-muted)] hover:border-[var(--gl-border-strong)] hover:text-[var(--gl-cream-soft)]"
              } ${disabled ? "cursor-not-allowed opacity-50" : ""}`}
            >
              <span className="block">{TAB_META[id].label}</span>
              <span className="block text-xs font-normal text-[var(--gl-muted)]">{TAB_META[id].task}</span>
            </button>
          );
        })}
      </div>

      <div role="tabpanel" id="panel-main" aria-labelledby={`tab-${active}`} className="min-w-0">
        {active === "setup" ? (
          <div className="mx-auto w-full min-w-0 max-w-4xl">{setupPanel}</div>
        ) : active === "build" ? (
          <div className="space-y-6">
            {decisionStrip}
            <div className="min-w-0 space-y-6">{planPanel}</div>
          </div>
        ) : (
          <div className="space-y-6">
            {decisionStrip}
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
              <MaterialsAssumptionsCheckpoint />
              {cutListPartsTable}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
