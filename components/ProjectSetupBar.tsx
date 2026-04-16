"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useProject } from "@/components/ProjectContext";
import { formatShopImperial } from "@/lib/imperial";
import { LUMBER_PROFILE_IDS, type LumberProfileId, type OffcutModeId, type ProjectTemplate } from "@/lib/project-types";
import { MAX_PROJECT_LIBRARY_RECORDS, PROJECT_TEMPLATES_STORAGE_KEY, parseTemplates } from "@/lib/project-utils";
import { cutListExportCheckpointsReady } from "@/lib/cut-list-scope";
import { canExportOrPrintProject } from "@/lib/validation";
import { validationIssueWhereHint } from "@/lib/validation/issue-action-hint";
import { NominalStockWidthSelect } from "@/components/NominalStockWidthSelect";

const OFFCUT_MODE_LABELS: Record<OffcutModeId, string> = {
  none: "Do not preserve offcuts",
  keep_serviceable: "Preserve serviceable offcuts",
};
const TRANSPORT_LENGTH_PRESETS = [72, 96, 120];
const WASTE_PERCENT_PRESETS = [10, 15, 20];

export function ProjectSetupBar() {
  const {
    project,
    validationIssues,
    blockingValidationIssues,
    setProjectName,
    setMillingAllowanceInches,
    setMaxTransportLengthInches,
    setMaxPurchasableBoardWidthInches,
    setWasteFactorPercent,
    setWorkshopLumberProfile,
    setWorkshopOffcutMode,
    duplicateProject,
    createTemplate,
    applyTemplate,
    exportProjectJson,
    importProjectJson,
    projectLibrary,
    backupCurrentProject,
    restoreFromLibrary,
    setLibraryArchived,
    resetProject,
  } = useProject();
  const checkpointsReady = cutListExportCheckpointsReady(project);
  const canPrint = canExportOrPrintProject(checkpointsReady, validationIssues);
  const [duplicateName, setDuplicateName] = useState("");
  const [templateName, setTemplateName] = useState("");
  const [templates, setTemplates] = useState<ProjectTemplate[]>(() => {
    if (typeof window === "undefined") return [];
    const raw = window.localStorage.getItem(PROJECT_TEMPLATES_STORAGE_KEY);
    return raw ? parseTemplates(raw) : [];
  });
  const [selectedTemplateId, setSelectedTemplateId] = useState(() => {
    if (typeof window === "undefined") return "";
    const raw = window.localStorage.getItem(PROJECT_TEMPLATES_STORAGE_KEY);
    const parsed = raw ? parseTemplates(raw) : [];
    return parsed[0]?.id ?? "";
  });
  const [projectNameFromTemplate, setProjectNameFromTemplate] = useState("");
  const [transferStatus, setTransferStatus] = useState("");
  const [transferMeta, setTransferMeta] = useState<string[]>([]);
  const [showAllBackups, setShowAllBackups] = useState(false);
  const importInputRef = useRef<HTMLInputElement | null>(null);
  const activeBackups = useMemo(() => projectLibrary.filter((row) => !row.archived), [projectLibrary]);

  const selectedTemplate = useMemo(
    () => templates.find((template) => template.id === selectedTemplateId) ?? null,
    [templates, selectedTemplateId]
  );
  const duplicateNameValue = duplicateName || `${project.name} copy`;
  const projectNameFromTemplateValue = projectNameFromTemplate || `${project.name} from template`;

  useEffect(() => {
    if (!transferStatus) return;
    const isError = /could not parse|import file was empty/i.test(transferStatus);
    if (isError) return;
    const t = window.setTimeout(() => setTransferStatus(""), 5000);
    return () => window.clearTimeout(t);
  }, [transferStatus]);

  function persistTemplates(next: ProjectTemplate[]) {
    setTemplates(next);
    if (typeof window === "undefined") return;
    window.localStorage.setItem(PROJECT_TEMPLATES_STORAGE_KEY, JSON.stringify(next));
  }

  function handleExportProject() {
    const blob = new Blob([exportProjectJson()], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const stamp = new Date().toISOString().replaceAll(":", "-");
    const a = document.createElement("a");
    a.href = url;
    a.download = `${project.name || "grainline-project"}-${stamp}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setTransferStatus("Exported project JSON.");
  }

  async function handleImportChange(file: File | null) {
    if (!file) return;
    const text = await file.text();
    const imported = importProjectJson(text);
    if (!imported.ok) {
      const detail = imported.details?.length ? ` Details: ${imported.details.join(" ")}` : "";
      setTransferStatus(`${imported.reason}${detail}`);
      setTransferMeta([]);
    } else {
      const sourceLabel = imported.source === "envelope" ? "export envelope" : "legacy/plain project JSON";
      const summaryBits = [
        imported.summary.nameChanged ? "name changed" : "name unchanged",
        `parts ${imported.summary.partsDelta >= 0 ? "+" : ""}${imported.summary.partsDelta}`,
        `joints ${imported.summary.jointsDelta >= 0 ? "+" : ""}${imported.summary.jointsDelta}`,
        `connections ${imported.summary.connectionsDelta >= 0 ? "+" : ""}${imported.summary.connectionsDelta}`,
      ];
      setTransferStatus("Imported project file.");
      setTransferMeta([
        `Source: ${sourceLabel}`,
        `Imported: ${new Date(imported.importedAtIso).toLocaleString()}`,
        imported.exportedAtIso ? `Exported: ${new Date(imported.exportedAtIso).toLocaleString()}` : "Exported: unknown",
        `Changed: ${summaryBits.join(", ")}`,
        ...imported.warnings,
      ]);
    }
    if (importInputRef.current) importInputRef.current.value = "";
  }

  return (
    <section
      id="project-setup-section"
      className="gl-panel mb-8 p-5"
      aria-labelledby="project-setup-title"
    >
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="flex-1 space-y-3">
          <p id="project-setup-title" className="text-xs font-medium tracking-widest text-[var(--gl-muted)] uppercase">
            Project
          </p>
          <label className="block text-sm">
            <span className="text-[var(--gl-cream-soft)]">Name</span>
            <input
              className="input-wood mt-1 max-w-md"
              value={project.name}
              onChange={(e) => setProjectName(e.target.value)}
            />
          </label>
        </div>
        <div className="grid flex-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <label className="text-sm">
            <span className="text-[var(--gl-cream-soft)]">Milling allowance (in)</span>
            <input
              type="number"
              step="any"
              min={0}
              inputMode="decimal"
              className="input-wood mt-1"
              value={project.millingAllowanceInches}
              onChange={(e) => setMillingAllowanceInches(Math.max(0, Number.parseFloat(e.target.value) || 0))}
            />
            <span className="mt-0.5 block text-xs text-[var(--gl-muted)]">
              Default rough = finished + {formatShopImperial(project.millingAllowanceInches)} per axis
            </span>
          </label>
          <label className="text-sm">
            <span className="text-[var(--gl-cream-soft)]">Max transport length (in)</span>
            <input
              type="number"
              step="any"
              min={1}
              inputMode="decimal"
              className="input-wood mt-1"
              value={project.maxTransportLengthInches}
              onChange={(e) =>
                setMaxTransportLengthInches(Math.max(1, Number.parseFloat(e.target.value) || 96))
              }
            />
            <div className="mt-1 flex flex-wrap gap-1">
              {TRANSPORT_LENGTH_PRESETS.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  className="rounded border border-[var(--gl-border)] px-2 py-1 text-xs text-[var(--gl-muted)] hover:text-[var(--gl-cream-soft)]"
                  onClick={() => setMaxTransportLengthInches(preset)}
                >
                  {preset}&quot;
                </button>
              ))}
            </div>
          </label>
          <div className="text-sm">
            <span className="text-[var(--gl-cream-soft)]">Max purchasable board (nominal stock)</span>
            <div className="mt-1">
              <NominalStockWidthSelect
                valueInches={project.maxPurchasableBoardWidthInches}
                onChangeInches={(n) => setMaxPurchasableBoardWidthInches(Math.max(0.0001, n))}
                selectId="setup-max-board-nominal"
                customInputId="setup-max-board-custom-in"
                helperText="Uses dressed (actual) face width — e.g. a 2×4 is 3½″ wide, not 4″. Used for glue-up strip math and buy-list width assumptions."
              />
            </div>
          </div>
          <label className="text-sm">
            <span className="text-[var(--gl-cream-soft)]">Waste factor (%)</span>
            <input
              type="number"
              step="1"
              min={0}
              inputMode="numeric"
              className="input-wood mt-1"
              value={project.wasteFactorPercent}
              onChange={(e) =>
                setWasteFactorPercent(Math.max(0, Number.parseFloat(e.target.value) || 0))
              }
            />
            <div className="mt-1 flex flex-wrap gap-1">
              {WASTE_PERCENT_PRESETS.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  className="rounded border border-[var(--gl-border)] px-2 py-1 text-xs text-[var(--gl-muted)] hover:text-[var(--gl-cream-soft)]"
                  onClick={() => setWasteFactorPercent(preset)}
                >
                  {preset}%
                </button>
              ))}
            </div>
          </label>
        </div>
        <div className="grid flex-1 gap-3 sm:grid-cols-2">
          <label className="text-sm">
            <span className="text-[var(--gl-cream-soft)]">Lumber profile memory</span>
            <select
              className="input-wood mt-1"
              value={project.workshop.lumberProfile}
              onChange={(e) => setWorkshopLumberProfile(e.target.value as LumberProfileId)}
            >
              {LUMBER_PROFILE_IDS.map((profileId) => (
                <option key={profileId} value={profileId}>
                  {profileId.replaceAll("_", " ")}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm">
            <span className="text-[var(--gl-cream-soft)]">Offcut mode</span>
            <select
              className="input-wood mt-1"
              value={project.workshop.offcutMode}
              onChange={(e) => setWorkshopOffcutMode(e.target.value as OffcutModeId)}
            >
              {Object.entries(OFFCUT_MODE_LABELS).map(([id, label]) => (
                <option key={id} value={id}>
                  {label}
                </option>
              ))}
            </select>
          </label>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            className="rounded-lg border border-[var(--gl-border)] px-3 py-2 text-xs text-[var(--gl-muted)] hover:text-[var(--gl-cream)]"
            onClick={handleExportProject}
          >
            Export JSON
          </button>
          <label className="rounded-lg border border-[var(--gl-border)] px-3 py-2 text-xs text-[var(--gl-muted)] hover:text-[var(--gl-cream)]">
            Import JSON
            <input
              ref={importInputRef}
              type="file"
              className="sr-only"
              accept="application/json,.json"
              onChange={(e) => void handleImportChange(e.target.files?.[0] ?? null)}
            />
          </label>
          <button
            type="button"
            className="rounded-lg border border-[var(--gl-copper-bright)]/40 bg-[var(--gl-copper)]/15 px-3 py-2 text-xs font-medium text-[var(--gl-cream-soft)] hover:border-[var(--gl-copper-bright)]/60 hover:text-[var(--gl-cream)]"
            onClick={() => {
              const backup = backupCurrentProject();
              const retention = backup.droppedOldest
                ? "Oldest backup was pruned to maintain retention cap."
                : "Retention cap not reached.";
              setTransferStatus("Created local backup.");
              setTransferMeta([
                `Created: ${new Date(backup.createdAtIso).toLocaleString()}`,
                `Retention: ${backup.retainedCount}/${backup.retentionCap}`,
                retention,
              ]);
            }}
          >
            Backup current
          </button>
          <div className="flex flex-col items-stretch gap-1">
            {canPrint ? (
              <Link
                href="/print"
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-lg border border-[var(--gl-copper-bright)]/40 bg-[var(--gl-copper)]/15 px-3 py-2 text-center text-xs font-medium text-[var(--gl-cream-soft)] hover:border-[var(--gl-copper-bright)]/60 hover:text-[var(--gl-cream)]"
              >
                Print shop sheet
              </Link>
            ) : (
              <button
                type="button"
                aria-disabled={true}
                aria-describedby="print-lock-helper"
                className="cursor-not-allowed rounded-lg border border-[var(--gl-border)] bg-[var(--gl-surface-inset)] px-3 py-2 text-center text-xs font-medium text-[var(--gl-muted)]"
                title="Acknowledge material assumptions on Materials to unlock print/export."
              >
                Print shop sheet (locked)
              </button>
            )}
            <span id="print-lock-helper" className="text-center text-xs text-[var(--gl-muted)]" role="status">
              {canPrint
                ? "PDF: print dialog -> Save as PDF"
                : checkpointsReady
                  ? "Status: Locked. Reason: high-severity validation issues."
                  : "Status: Locked. Reason: material assumptions on Materials are not acknowledged."}
            </span>
            <Link
              href="/labs"
              className="text-center text-xs text-[var(--gl-copper-bright)] underline decoration-[var(--gl-copper-bright)]/40 underline-offset-2 hover:decoration-[var(--gl-copper-bright)]"
            >
              Joinery & stick layout (labs)
            </Link>
            <Link
              href="/shop"
              className="text-center text-xs text-[var(--gl-copper-bright)] underline decoration-[var(--gl-copper-bright)]/40 underline-offset-2 hover:decoration-[var(--gl-copper-bright)]"
            >
              Shop mode (large type)
            </Link>
          </div>
          <button
            type="button"
            className="rounded-lg border border-[var(--gl-border)] px-3 py-2 text-xs text-[var(--gl-muted)] hover:text-[var(--gl-cream)]"
            onClick={() => {
              if (confirm("Reset project to defaults? Parts will be cleared.")) resetProject();
            }}
          >
            Reset project
          </button>
        </div>
      </div>
      {transferStatus ? (
        <div
          role="status"
          aria-live="polite"
          className={`mt-2 text-xs ${
            /could not parse|import file was empty|invalid json|schema|integrity/i.test(transferStatus)
              ? "text-[var(--gl-warning)]"
              : "text-[var(--gl-cream-soft)]"
          }`}
        >
          <p>{transferStatus}</p>
          {transferMeta.map((line) => (
            <p key={line} className="mt-0.5 text-xs">
              {line}
            </p>
          ))}
        </div>
      ) : null}
      {blockingValidationIssues.length > 0 ? (
        <div className="mt-3 rounded-lg border border-[color-mix(in_srgb,var(--gl-danger)_30%,var(--gl-border))] bg-[var(--gl-danger-bg)] p-3">
          <p className="text-xs font-medium text-[var(--gl-danger)]">Print/Export blocking issues</p>
          <ul
            className="mt-2 list-disc space-y-1 pl-5 text-xs text-[var(--gl-danger)]"
            aria-label={`Print or export blocking issues: ${blockingValidationIssues.length}`}
          >
            {blockingValidationIssues.slice(0, 5).map((issue) => (
              <li key={issue.id}>
                <span className="block text-[var(--gl-danger)]">{issue.message}</span>
                <span className="mt-0.5 block text-[var(--gl-muted)]">{validationIssueWhereHint(issue)}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
      <div className="mt-4 grid gap-3 border-t border-[var(--gl-border)] pt-4 lg:grid-cols-2">
        <div className="space-y-2 rounded-xl border border-[var(--gl-border)] bg-[var(--gl-surface-muted)] p-3">
          <p className="text-xs font-medium tracking-widest text-[var(--gl-muted)] uppercase">Duplicate project</p>
          <input
            className="input-wood w-full text-sm"
            value={duplicateNameValue}
            onChange={(e) => setDuplicateName(e.target.value)}
            placeholder="New project name"
          />
          <button
            type="button"
            className="rounded-lg border border-[var(--gl-border-strong)] bg-[var(--gl-surface-muted)] px-3 py-2 text-xs font-medium text-[var(--gl-cream)] hover:bg-[var(--gl-surface-muted)]"
            onClick={() => {
              const nextName = duplicateName.trim();
              duplicateProject(nextName || `${project.name} copy`);
            }}
          >
            Duplicate current project
          </button>
        </div>
        <div className="space-y-2 rounded-xl border border-[var(--gl-border)] bg-[var(--gl-surface-muted)] p-3">
          <p className="text-xs font-medium tracking-widest text-[var(--gl-muted)] uppercase">Templates</p>
          <div className="flex gap-2">
            <input
              className="input-wood flex-1 text-sm"
              value={templateName}
              onChange={(e) => setTemplateName(e.target.value)}
              placeholder="Template name"
            />
            <button
              type="button"
              className="rounded-lg border border-[var(--gl-border-strong)] px-3 py-2 text-xs text-[var(--gl-cream)] hover:bg-[var(--gl-surface-muted)]"
              onClick={() => {
                const nextName = templateName.trim();
                if (!nextName) return;
                const template = createTemplate(nextName);
                const next = [template, ...templates];
                persistTemplates(next);
                setSelectedTemplateId(template.id);
                setTemplateName("");
              }}
            >
              Save template
            </button>
          </div>
          <select
            className="input-wood w-full text-sm"
            value={selectedTemplateId}
            onChange={(e) => setSelectedTemplateId(e.target.value)}
          >
            {templates.length === 0 ? <option value="">No templates yet</option> : null}
            {templates.map((template) => (
              <option key={template.id} value={template.id}>
                {template.name} ({template.sourceProjectName})
              </option>
            ))}
          </select>
          <div className="flex gap-2">
            <input
              className="input-wood flex-1 text-sm"
              value={projectNameFromTemplateValue}
              onChange={(e) => setProjectNameFromTemplate(e.target.value)}
              placeholder="New project name"
            />
            <button
              type="button"
              disabled={!selectedTemplate}
              className="rounded-lg border border-[var(--gl-copper)]/40 bg-[var(--gl-copper)]/15 px-3 py-2 text-xs font-medium text-[var(--gl-cream)] hover:bg-[var(--gl-copper)]/25 disabled:cursor-not-allowed disabled:opacity-50"
              onClick={() => {
                if (!selectedTemplate) return;
                const nextName = projectNameFromTemplate.trim();
                applyTemplate(selectedTemplate, nextName || `${project.name} from template`);
              }}
            >
              Create from template
            </button>
          </div>
        </div>
      </div>
      <div className="mt-3 space-y-2 rounded-xl border border-[var(--gl-border)] bg-[var(--gl-surface-muted)] p-3">
        <p className="text-xs font-medium tracking-widest text-[var(--gl-muted)] uppercase">
          Local backups ({activeBackups.length} active / {projectLibrary.length - activeBackups.length} archived)
        </p>
        <p className="text-xs text-[var(--gl-muted)]">
          Retention policy: latest {MAX_PROJECT_LIBRARY_RECORDS} backups are kept locally; older backups are automatically removed.
        </p>
        {projectLibrary.length === 0 ? (
          <p className="text-xs text-[var(--gl-muted)]">No backups yet. Use &quot;Backup current&quot; to create restore points.</p>
        ) : (
          <>
            <ul className="space-y-1 text-xs">
              {(showAllBackups ? projectLibrary : projectLibrary.slice(0, 8)).map((entry) => (
                <li key={entry.id} className="flex flex-wrap items-center gap-2 text-[var(--gl-muted)]">
                  <span className="min-w-0 flex-1 truncate">
                    {entry.name} · {new Date(entry.updatedAt).toLocaleString()}
                    {entry.archived ? (
                      <span className="ml-1 text-xs uppercase tracking-wide text-[var(--gl-muted)]">archived</span>
                    ) : null}
                  </span>
                  <button
                    type="button"
                    className="rounded border border-[var(--gl-border)] px-2 py-1 hover:text-[var(--gl-cream)]"
                    onClick={() => {
                      const restored = restoreFromLibrary(entry.id);
                      if (!restored.ok) {
                        setTransferStatus(restored.reason);
                        setTransferMeta([]);
                        return;
                      }
                      const summaryBits = [
                        restored.summary.nameChanged ? "name changed" : "name unchanged",
                        `parts ${restored.summary.partsDelta >= 0 ? "+" : ""}${restored.summary.partsDelta}`,
                        `joints ${restored.summary.jointsDelta >= 0 ? "+" : ""}${restored.summary.jointsDelta}`,
                        `connections ${restored.summary.connectionsDelta >= 0 ? "+" : ""}${restored.summary.connectionsDelta}`,
                      ];
                      setTransferStatus(`Restored backup: ${restored.backupName}.`);
                      setTransferMeta([
                        `Source: local backup library`,
                        `Backup timestamp: ${new Date(restored.backupUpdatedAtIso).toLocaleString()}`,
                        `Restored: ${new Date(restored.restoredAtIso).toLocaleString()}`,
                        `Changed: ${summaryBits.join(", ")}`,
                      ]);
                    }}
                  >
                    Restore
                  </button>
                  <button
                    type="button"
                    className="rounded border border-[var(--gl-border)] px-2 py-1 hover:text-[var(--gl-cream)]"
                    onClick={() => setLibraryArchived(entry.id, !entry.archived)}
                  >
                    {entry.archived ? "Unarchive" : "Archive"}
                  </button>
                </li>
              ))}
            </ul>
            {projectLibrary.length > 8 ? (
              <button
                type="button"
                className="mt-2 text-xs font-medium tracking-wide text-[var(--gl-muted)] uppercase hover:text-[var(--gl-cream-soft)]"
                onClick={() => setShowAllBackups((v) => !v)}
              >
                {showAllBackups ? "Show fewer" : `Show all ${projectLibrary.length} backups`}
              </button>
            ) : null}
          </>
        )}
      </div>
    </section>
  );
}
