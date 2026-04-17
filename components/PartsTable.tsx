"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useProject } from "@/components/ProjectContext";
import {
  ASSEMBLY_IDS,
  type AssemblyId,
  type Part,
  type ProjectJoint,
} from "@/lib/project-types";
import { cutListExportCheckpointsReady, jointsEffectiveForCutList } from "@/lib/cut-list-scope";
import { buildRoughInstanceLabelMap } from "@/lib/shop-labels";
import { makeRoughInstanceId } from "@/lib/rough-instance-id";
import { derivePartAssumptionsDetailed } from "@/lib/part-assumptions";
import { partsToCsv } from "@/lib/parts-csv";
import { formatShopImperial } from "@/lib/imperial";
import { validationIssueWhereHint } from "@/lib/validation/issue-action-hint";
import { canExportOrPrintProject } from "@/lib/validation";

function formatDim3(d: { t: number; w: number; l: number }): string {
  return `${formatShopImperial(d.t)} × ${formatShopImperial(d.w)} × ${formatShopImperial(d.l)}`;
}

function labelSummaryForPart(part: Part, labelMap: Map<string, string>): string {
  const q = Math.floor(Number(part.quantity));
  if (!Number.isFinite(q) || q < 1) return "—";
  const labels: string[] = [];
  for (let i = 1; i <= q; i += 1) {
    const key = makeRoughInstanceId(part.id, i);
    const lbl = labelMap.get(key);
    if (lbl) labels.push(lbl);
  }
  if (labels.length === 0) return "—";
  const first = labels[0]!;
  const prefix = first.split("-")[0]?.trim();
  return prefix || "—";
}

export function PartsTable({ explainAllowanceText }: { explainAllowanceText: string }) {
  const {
    project,
    validationIssues,
    blockingValidationIssues,
    warningValidationIssues,
    updatePart,
    removePart,
  } = useProject();
  const [assemblyFilter, setAssemblyFilter] = useState<AssemblyId | "All">("All");
  const [editingPartId, setEditingPartId] = useState<string | null>(null);
  const checkpointsReady = cutListExportCheckpointsReady(project);
  const jointsForCutList = jointsEffectiveForCutList(project);
  const canExport = canExportOrPrintProject(checkpointsReady, validationIssues);

  const shopLabelByInstanceId = useMemo(() => buildRoughInstanceLabelMap(project.parts), [project.parts]);

  const liveEditPart = useMemo(
    () => (editingPartId ? project.parts.find((p) => p.id === editingPartId) ?? null : null),
    [editingPartId, project.parts]
  );

  const visibleParts = useMemo(() => {
    if (assemblyFilter === "All") return project.parts;
    return project.parts.filter((p) => p.assembly === assemblyFilter);
  }, [assemblyFilter, project.parts]);

  const visibleRows = useMemo(() => {
    return visibleParts
      .map((part) => ({
        part,
        label: labelSummaryForPart(part, shopLabelByInstanceId),
      }))
      .sort((a, b) => {
        const la = a.label === "—" ? "~" : a.label;
        const lb = b.label === "—" ? "~" : b.label;
        const cmp = la.localeCompare(lb, undefined, { sensitivity: "base", numeric: true });
        if (cmp !== 0) return cmp;
        return a.part.name.localeCompare(b.part.name, undefined, { sensitivity: "base" });
      });
  }, [visibleParts, shopLabelByInstanceId]);

  function downloadCsv() {
    const blob = new Blob([partsToCsv(project.parts, jointsForCutList, project)], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${project.name.replace(/\s+/g, "-").toLowerCase() || "grainline"}-parts.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <section
      id="parts-table-section"
      className="gl-panel p-5"
      aria-labelledby="parts-table-title"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p id="parts-table-title" className="text-xs font-medium tracking-widest text-[var(--gl-muted)] uppercase">
            Component list
          </p>
          <p className="mt-1 text-sm text-[var(--gl-muted)]">
            Finished dimensions (nearest 1/16″). Filter by assembly, export CSV, or Edit a row.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <div className="flex items-center gap-2 rounded-lg border border-[var(--gl-border)] bg-[var(--gl-surface-muted)] px-2 py-1">
            <span className="text-xs text-[var(--gl-muted)]">Show</span>
            <select
              className="input-wood py-1.5 text-xs"
              value={assemblyFilter}
              onChange={(e) => setAssemblyFilter(e.target.value as AssemblyId | "All")}
            >
              <option value="All">All assemblies</option>
              {ASSEMBLY_IDS.map((assembly) => (
                <option key={assembly} value={assembly}>
                  {assembly}
                </option>
              ))}
            </select>
          </div>
          <button
            type="button"
            className="rounded-lg border border-[var(--gl-copper)]/40 bg-[var(--gl-copper)]/15 px-3 py-2 text-xs font-medium text-[var(--gl-cream)] hover:bg-[var(--gl-copper)]/25"
            onClick={downloadCsv}
            disabled={project.parts.length === 0 || !canExport}
            aria-disabled={project.parts.length === 0 || !canExport}
            title={!canExport ? "Acknowledge material assumptions on Materials to unlock export." : undefined}
          >
            {canExport ? "Export CSV" : "Export CSV (locked)"}
          </button>
        </div>
      </div>

      <p className="mt-2 text-xs text-[var(--gl-muted)]">{explainAllowanceText}</p>
      {!canExport ? (
        <p id="parts-export-lock-reason" className="mt-2 text-xs text-[var(--gl-muted)]" role="status">
          {checkpointsReady
            ? "Export is blocked by high-severity validation issues."
            : "Export is locked until you acknowledge material assumptions on Materials."}
        </p>
      ) : null}
      {blockingValidationIssues.length > 0 ? (
        <ul
          className="mt-2 list-disc space-y-1 pl-5 text-xs text-[var(--gl-danger)]"
          aria-label={`Blocking issues: ${blockingValidationIssues.length}`}
        >
          {blockingValidationIssues.slice(0, 4).map((issue) => (
            <li key={issue.id}>
              <span className="block text-[var(--gl-danger)]">{issue.message}</span>
              <span className="mt-0.5 block text-[var(--gl-muted)]">{validationIssueWhereHint(issue)}</span>
            </li>
          ))}
        </ul>
      ) : null}
      {warningValidationIssues.length > 0 ? (
        <p className="mt-2 text-xs text-[var(--gl-warning)]">
          {warningValidationIssues.length} warning{warningValidationIssues.length === 1 ? "" : "s"} detected. Verify on
          Plan and Materials before handoff.
        </p>
      ) : null}

      {project.parts.length === 0 ? (
        <p className="mt-6 text-sm text-[var(--gl-muted)]">No parts yet — add from Plan presets, then review here.</p>
      ) : (
        <div className="mt-4 max-h-[min(70vh,720px)] overflow-auto rounded-xl border border-[var(--gl-border)]">
          <table className="gl-numeric w-full min-w-[520px] text-left text-xs">
            <thead className="sticky top-0 z-10 bg-[var(--gl-ink)]/98 text-xs tracking-wide text-[var(--gl-muted)] uppercase">
              <tr>
                <th className="px-3 py-2.5 font-medium">Label</th>
                <th className="px-3 py-2.5 font-medium">Component</th>
                <th className="px-3 py-2.5 font-medium">Asm</th>
                <th className="px-3 py-2.5 font-medium">Qty</th>
                <th className="px-3 py-2.5 font-medium">Finished T×W×L</th>
                <th className="px-3 py-2.5 font-medium"> </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--gl-border)] text-[var(--gl-cream)]">
              {visibleRows.map(({ part, label }) => (
                <CutListReadRow
                  key={part.id}
                  part={part}
                  shopLabelSummary={label}
                  onEdit={() => setEditingPartId(part.id)}
                  onRemove={() => removePart(part.id)}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}

      {liveEditPart ? (
        <PartEditDialog
          key={`${liveEditPart.id}-${liveEditPart.finished.l}-${liveEditPart.rough.l}-${liveEditPart.quantity}`}
          part={liveEditPart}
          millingAllowanceInches={project.millingAllowanceInches}
          maxPurchasableBoardWidthInches={project.maxPurchasableBoardWidthInches}
          stockWidthByMaterialGroup={project.stockWidthByMaterialGroup}
          joints={jointsForCutList}
          onClose={() => setEditingPartId(null)}
          onSave={(patch) => {
            updatePart(liveEditPart.id, patch);
            setEditingPartId(null);
          }}
          onRemove={() => {
            removePart(liveEditPart.id);
            setEditingPartId(null);
          }}
        />
      ) : null}
    </section>
  );
}

function CutListReadRow({
  part,
  shopLabelSummary,
  onEdit,
  onRemove,
}: {
  part: Part;
  shopLabelSummary: string;
  onEdit: () => void;
  onRemove: () => void;
}) {
  return (
    <tr className="align-middle hover:bg-[var(--gl-surface-muted)]/40">
      <td className="px-3 py-2.5 font-mono text-xs font-semibold tabular-nums text-[var(--gl-copper)]">
        {shopLabelSummary}
      </td>
      <td className="px-3 py-2.5 font-medium text-[var(--gl-cream-soft)]">{part.name || "—"}</td>
      <td className="px-3 py-2.5 text-[var(--gl-muted)]">{part.assembly}</td>
      <td className="px-3 py-2.5 tabular-nums">{part.quantity}</td>
      <td className="px-3 py-2.5 font-mono text-[var(--gl-cream)]">{formatDim3(part.finished)}</td>
      <td className="px-3 py-2.5">
        <div className="flex flex-col items-end gap-1 sm:flex-row sm:justify-end">
          <button
            type="button"
            className="rounded-md border border-[var(--gl-border-strong)] px-2 py-1 text-xs font-medium text-[var(--gl-cream)] hover:bg-[var(--gl-surface-muted)]"
            onClick={onEdit}
          >
            Edit
          </button>
          <button
            type="button"
            className="text-xs text-[var(--gl-muted)] hover:text-[var(--gl-danger)]"
            onClick={() => {
              if (confirm(`Remove “${part.name}” from the cut list?`)) onRemove();
            }}
          >
            Remove
          </button>
        </div>
      </td>
    </tr>
  );
}

function PartEditDialog({
  part,
  millingAllowanceInches,
  maxPurchasableBoardWidthInches,
  stockWidthByMaterialGroup,
  joints,
  onClose,
  onSave,
  onRemove,
}: {
  part: Part;
  millingAllowanceInches: number;
  maxPurchasableBoardWidthInches: number;
  stockWidthByMaterialGroup?: Record<string, number>;
  joints: ProjectJoint[];
  onClose: () => void;
  onSave: (patch: Partial<Part>) => void;
  onRemove: () => void;
}) {
  const [draft, setDraft] = useState<Part>(() => ({ ...part }));

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const derived = useMemo(
    () =>
      derivePartAssumptionsDetailed(draft, joints, {
        maxPurchasableBoardWidthInches,
        stockWidthByMaterialGroup,
      }),
    [draft, joints, maxPurchasableBoardWidthInches, stockWidthByMaterialGroup]
  );

  const whySummary = useMemo(() => {
    const prov = derived.provenance;
    const roughSummary =
      prov.roughSource === "manual"
        ? "Rough dims are manually overridden for this part."
        : `Rough dims are derived from finished + ${formatShopImperial(millingAllowanceInches)} allowance on T, W, and L.`;
    const joinerySummary =
      prov.joineryChangeCount > 0
        ? `Joinery changed this part ${prov.joineryChangeCount} time(s) (labs only on current product path).`
        : "No joinery dimension changes apply on the main cut list.";
    const glueSummary = derived.glueUpPlan.applicable
      ? `Glue-up: ${derived.glueUpPlan.stripCount} strip(s); board width source: ${derived.glueUpPlan.boardWidthSource}.`
      : "Glue-up not applicable.";
    return `${roughSummary} ${joinerySummary} ${glueSummary}`;
  }, [derived, millingAllowanceInches]);

  function applyFinished(nextFin: { t: number; w: number; l: number }) {
    const rough = draft.rough.manual
      ? draft.rough
      : { ...deriveRough(nextFin, millingAllowanceInches), manual: false };
    setDraft((d) => ({ ...d, finished: nextFin, rough }));
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-4 sm:items-center"
      role="presentation"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="part-edit-title"
        className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-[var(--gl-border)] bg-[var(--gl-surface-muted)] p-5 shadow-xl"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3">
          <h2 id="part-edit-title" className="font-display text-lg text-[var(--gl-cream)]">
            Edit part
          </h2>
          <button
            type="button"
            className="rounded-md px-2 py-1 text-sm text-[var(--gl-muted)] hover:bg-[var(--gl-surface-inset)] hover:text-[var(--gl-cream)]"
            onClick={onClose}
            aria-label="Close"
          >
            ✕
          </button>
        </div>
        <p className="mt-1 text-xs text-[var(--gl-muted)]">Changes apply when you press Save.</p>

        <div className="mt-4 space-y-3">
          <label className="block text-sm">
            <span className="text-[var(--gl-cream-soft)]">Name</span>
            <input
              className="input-wood mt-1 w-full"
              value={draft.name}
              onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
            />
          </label>
          <label className="block text-sm">
            <span className="text-[var(--gl-cream-soft)]">Assembly</span>
            <select
              className="input-wood mt-1 w-full"
              value={draft.assembly}
              onChange={(e) => setDraft((d) => ({ ...d, assembly: e.target.value as AssemblyId }))}
            >
              {ASSEMBLY_IDS.map((a) => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-sm">
            <span className="text-[var(--gl-cream-soft)]">Quantity</span>
            <input
              type="number"
              min={1}
              className="input-wood mt-1 w-full"
              value={draft.quantity}
              onChange={(e) => setDraft((d) => ({ ...d, quantity: Math.max(1, Number(e.target.value) || 1) }))}
            />
          </label>

          <div className="rounded-lg border border-[var(--gl-border)] bg-[var(--gl-surface-inset)] p-3">
            <p className="text-xs font-medium text-[var(--gl-muted)] uppercase">Finished T×W×L</p>
            <Dim3Inputs dim={draft.finished} onChange={applyFinished} />
          </div>
          <div className="rounded-lg border border-[var(--gl-border)] bg-[var(--gl-surface-inset)] p-3">
            <p className="text-xs font-medium text-[var(--gl-muted)] uppercase">Rough T×W×L</p>
            <Dim3Inputs
              dim={draft.rough}
              onChange={(d) => setDraft((p) => ({ ...p, rough: { ...d, manual: true } }))}
            />
            <label className="mt-2 flex items-center gap-2 text-xs text-[var(--gl-muted)]">
              <input
                type="checkbox"
                checked={draft.rough.manual}
                onChange={(e) => {
                  const manual = e.target.checked;
                  if (!manual) {
                    setDraft((p) => ({
                      ...p,
                      rough: { ...deriveRough(p.finished, millingAllowanceInches), manual: false },
                    }));
                  } else {
                    setDraft((p) => ({ ...p, rough: { ...p.rough, manual: true } }));
                  }
                }}
              />
              Manual rough (do not auto-follow finished + allowance)
            </label>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block text-sm">
              <span className="text-[var(--gl-cream-soft)]">Material</span>
              <input
                className="input-wood mt-1 w-full"
                value={draft.material.label}
                onChange={(e) => setDraft((d) => ({ ...d, material: { ...d.material, label: e.target.value } }))}
              />
            </label>
            <label className="block text-sm">
              <span className="text-[var(--gl-cream-soft)]">Thickness category</span>
              <input
                className="input-wood mt-1 w-full"
                value={draft.material.thicknessCategory}
                onChange={(e) =>
                  setDraft((d) => ({ ...d, material: { ...d.material, thicknessCategory: e.target.value } }))
                }
              />
            </label>
          </div>
          <label className="block text-sm">
            <span className="text-[var(--gl-cream-soft)]">Grain note</span>
            <input
              className="input-wood mt-1 w-full"
              value={draft.grainNote}
              onChange={(e) => setDraft((d) => ({ ...d, grainNote: e.target.value }))}
            />
          </label>
          <label className="block text-sm">
            <span className="text-[var(--gl-cream-soft)]">Status</span>
            <select
              className="input-wood mt-1 w-full"
              value={draft.status}
              onChange={(e) => setDraft((d) => ({ ...d, status: e.target.value as PartStatus }))}
            >
              {STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </label>

          <details className="rounded-lg border border-[var(--gl-border)] bg-[var(--gl-surface-inset)] p-3 text-xs">
            <summary className="cursor-pointer font-medium text-[var(--gl-cream-soft)]">Why these numbers?</summary>
            <p className="mt-2 leading-relaxed text-[var(--gl-muted)]">{whySummary}</p>
            <p className="mt-2 text-[var(--gl-muted)]">{derived.assumptions.joinery}</p>
            <p className="mt-1 text-[var(--gl-muted)]">{derived.assumptions.glueUp}</p>
          </details>
        </div>

        <div className="mt-6 flex flex-wrap items-center justify-between gap-2 border-t border-[var(--gl-border)] pt-4">
          <button
            type="button"
            className="text-sm text-[var(--gl-danger)] hover:underline"
            onClick={() => {
              if (confirm(`Remove “${draft.name}”?`)) onRemove();
            }}
          >
            Remove part
          </button>
          <div className="flex gap-2">
            <button
              type="button"
              className="rounded-lg border border-[var(--gl-border)] px-4 py-2 text-sm text-[var(--gl-muted)] hover:text-[var(--gl-cream)]"
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              type="button"
              className="rounded-lg border border-[var(--gl-copper-bright)]/50 bg-[var(--gl-copper)]/20 px-4 py-2 text-sm font-medium text-[var(--gl-cream)] hover:bg-[var(--gl-copper)]/30"
              onClick={() =>
                onSave({
                  name: draft.name,
                  assembly: draft.assembly,
                  quantity: draft.quantity,
                  finished: draft.finished,
                  rough: draft.rough,
                  material: draft.material,
                  grainNote: draft.grainNote,
                  status: draft.status,
                })
              }
            >
              Save
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Dim3Inputs({
  dim,
  onChange,
}: {
  dim: { t: number; w: number; l: number };
  onChange: (d: { t: number; w: number; l: number }) => void;
}) {
  const field = (key: "t" | "w" | "l", label: string): ReactNode => (
    <label className="flex items-center gap-2 text-xs text-[var(--gl-muted)]">
      <span className="w-3 shrink-0">{label}</span>
      <input
        type="number"
        step="any"
        className="input-wood min-w-0 flex-1 py-1.5 text-xs"
        value={Number.isFinite(dim[key]) ? dim[key] : 0}
        onChange={(e) => {
          const v = Number.parseFloat(e.target.value);
          onChange({ ...dim, [key]: Number.isFinite(v) ? v : 0 });
        }}
      />
      <span className="shrink-0 text-[var(--gl-cream-soft)]">{formatShopImperial(dim[key])}</span>
    </label>
  );
  return (
    <div className="mt-2 flex flex-col gap-2">
      {field("t", "T")}
      {field("w", "W")}
      {field("l", "L")}
    </div>
  );
}
