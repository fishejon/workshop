"use client";

import { useEffect, useState } from "react";
import { useProject } from "@/components/ProjectContext";

export function ProjectWorkspaceBar() {
  const { project, undo, redo, canUndo, canRedo, backupCurrentProject } = useProject();
  const [notice, setNotice] = useState("");

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (!(event.metaKey || event.ctrlKey) || event.key.toLowerCase() !== "z") return;
      event.preventDefault();
      if (event.shiftKey) {
        if (canRedo) redo();
      } else if (canUndo) {
        undo();
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [undo, redo, canUndo, canRedo]);

  useEffect(() => {
    if (!notice) return;
    const t = window.setTimeout(() => setNotice(""), 3500);
    return () => window.clearTimeout(t);
  }, [notice]);

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
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={undo}
            disabled={!canUndo}
            title="Undo (Cmd/Ctrl+Z)"
            className="rounded-lg border border-[var(--gl-border)] px-3 py-1.5 text-xs text-[var(--gl-cream-soft)] disabled:cursor-not-allowed disabled:opacity-50"
          >
            Undo
          </button>
          <button
            type="button"
            onClick={redo}
            disabled={!canRedo}
            title="Redo (Cmd/Ctrl+Shift+Z)"
            className="rounded-lg border border-[var(--gl-border)] px-3 py-1.5 text-xs text-[var(--gl-cream-soft)] disabled:cursor-not-allowed disabled:opacity-50"
          >
            Redo
          </button>
          <button
            type="button"
            className="rounded-lg border border-[var(--gl-copper-bright)]/40 bg-[var(--gl-copper)]/15 px-3 py-1.5 text-xs font-medium text-[var(--gl-cream-soft)] hover:border-[var(--gl-copper-bright)]/60 hover:text-[var(--gl-cream)]"
            onClick={() => {
              backupCurrentProject();
              setNotice("Saved a copy to your project list.");
            }}
          >
            Save project
          </button>
        </div>
      </div>
      {notice ? (
        <p className="mt-2 text-xs text-[var(--gl-cream-soft)]" role="status">
          {notice}
        </p>
      ) : null}
    </div>
  );
}
