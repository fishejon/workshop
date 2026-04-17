"use client";

import { useState } from "react";

type AppNavDrawerProps = {
  /** Saved projects in this browser (home surface). */
  onGoToProjects: () => void;
  /** Blank project + preset picker entry. */
  onNewProject: () => void;
};

export function AppNavDrawer({ onGoToProjects, onNewProject }: AppNavDrawerProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        aria-label="Open navigation menu"
        aria-expanded={open}
        onClick={() => setOpen(true)}
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-[var(--gl-border-strong)] bg-[var(--gl-surface-muted)] text-[var(--gl-cream)] transition hover:border-[var(--gl-copper-bright)]/50 hover:bg-[var(--gl-surface)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--gl-copper-bright)]"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
          <path d="M4 6h16M4 12h16M4 18h16" strokeLinecap="round" />
        </svg>
      </button>

      {open ? (
        <div
          className="fixed inset-0 z-[70] flex justify-start bg-black/40 backdrop-blur-[2px]"
          role="presentation"
          onClick={() => setOpen(false)}
        >
          <nav
            className="flex h-full w-full max-w-xs flex-col border-r border-[var(--gl-border)] bg-[var(--gl-surface)] shadow-2xl"
            role="dialog"
            aria-modal="true"
            aria-label="Main navigation"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-[var(--gl-border)] px-4 py-3">
              <p className="text-xs font-medium tracking-widest text-[var(--gl-muted)] uppercase">Menu</p>
              <button
                type="button"
                className="rounded-md border border-[var(--gl-border)] px-2 py-1 text-xs text-[var(--gl-muted)] hover:text-[var(--gl-cream)]"
                onClick={() => setOpen(false)}
              >
                Close
              </button>
            </div>
            <div className="flex flex-col gap-1 p-3">
              <button
                type="button"
                className="rounded-lg border border-transparent bg-transparent px-3 py-2.5 text-left text-sm text-[var(--gl-cream)] hover:bg-[var(--gl-surface-muted)] active:bg-[var(--gl-surface-muted)]"
                onClick={() => {
                  onGoToProjects();
                  setOpen(false);
                }}
              >
                <span className="block font-medium">Projects</span>
                <span className="mt-0.5 block text-xs text-[var(--gl-muted)]">Open your saved projects in this browser</span>
              </button>
              <button
                type="button"
                className="rounded-lg border border-transparent bg-transparent px-3 py-2.5 text-left text-sm font-medium text-[var(--gl-cream)] hover:bg-[var(--gl-surface-muted)] active:bg-[var(--gl-surface-muted)]"
                onClick={() => {
                  onNewProject();
                  setOpen(false);
                }}
              >
                New project
                <span className="mt-0.5 block text-xs font-normal text-[var(--gl-muted)]">
                  Start fresh and pick what you are building
                </span>
              </button>
            </div>
          </nav>
        </div>
      ) : null}
    </>
  );
}
