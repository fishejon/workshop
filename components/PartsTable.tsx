"use client";

import { useMemo, useState, type ReactNode } from "react";
import { useProject } from "@/components/ProjectContext";
import {
  ASSEMBLY_IDS,
  type AssemblyId,
  type Part,
  type PartStatus,
  type ProjectJoint,
} from "@/lib/project-types";
import { derivePartAssumptionsDetailed } from "@/lib/part-assumptions";
import { deriveRough } from "@/lib/project-utils";
import { partsToCsv } from "@/lib/parts-csv";
import { formatImperial } from "@/lib/imperial";
import { canExportOrPrintProject } from "@/lib/validation";

const STATUS_OPTIONS: PartStatus[] = ["solid", "panel", "needs_milling"];

export function PartsTable({ explainAllowanceText }: { explainAllowanceText: string }) {
  const {
    project,
    validationIssues,
    blockingValidationIssues,
    warningValidationIssues,
    addPart,
    updatePart,
    removePart,
    clearParts,
    duplicateAssemblyGroup,
  } = useProject();
  const [openExplain, setOpenExplain] = useState<string | null>(null);
  const [selectedAssemblyToDuplicate, setSelectedAssemblyToDuplicate] = useState<AssemblyId>(ASSEMBLY_IDS[0]);
  const checkpointsReady =
    project.checkpoints.materialAssumptionsReviewed && project.checkpoints.joineryReviewed;
  const canExport = canExportOrPrintProject(checkpointsReady, validationIssues);

  function downloadCsv() {
    const blob = new Blob([partsToCsv(project.parts, project.joints, project)], { type: "text/csv;charset=utf-8" });
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
            Parts
          </p>
          <p className="mt-1 text-sm text-[var(--gl-muted)]">
            Finished vs rough (in). Rough defaults: each axis + milling allowance until you edit rough.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <div className="flex items-center gap-2 rounded-lg border border-[var(--gl-border)] bg-[var(--gl-surface-muted)] px-2 py-1">
            <select
              className="input-wood py-1.5 text-xs"
              value={selectedAssemblyToDuplicate}
              onChange={(e) => setSelectedAssemblyToDuplicate(e.target.value as AssemblyId)}
            >
              {ASSEMBLY_IDS.map((assembly) => (
                <option key={assembly} value={assembly}>
                  {assembly}
                </option>
              ))}
            </select>
            <button
              type="button"
              className="rounded-lg border border-[var(--gl-border-strong)] px-2 py-1.5 text-xs text-[var(--gl-cream)] hover:bg-[var(--gl-surface-muted)] disabled:opacity-40"
              disabled={!project.parts.some((part) => part.assembly === selectedAssemblyToDuplicate)}
              onClick={() => duplicateAssemblyGroup(selectedAssemblyToDuplicate)}
            >
              Duplicate assembly group
            </button>
          </div>
          <button
            type="button"
            className="rounded-lg border border-[var(--gl-border-strong)] bg-[var(--gl-surface-muted)] px-3 py-2 text-xs font-medium text-[var(--gl-cream)] hover:bg-[var(--gl-surface-muted)]"
            onClick={() =>
              addPart({
                name: "New part",
                assembly: "Other",
                quantity: 1,
                finished: { t: 0.75, w: 3, l: 24 },
                rough: { ...deriveRough({ t: 0.75, w: 3, l: 24 }, project.millingAllowanceInches), manual: false },
                material: { label: "Hardwood", thicknessCategory: "4/4" },
                grainNote: "",
                status: "solid",
              })
            }
          >
            Add row
          </button>
          <button
            type="button"
            className="rounded-lg border border-[var(--gl-border)] px-3 py-2 text-xs text-[var(--gl-muted)] hover:text-[var(--gl-cream)]"
            onClick={() => {
              if (
                confirm("Clear all parts? Joinery history for this project will also be removed.")
              ) {
                clearParts();
              }
            }}
          >
            Clear all
          </button>
          <button
            type="button"
            className="rounded-lg border border-[var(--gl-copper)]/40 bg-[var(--gl-copper)]/15 px-3 py-2 text-xs font-medium text-[var(--gl-cream)] hover:bg-[var(--gl-copper)]/25"
            onClick={downloadCsv}
            disabled={project.parts.length === 0 || !canExport}
            aria-disabled={project.parts.length === 0 || !canExport}
            title={!canExport ? "Acknowledge both Review checkpoints (Release to shop) to unlock export." : undefined}
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
            : "Export is locked until you acknowledge material assumptions and joinery review in Review (Release to shop)."}
        </p>
      ) : null}
      {blockingValidationIssues.length > 0 ? (
        <ul
          className="mt-2 list-disc space-y-1 pl-5 text-xs text-[var(--gl-danger)]"
          aria-label={`Blocking issues: ${blockingValidationIssues.length}`}
        >
          {blockingValidationIssues.slice(0, 4).map((issue) => (
            <li key={issue.id}>{issue.message}</li>
          ))}
        </ul>
      ) : null}
      {warningValidationIssues.length > 0 ? (
        <p className="mt-2 text-xs text-[var(--gl-warning)]">
          {warningValidationIssues.length} warning{warningValidationIssues.length === 1 ? "" : "s"} detected. Review before handoff.
        </p>
      ) : null}

      {project.parts.length === 0 ? (
        <p className="mt-6 text-sm text-[var(--gl-muted)]">No parts yet — add from Dresser results or manually.</p>
      ) : (
        <div className="mt-4 max-h-[min(60vh,640px)] overflow-auto rounded-xl border border-[var(--gl-border)]">
          <table className="gl-numeric w-full min-w-[880px] text-left text-xs">
            <thead className="sticky top-0 z-10 bg-[var(--gl-ink)]/98 text-xs tracking-wide text-[var(--gl-muted)] uppercase">
              <tr>
                <th className="px-2 py-2 font-medium">Name</th>
                <th className="px-2 py-2 font-medium">Asm</th>
                <th className="px-2 py-2 font-medium">Qty</th>
                <th className="px-2 py-2 font-medium">Fin T×W×L</th>
                <th className="px-2 py-2 font-medium">Rough T×W×L</th>
                <th className="px-2 py-2 font-medium">Manual</th>
                <th className="px-2 py-2 font-medium">Material</th>
                <th className="px-2 py-2 font-medium">Thick cat</th>
                <th className="px-2 py-2 font-medium">Grain</th>
                <th className="px-2 py-2 font-medium">Status</th>
                <th className="px-2 py-2 font-medium">Assumptions</th>
                <th className="px-2 py-2 font-medium">Prov</th>
                <th className="px-2 py-2 font-medium" />
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--gl-border)] text-[var(--gl-cream)]">
              {project.parts.map((p) => (
                <PartRow
                  key={p.id}
                  part={p}
                  millingAllowanceInches={project.millingAllowanceInches}
                  maxPurchasableBoardWidthInches={project.maxPurchasableBoardWidthInches}
                  stockWidthByMaterialGroup={project.stockWidthByMaterialGroup}
                  openExplain={openExplain === p.id}
                  onToggleExplain={() => setOpenExplain((x) => (x === p.id ? null : p.id))}
                  joints={project.joints}
                  onUpdate={updatePart}
                  onRemove={() => removePart(p.id)}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

function PartRow({
  part,
  millingAllowanceInches,
  maxPurchasableBoardWidthInches,
  stockWidthByMaterialGroup,
  openExplain,
  onToggleExplain,
  joints,
  onUpdate,
  onRemove,
}: {
  part: Part;
  millingAllowanceInches: number;
  maxPurchasableBoardWidthInches: number;
  stockWidthByMaterialGroup?: Record<string, number>;
  openExplain: boolean;
  onToggleExplain: () => void;
  joints: ProjectJoint[];
  onUpdate: (id: string, patch: Partial<Part>) => void;
  onRemove: () => void;
}) {
  const derived = useMemo(
    () =>
      derivePartAssumptionsDetailed(part, joints, {
        maxPurchasableBoardWidthInches,
        stockWidthByMaterialGroup,
      }),
    [part, joints, maxPurchasableBoardWidthInches, stockWidthByMaterialGroup]
  );
  const provenance = derived.provenance;
  const assumptions = derived.assumptions;
  const summary = useMemo(
    () => {
      const roughSummary =
        provenance.roughSource === "manual"
          ? "Rough dims are manually overridden for this part."
          : `Rough dims are derived from finished + ${formatImperial(millingAllowanceInches)} allowance on T, W, and L.`;
      const joinerySummary =
        provenance.joineryChangeCount > 0
          ? `Joinery changed this part ${provenance.joineryChangeCount} time${provenance.joineryChangeCount === 1 ? "" : "s"}.`
          : "No joinery rule has changed this part's finished dimensions.";
      const glueSummary = derived.glueUpPlan.applicable
        ? `Glue-up strips: ${derived.glueUpPlan.stripCount}; board width source: ${derived.glueUpPlan.boardWidthSource}.`
        : "Glue-up not applicable.";
      return (
        `${roughSummary} ` +
        `Displayed: ${formatImperial(part.finished.t)}→${formatImperial(part.rough.t)}, ` +
        `${formatImperial(part.finished.w)}→${formatImperial(part.rough.w)}, ` +
        `${formatImperial(part.finished.l)}→${formatImperial(part.rough.l)}. ` +
        `${joinerySummary} ${glueSummary}`
      );
    },
    [part, millingAllowanceInches, provenance, derived]
  );

  return (
    <>
      <tr id={`part-row-${part.id}`} tabIndex={-1} className="bg-[var(--gl-surface-inset)] align-top">
        <td className="px-2 py-2">
          <input
            className="input-wood max-w-[140px] py-1.5 text-xs"
            value={part.name}
            onChange={(e) => onUpdate(part.id, { name: e.target.value })}
          />
        </td>
        <td className="px-2 py-2">
          <select
            className="input-wood max-w-[100px] py-1.5 text-xs"
            value={part.assembly}
            onChange={(e) => onUpdate(part.id, { assembly: e.target.value as AssemblyId })}
          >
            {ASSEMBLY_IDS.map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>
        </td>
        <td className="px-2 py-2">
          <input
            type="number"
            min={1}
            className="input-wood w-14 py-1.5 text-xs"
            value={part.quantity}
            onChange={(e) => onUpdate(part.id, { quantity: Math.max(1, Number(e.target.value) || 1) })}
          />
        </td>
        <td className="px-2 py-2">
          <Dim3Inputs
            dim={part.finished}
            onChange={(d) => {
              const nextFin = d;
              const rough = part.rough.manual
                ? part.rough
                : { ...deriveRough(nextFin, millingAllowanceInches), manual: false };
              onUpdate(part.id, { finished: nextFin, rough });
            }}
          />
        </td>
        <td className="px-2 py-2">
          <Dim3Inputs
            dim={part.rough}
            onChange={(d) => onUpdate(part.id, { rough: { ...d, manual: true } })}
          />
        </td>
        <td className="px-2 py-2">
          <input
            type="checkbox"
            checked={part.rough.manual}
            onChange={(e) => {
              const manual = e.target.checked;
              if (!manual) {
                onUpdate(part.id, {
                  rough: { ...deriveRough(part.finished, millingAllowanceInches), manual: false },
                });
              } else {
                onUpdate(part.id, { rough: { ...part.rough, manual: true } });
              }
            }}
            aria-label="Manual rough dimensions"
          />
        </td>
        <td className="px-2 py-2">
          <input
            className="input-wood max-w-[100px] py-1.5 text-xs"
            value={part.material.label}
            onChange={(e) =>
              onUpdate(part.id, { material: { ...part.material, label: e.target.value } })
            }
          />
        </td>
        <td className="px-2 py-2">
          <input
            className="input-wood max-w-[72px] py-1.5 text-xs"
            value={part.material.thicknessCategory}
            onChange={(e) =>
              onUpdate(part.id, { material: { ...part.material, thicknessCategory: e.target.value } })
            }
          />
        </td>
        <td className="px-2 py-2">
          <input
            className="input-wood max-w-[100px] py-1.5 text-xs"
            value={part.grainNote}
            onChange={(e) => onUpdate(part.id, { grainNote: e.target.value })}
          />
        </td>
        <td className="px-2 py-2">
          <select
            className="input-wood max-w-[110px] py-1.5 text-xs"
            value={part.status}
            onChange={(e) => onUpdate(part.id, { status: e.target.value as PartStatus })}
          >
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </td>
        <td className="px-2 py-2">
          <div className="max-w-[220px] space-y-1 text-xs leading-snug text-[var(--gl-muted)]">
            <p>{assumptions.joinery}</p>
            <p>{assumptions.glueUp}</p>
          </div>
        </td>
        <td className="px-2 py-2">
          <div className="flex max-w-[130px] flex-wrap gap-1">
            <ProvenancePill
              title={
                provenance.roughSource === "manual"
                  ? "Rough dimensions are manually controlled."
                  : "Rough dimensions auto-track finished size and milling allowance."
              }
            >
              {provenance.roughSource === "manual" ? "Rough: manual" : "Rough: derived"}
            </ProvenancePill>
            <ProvenancePill
              title={
                provenance.joineryChangeCount > 0
                  ? `Joinery adjusted this part ${provenance.joineryChangeCount} time(s).`
                  : "No joinery dimension changes recorded for this part."
              }
            >
              {provenance.joineryChangeCount > 0 ? `Joinery: ${provenance.joineryChangeCount}` : "Joinery: none"}
            </ProvenancePill>
            {provenance.joineryReferenceCount > 0 ? (
              <ProvenancePill title="This part was selected as a mate in joinery history.">
                Mate refs: {provenance.joineryReferenceCount}
              </ProvenancePill>
            ) : null}
          </div>
        </td>
        <td className="px-2 py-2">
          <div className="flex flex-col gap-1">
            <button
              type="button"
              className="text-xs text-[var(--gl-copper-bright)] hover:underline"
              onClick={onToggleExplain}
            >
              {openExplain ? "Hide why" : "Why?"}
            </button>
            <button
              type="button"
              className="text-xs text-[var(--gl-muted)] hover:text-[var(--gl-danger)]"
              onClick={onRemove}
            >
              Remove
            </button>
          </div>
        </td>
      </tr>
      {openExplain ? (
        <tr className="bg-[var(--gl-surface-muted)]">
          <td colSpan={13} className="px-3 py-2 text-xs text-[var(--gl-muted)]">
            {summary}
          </td>
        </tr>
      ) : null}
    </>
  );
}

function ProvenancePill({ title, children }: { title: string; children: ReactNode }) {
  return (
    <span
      className="rounded-full border border-[var(--gl-border)] bg-[var(--gl-surface-inset)] px-2 py-0.5 text-xs text-[var(--gl-cream-soft)]"
      title={title}
    >
      {children}
    </span>
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
    <label className="flex items-center gap-1 text-xs text-[var(--gl-muted)]">
      <span>{label}</span>
      <input
        type="number"
        step="any"
        className="input-wood w-[4.25rem] py-1 text-xs"
        value={Number.isFinite(dim[key]) ? dim[key] : 0}
        onChange={(e) => {
          const v = Number.parseFloat(e.target.value);
          onChange({ ...dim, [key]: Number.isFinite(v) ? v : 0 });
        }}
      />
    </label>
  );
  return (
    <div className="flex flex-col gap-1">
      <div className="flex flex-wrap gap-1">
        {field("t", "T")}
        {field("w", "W")}
        {field("l", "L")}
      </div>
      <span className="text-xs text-[var(--gl-muted)]">
        {formatImperial(dim.t)} × {formatImperial(dim.w)} × {formatImperial(dim.l)}
      </span>
    </div>
  );
}
