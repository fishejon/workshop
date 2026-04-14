"use client";

import type { ReactNode } from "react";

export const APP_SHELL_TAB_IDS = ["setup", "build", "shop", "about"] as const;
export type AppShellTabId = (typeof APP_SHELL_TAB_IDS)[number];

const TAB_LABELS: Record<AppShellTabId, string> = {
  setup: "Setup",
  build: "Construction",
  shop: "Materials",
  about: "Review",
};

/**
 * IA shell: Setup (project + transport), Build (planners + shop column), Shop (two-column shop), About.
 * `shopMaterialsLeft` / `shopMaterialsRight` are the same panels as the Build aside, split for Materials’ wide grid.
 */
export function AppShellTabs({
  active,
  onChange,
  setupPanel,
  buildLeft,
  shopMaterialsLeft,
  shopMaterialsRight,
  aboutPanel,
  canExportOrPrint,
}: {
  active: AppShellTabId;
  onChange: (id: AppShellTabId) => void;
  setupPanel: ReactNode;
  buildLeft: ReactNode;
  shopMaterialsLeft: ReactNode;
  shopMaterialsRight: ReactNode;
  aboutPanel: ReactNode;
  canExportOrPrint: boolean;
}) {
  const activeStepIndex = APP_SHELL_TAB_IDS.indexOf(active);
  const remaining = APP_SHELL_TAB_IDS.slice(activeStepIndex + 1).map((id) => TAB_LABELS[id]);

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
                {idx + 1}. {TAB_LABELS[id]}
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
              {TAB_LABELS[id]}
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
          <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(300px,380px)] lg:items-start">
            <div className="min-w-0 space-y-6">{buildLeft}</div>
            <aside className="min-w-0 space-y-6 lg:sticky lg:top-6">
              <div className="space-y-6">
                {shopMaterialsLeft}
                {shopMaterialsRight}
              </div>
            </aside>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="rounded-xl border border-white/10 bg-black/20 p-4 text-sm text-[var(--gl-muted)]">
              <p>
                Parts list, buy list, joinery, and rough-stick layout. Project name, milling allowance, transport cap,
                and waste % live under <strong className="text-[var(--gl-cream-soft)]">Setup</strong>. Export CSV from
                the parts header, or open{" "}
                {canExportOrPrint ? (
                  <a
                    href="/print"
                    className="font-medium text-[var(--gl-copper-bright)] underline-offset-2 hover:underline"
                  >
                    shop print
                  </a>
                ) : (
                  <span
                    className="font-medium text-[var(--gl-muted)]"
                    aria-label="Shop print locked until review checkpoints are acknowledged"
                  >
                    shop print (locked until Review)
                  </span>
                )}{" "}
                for a paper-friendly sheet.
              </p>
            </div>
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
