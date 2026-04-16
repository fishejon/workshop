"use client";

import { useEffect } from "react";
import { useProject } from "@/components/ProjectContext";

export function ProjectToolbar() {
  const { undo, redo, canUndo, canRedo } = useProject();

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

  return (
    <div className="flex items-center gap-2">
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
    </div>
  );
}
