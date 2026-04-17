"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useProject } from "@/components/ProjectContext";
import { MAX_PROJECT_LIBRARY_RECORDS, type StoredProjectRecord } from "@/lib/project-utils";

type ProjectsHomeViewProps = {
  onOpenWorkspace: () => void;
  onNewProject: () => void;
};

type LibraryViewMode = "table" | "cards";

function RowMenu({
  entry,
  onDuplicate,
  onToggleArchive,
  onDeletePermanently,
}: {
  entry: StoredProjectRecord;
  onDuplicate: () => void;
  onToggleArchive: () => void;
  onDeletePermanently?: () => void;
}) {
  const detailsRef = useRef<HTMLDetailsElement>(null);
  function closeMenu() {
    const el = detailsRef.current;
    if (el) el.open = false;
  }

  return (
    <details ref={detailsRef} className="relative">
      <summary
        className="list-none cursor-pointer rounded border border-[var(--gl-border)] bg-transparent px-2 py-1 text-[var(--gl-muted)] hover:bg-[var(--gl-surface-muted)] hover:text-[var(--gl-cream)] [&::-webkit-details-marker]:hidden"
        aria-label={`More actions for ${entry.name}`}
      >
        ···
      </summary>
      <div className="absolute right-0 z-10 mt-1 min-w-[10rem] rounded-lg border border-[var(--gl-border)] bg-[var(--gl-surface)] py-1 text-xs shadow-lg">
        <button
          type="button"
          className="block w-full bg-transparent px-3 py-2 text-left text-[var(--gl-cream-soft)] hover:bg-[var(--gl-surface-muted)]"
          onClick={() => {
            closeMenu();
            onDuplicate();
          }}
        >
          Duplicate…
        </button>
        <button
          type="button"
          className="block w-full bg-transparent px-3 py-2 text-left text-[var(--gl-muted)] hover:bg-[var(--gl-surface-muted)] hover:text-[var(--gl-cream)]"
          onClick={() => {
            closeMenu();
            onToggleArchive();
          }}
        >
          {entry.archived ? "Unarchive" : "Archive"}
        </button>
        {entry.archived && onDeletePermanently ? (
          <button
            type="button"
            className="block w-full bg-transparent px-3 py-2 text-left text-[var(--gl-warning)] hover:bg-[var(--gl-surface-muted)]"
            onClick={() => {
              closeMenu();
              onDeletePermanently();
            }}
          >
            Delete permanently…
          </button>
        ) : null}
      </div>
    </details>
  );
}

export function ProjectsHomeView({ onOpenWorkspace, onNewProject }: ProjectsHomeViewProps) {
  const {
    projectLibrary,
    restoreFromLibrary,
    forkProjectFromLibrary,
    setLibraryArchived,
    deleteLibraryRecord,
    backupCurrentProject,
  } =
    useProject();

  const [statusLine, setStatusLine] = useState("");
  const [viewMode, setViewMode] = useState<LibraryViewMode>("cards");
  const [showAllActive, setShowAllActive] = useState(false);
  const [showAllArchived, setShowAllArchived] = useState(false);
  const [showArchivedSection, setShowArchivedSection] = useState(false);

  const sortedLibrary = useMemo(() => {
    const rows = [...projectLibrary];
    rows.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
    return rows;
  }, [projectLibrary]);

  const activeRows = useMemo(() => sortedLibrary.filter((r) => !r.archived), [sortedLibrary]);
  const archivedRows = useMemo(() => sortedLibrary.filter((r) => r.archived), [sortedLibrary]);

  const visibleActive = showAllActive ? activeRows : activeRows.slice(0, 12);
  const visibleArchived = showAllArchived ? archivedRows : archivedRows.slice(0, 12);

  useEffect(() => {
    if (activeRows.length === 0 && archivedRows.length > 0) {
      setShowArchivedSection(true);
    }
  }, [activeRows.length, archivedRows.length]);

  function openEntry(entry: StoredProjectRecord) {
    const restored = restoreFromLibrary(entry.id);
    if (!restored.ok) {
      setStatusLine(restored.reason);
      return;
    }
    onOpenWorkspace();
  }

  function duplicateEntry(entry: StoredProjectRecord) {
    const suggested = `${entry.name || "Project"} copy`;
    const name = typeof window !== "undefined" ? window.prompt("Name for the duplicate", suggested) : suggested;
    if (name === null) return;
    const forked = forkProjectFromLibrary(entry.id, name);
    if (!forked.ok) {
      setStatusLine(forked.reason);
      return;
    }
    onOpenWorkspace();
  }

  function deleteArchivedEntryPermanently(entry: StoredProjectRecord) {
    if (!entry.archived) return;
    const label = entry.name?.trim() || "Untitled project";
    if (typeof window !== "undefined" && !window.confirm(`Permanently delete “${label}” from this browser? This cannot be undone.`)) {
      return;
    }
    deleteLibraryRecord(entry.id);
    setStatusLine(`Deleted archived project “${label}”.`);
  }

  function renderTableRows(rows: StoredProjectRecord[]) {
    return (
      <ul className="divide-y divide-[var(--gl-border)] overflow-hidden rounded-lg border border-[var(--gl-border)] bg-white">
        {rows.map((entry) => (
          <li key={entry.id} className="flex flex-wrap items-center gap-2 bg-white px-3 py-2.5">
            {entry.project.photos?.[0] ? (
              <img
                src={entry.project.photos[0]}
                alt={`${entry.name || "Project"} thumbnail`}
                className="h-10 w-10 rounded-md border border-neutral-200 object-cover"
              />
            ) : null}
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-neutral-900">{entry.name || "Untitled project"}</p>
              {entry.project.description?.trim() ? (
                <p className="mt-0.5 line-clamp-2 text-xs text-neutral-600">{entry.project.description.trim()}</p>
              ) : null}
              <p className="mt-0.5 text-xs text-neutral-500">
                {new Date(entry.updatedAt).toLocaleString()} · parts {entry.project.parts.length}
                {entry.archived ? (
                  <span className="ml-2 text-[10px] uppercase tracking-wide text-neutral-400">archived</span>
                ) : null}
              </p>
            </div>
            <button
              type="button"
              className="rounded-md border border-neutral-300 bg-white px-2 py-1 text-xs text-neutral-900 hover:bg-neutral-50"
              onClick={() => openEntry(entry)}
            >
              Open
            </button>
            <button
              type="button"
              className="rounded-md border border-neutral-300 bg-white px-2 py-1 text-xs text-neutral-900 hover:bg-neutral-50"
              onClick={() => duplicateEntry(entry)}
            >
              Duplicate
            </button>
            <button
              type="button"
              className="rounded-md border border-neutral-300 bg-white px-2 py-1 text-xs text-neutral-700 hover:bg-neutral-50"
              onClick={() => setLibraryArchived(entry.id, !entry.archived)}
            >
              {entry.archived ? "Unarchive" : "Archive"}
            </button>
            {entry.archived ? (
              <button
                type="button"
                className="rounded-md border border-red-200/80 bg-white px-2 py-1 text-xs text-red-800 hover:bg-red-50"
                onClick={() => deleteArchivedEntryPermanently(entry)}
              >
                Delete permanently
              </button>
            ) : null}
            <RowMenu
              entry={entry}
              onDuplicate={() => duplicateEntry(entry)}
              onToggleArchive={() => setLibraryArchived(entry.id, !entry.archived)}
              onDeletePermanently={entry.archived ? () => deleteArchivedEntryPermanently(entry) : undefined}
            />
          </li>
        ))}
      </ul>
    );
  }

  function renderCardRows(rows: StoredProjectRecord[]) {
    return (
      <ul className="grid gap-3 sm:grid-cols-2">
        {rows.map((entry) => (
          <li key={entry.id} className="flex flex-col rounded-xl border border-[var(--gl-border)] bg-white p-4 shadow-sm">
            {entry.project.photos?.[0] ? (
              <img
                src={entry.project.photos[0]}
                alt={`${entry.name || "Project"} thumbnail`}
                className="mb-2 h-28 w-full rounded-lg border border-neutral-200 object-cover"
              />
            ) : null}
            <p className="truncate text-sm font-medium text-neutral-900">{entry.name || "Untitled project"}</p>
            {entry.project.description?.trim() ? (
              <p className="mt-1 line-clamp-3 text-xs text-neutral-600">{entry.project.description.trim()}</p>
            ) : (
              <p className="mt-1 text-xs italic text-neutral-400">No description</p>
            )}
            <p className="mt-2 text-xs text-neutral-500">
              {new Date(entry.updatedAt).toLocaleDateString()} · {entry.project.parts.length} parts
              {entry.archived ? (
                <span className="ml-2 text-[10px] uppercase tracking-wide text-neutral-400">archived</span>
              ) : null}
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <button
                type="button"
                className="rounded-md border border-neutral-300 bg-white px-2 py-1 text-xs text-neutral-900 hover:bg-neutral-50"
                onClick={() => openEntry(entry)}
              >
                Open
              </button>
              <button
                type="button"
                className="rounded-md border border-neutral-300 bg-white px-2 py-1 text-xs text-neutral-900 hover:bg-neutral-50"
                onClick={() => duplicateEntry(entry)}
              >
                Duplicate
              </button>
              <button
                type="button"
                className="rounded-md border border-neutral-300 bg-white px-2 py-1 text-xs text-neutral-700 hover:bg-neutral-50"
                onClick={() => setLibraryArchived(entry.id, !entry.archived)}
              >
                {entry.archived ? "Unarchive" : "Archive"}
              </button>
              {entry.archived ? (
                <button
                  type="button"
                  className="rounded-md border border-red-200/80 bg-white px-2 py-1 text-xs text-red-800 hover:bg-red-50"
                  onClick={() => deleteArchivedEntryPermanently(entry)}
                >
                  Delete permanently
                </button>
              ) : null}
              <RowMenu
                entry={entry}
                onDuplicate={() => duplicateEntry(entry)}
                onToggleArchive={() => setLibraryArchived(entry.id, !entry.archived)}
                onDeletePermanently={entry.archived ? () => deleteArchivedEntryPermanently(entry) : undefined}
              />
            </div>
          </li>
        ))}
      </ul>
    );
  }

  return (
    <div className="mx-auto w-full max-w-5xl">
      {statusLine ? (
        <p className="mb-4 text-xs text-[var(--gl-cream-soft)]" role="status">
          {statusLine}
        </p>
      ) : null}

      <div className="border-b border-[var(--gl-border)] pb-5">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <h2 className="text-lg font-semibold tracking-wide text-[var(--gl-cream)]">Project Files</h2>
          <div className="flex flex-wrap items-center gap-3">
            <fieldset className="flex items-center gap-0 rounded-lg border border-[var(--gl-border)] bg-transparent p-0.5 text-xs">
              <legend className="sr-only">Project list layout</legend>
              <button
                type="button"
                onClick={() => setViewMode("table")}
                className={`rounded-md px-2.5 py-1 transition ${
                  viewMode === "table"
                    ? "text-[var(--gl-cream)] ring-1 ring-[var(--gl-border-strong)]"
                    : "bg-transparent text-[var(--gl-muted)] hover:bg-[var(--gl-surface-muted)] hover:text-[var(--gl-cream-soft)]"
                }`}
              >
                Table
              </button>
              <button
                type="button"
                onClick={() => setViewMode("cards")}
                className={`rounded-md px-2.5 py-1 transition ${
                  viewMode === "cards"
                    ? "text-[var(--gl-cream)] ring-1 ring-[var(--gl-border-strong)]"
                    : "bg-transparent text-[var(--gl-muted)] hover:bg-[var(--gl-surface-muted)] hover:text-[var(--gl-cream-soft)]"
                }`}
              >
                Cards
              </button>
            </fieldset>
            <button
              type="button"
              className="rounded-md border border-transparent bg-transparent px-2 py-1 text-xs text-[var(--gl-muted)] hover:bg-[var(--gl-surface-muted)] hover:text-[var(--gl-cream)]"
              onClick={() => {
                const r = backupCurrentProject();
                setStatusLine(
                  r.updatedExisting
                    ? "Saved progress to your project list (updated the same row)."
                    : "Saved to your project list — next save updates that row."
                );
              }}
            >
              Save current
            </button>
            <button
              type="button"
              aria-label="New project"
              title="New project"
              onClick={onNewProject}
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-[var(--gl-border-strong)] bg-transparent text-[var(--gl-cream)] shadow-sm transition hover:border-[var(--gl-copper-bright)]/50 hover:bg-[var(--gl-surface-muted)] active:bg-[var(--gl-surface-muted)]"
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                <path d="M12 5v14M5 12h14" strokeLinecap="round" />
              </svg>
            </button>
          </div>
        </div>
        <p className="mt-2 text-xs text-[var(--gl-muted)]">
          {activeRows.length} active
          {archivedRows.length > 0 ? ` · ${archivedRows.length} archived` : ""} · keeps latest{" "}
          {MAX_PROJECT_LIBRARY_RECORDS} in this browser
        </p>
      </div>

      <div className="mt-6">
        {sortedLibrary.length === 0 ? (
          <p className="text-sm text-[var(--gl-muted)]">
            No saved projects yet. Use <strong className="text-[var(--gl-cream-soft)]">Save current</strong> or{" "}
            <strong className="text-[var(--gl-cream-soft)]">Save project</strong> from the workspace toolbar while you
            work.
          </p>
        ) : activeRows.length === 0 && archivedRows.length > 0 ? (
          <p className="text-sm text-[var(--gl-muted)]">
            No active projects. Everything is archived—open <strong className="text-[var(--gl-cream-soft)]">Archived</strong>{" "}
            below to unarchive or open a copy.
          </p>
        ) : null}

        {activeRows.length > 0 ? (
          viewMode === "table" ? renderTableRows(visibleActive) : renderCardRows(visibleActive)
        ) : null}

        {activeRows.length > 12 ? (
          <button
            type="button"
            className="mt-3 bg-transparent text-xs font-medium tracking-wide text-[var(--gl-muted)] uppercase hover:text-[var(--gl-cream-soft)]"
            onClick={() => setShowAllActive((v) => !v)}
          >
            {showAllActive ? "Show fewer" : `Show all ${activeRows.length} active`}
          </button>
        ) : null}

        {archivedRows.length > 0 ? (
          <div className="mt-8 border-t border-[var(--gl-border)] pt-6">
            <button
              type="button"
              className="bg-transparent text-left text-sm font-medium text-[var(--gl-cream-soft)] underline decoration-[var(--gl-border-strong)] underline-offset-2 hover:text-[var(--gl-cream)]"
              onClick={() => setShowArchivedSection((v) => !v)}
            >
              {showArchivedSection ? "Hide archived" : `Archived (${archivedRows.length})`}
            </button>
            {showArchivedSection ? (
              <div className="mt-4">
                <p className="mb-3 text-xs text-[var(--gl-muted)]">
                  Archived rows stay in this browser until you unarchive, delete them individually, or hit the library size cap.
                </p>
                {viewMode === "table" ? renderTableRows(visibleArchived) : renderCardRows(visibleArchived)}
                {archivedRows.length > 12 ? (
                  <button
                    type="button"
                    className="mt-3 bg-transparent text-xs font-medium tracking-wide text-[var(--gl-muted)] uppercase hover:text-[var(--gl-cream-soft)]"
                    onClick={() => setShowAllArchived((v) => !v)}
                  >
                    {showAllArchived ? "Show fewer" : `Show all ${archivedRows.length} archived`}
                  </button>
                ) : null}
              </div>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}
