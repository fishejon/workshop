"use client";

import { useEffect, useState } from "react";
import { useProject } from "@/components/ProjectContext";

export function ProjectWorkspaceBar() {
  const { project, backupCurrentProject } = useProject();
  const [notice, setNotice] = useState("");
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [floatingTopPx, setFloatingTopPx] = useState(16);

  useEffect(() => {
    if (!notice) return;
    const t = window.setTimeout(() => setNotice(""), 3500);
    return () => window.clearTimeout(t);
  }, [notice]);

  useEffect(() => {
    const tabButton = document.getElementById("tab-setup");
    if (tabButton) {
      const y = Math.round(tabButton.getBoundingClientRect().top);
      setFloatingTopPx(Math.max(8, Math.min(y, 220)));
    }
  }, []);

  return (
    <div className="mt-5 border-t border-[var(--gl-border)] pt-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-[var(--gl-cream-soft)]">
            {project.name || "Untitled project"}
          </p>
          {project.description?.trim() ? (
            <p className="mt-0.5 line-clamp-2 text-xs text-[var(--gl-muted)]">{project.description.trim()}</p>
          ) : null}
        </div>
      </div>
      {notice ? (
        <p className="mt-2 text-xs text-[var(--gl-cream-soft)]" role="status">
          {notice}
        </p>
      ) : null}
      <div className="pointer-events-none fixed right-4 z-40" style={{ top: `${floatingTopPx}px` }}>
        <button
          type="button"
          className="pointer-events-auto flex h-11 w-11 items-center justify-center rounded-lg border border-[var(--gl-copper-bright)]/45 bg-[var(--gl-copper)]/20 text-[var(--gl-cream)] shadow-md"
          onClick={() => setShowSaveModal(true)}
          aria-label="Save project"
          title="Save project"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
            <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" strokeLinejoin="round" />
            <path d="M17 21v-8H7v8M7 3v5h8" strokeLinejoin="round" />
          </svg>
        </button>
      </div>
      {showSaveModal ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4">
          <div className="w-full max-w-md rounded-xl border border-[var(--gl-border)] bg-[var(--gl-surface)] p-4">
            <h3 className="text-sm font-semibold text-[var(--gl-cream)]">Save project</h3>
            <p className="mt-1 text-xs text-[var(--gl-muted)]">
              Choose whether to update this project row or save a separate new copy.
            </p>
            <div className="mt-4 grid gap-2">
              <button
                type="button"
                className="rounded-lg border border-[var(--gl-border)] px-3 py-2 text-left text-xs text-[var(--gl-cream-soft)] hover:text-[var(--gl-cream)]"
                onClick={() => {
                  const r = backupCurrentProject();
                  setShowSaveModal(false);
                  setNotice(
                    r.updatedExisting
                      ? "Saved progress to this project row."
                      : "Saved to project list and linked this workspace."
                  );
                }}
              >
                Update current project
              </button>
              <button
                type="button"
                className="rounded-lg border border-[var(--gl-border)] px-3 py-2 text-left text-xs text-[var(--gl-cream-soft)] hover:text-[var(--gl-cream)]"
                onClick={() => {
                  const r = backupCurrentProject(undefined, { forceNew: true });
                  setShowSaveModal(false);
                  setNotice(r.updatedExisting ? "Saved." : "Saved as a new project.");
                }}
              >
                Save as new project
              </button>
              <button
                type="button"
                className="rounded-lg border border-[var(--gl-border)] px-3 py-2 text-left text-xs text-[var(--gl-muted)] hover:text-[var(--gl-cream-soft)]"
                onClick={() => setShowSaveModal(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
