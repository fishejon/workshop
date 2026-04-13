"use client";

import type { ReactNode } from "react";

export const APP_SHELL_TAB_IDS = ["setup", "build", "shop", "about"] as const;
export type AppShellTabId = (typeof APP_SHELL_TAB_IDS)[number];

const TAB_LABELS: Record<AppShellTabId, string> = {
  setup: "Setup",
  build: "Build",
  shop: "Shop",
  about: "About",
};

/**
 * IA shell: Setup (project + transport), Build (planners + shop column), Shop (shop column only), About.
 * Uses one `shopAside` mount so parts/buy state stays unified while tabs change layout.
 */
export function AppShellTabs({
  active,
  onChange,
  setupPanel,
  buildLeft,
  shopAside,
  aboutPanel,
}: {
  active: AppShellTabId;
  onChange: (id: AppShellTabId) => void;
  setupPanel: ReactNode;
  buildLeft: ReactNode;
  shopAside: ReactNode;
  aboutPanel: ReactNode;
}) {
  return (
    <div className="space-y-6">
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
            <aside className="min-w-0 space-y-6 lg:sticky lg:top-6">{shopAside}</aside>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="rounded-xl border border-white/10 bg-black/20 p-4 text-sm text-[var(--gl-muted)]">
              <p>
                Parts list, buy list, joinery, and rough-stick layout. Project name, milling allowance, transport cap,
                and waste % live under <strong className="text-[var(--gl-cream-soft)]">Setup</strong>. Export CSV from
                the parts header, or open{" "}
                <a
                  href="/print"
                  className="font-medium text-[var(--gl-copper-bright)] underline-offset-2 hover:underline"
                >
                  shop print
                </a>{" "}
                for a paper-friendly sheet.
              </p>
            </div>
            <div className="mx-auto w-full max-w-[min(100%,480px)] space-y-6">{shopAside}</div>
          </div>
        )}
      </div>
    </div>
  );
}
