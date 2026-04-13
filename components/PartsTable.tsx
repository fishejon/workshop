"use client";

import { useMemo, useState, type ReactNode } from "react";
import { useProject } from "@/components/ProjectContext";
import { ASSEMBLY_IDS, type AssemblyId, type Part, type PartStatus, type ProjectJoint } from "@/lib/project-types";
import { formatJointRuleLabel, summarizePartProvenance } from "@/lib/part-provenance";
import { deriveRough } from "@/lib/project-utils";
import { boardFeetForPart, linearFeetForPart } from "@/lib/board-feet";
import { formatImperial } from "@/lib/imperial";

const STATUS_OPTIONS: PartStatus[] = ["solid", "panel", "needs_milling"];

function partsToCsv(parts: Part[]): string {
  const headers = [
    "name",
    "assembly",
    "quantity",
    "finished_t_in",
    "finished_w_in",
    "finished_l_in",
    "rough_t_in",
    "rough_w_in",
    "rough_l_in",
    "rough_manual",
    "board_feet_each",
    "board_feet_total",
    "linear_feet_each",
    "linear_feet_total",
    "material",
    "thickness_category",
    "grain_note",
    "status",
  ];
  const rows = parts.map((p) => {
    const qty = Math.max(1, p.quantity);
    const bfEach = boardFeetForPart(p);
    const lfEach = linearFeetForPart(p);
    return [
      csvEscape(p.name),
      p.assembly,
      p.quantity,
      p.finished.t,
      p.finished.w,
      p.finished.l,
      p.rough.t,
      p.rough.w,
      p.rough.l,
      p.rough.manual,
      bfEach,
      bfEach * qty,
      lfEach,
      lfEach * qty,
      csvEscape(p.material.label),
      csvEscape(p.material.thicknessCategory),
      csvEscape(p.grainNote),
      p.status,
    ].join(",");
  });
  return [headers.join(","), ...rows].join("\n");
}

function csvEscape(s: string): string {
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

export function PartsTable({ explainAllowanceText }: { explainAllowanceText: string }) {
  const { project, addPart, updatePart, removePart, clearParts } = useProject();
  const [openExplain, setOpenExplain] = useState<string | null>(null);

  function downloadCsv() {
    const blob = new Blob([partsToCsv(project.parts)], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${project.name.replace(/\s+/g, "-").toLowerCase() || "grainline"}-parts.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <section className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 backdrop-blur-md">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-medium tracking-widest text-[var(--gl-muted)] uppercase">Parts</p>
          <p className="mt-1 text-sm text-[var(--gl-muted)]">
            Finished vs rough (in). Rough defaults: each axis + milling allowance until you edit rough.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className="rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-xs font-medium text-[var(--gl-cream)] hover:bg-white/15"
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
            className="rounded-lg border border-white/15 px-3 py-2 text-xs text-[var(--gl-muted)] hover:text-[var(--gl-cream)]"
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
            disabled={project.parts.length === 0}
          >
            Export CSV
          </button>
        </div>
      </div>

      <p className="mt-2 text-xs text-[var(--gl-muted)]">{explainAllowanceText}</p>

      {project.parts.length === 0 ? (
        <p className="mt-6 text-sm text-[var(--gl-muted)]">No parts yet — add from Dresser results or manually.</p>
      ) : (
        <div className="mt-4 max-h-[min(60vh,640px)] overflow-auto rounded-xl border border-white/10">
          <table className="w-full min-w-[880px] text-left text-xs">
            <thead className="sticky top-0 z-10 bg-[var(--gl-ink)]/98 text-[10px] tracking-wide text-[var(--gl-muted)] uppercase">
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
                <th className="px-2 py-2 font-medium">Prov</th>
                <th className="px-2 py-2 font-medium" />
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10 text-[var(--gl-cream)]">
              {project.parts.map((p) => (
                <PartRow
                  key={p.id}
                  part={p}
                  millingAllowanceInches={project.millingAllowanceInches}
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
  openExplain,
  onToggleExplain,
  joints,
  onUpdate,
  onRemove,
}: {
  part: Part;
  millingAllowanceInches: number;
  openExplain: boolean;
  onToggleExplain: () => void;
  joints: ProjectJoint[];
  onUpdate: (id: string, patch: Partial<Part>) => void;
  onRemove: () => void;
}) {
  const provenance = useMemo(() => summarizePartProvenance(part, joints), [part, joints]);
  const summary = useMemo(
    () => {
      const roughSummary =
        provenance.roughSource === "manual"
          ? "Rough dims are manually overridden for this part."
          : `Rough dims are derived from finished + ${formatImperial(millingAllowanceInches)} allowance on T, W, and L.`;
      const joinerySummary =
        provenance.joineryChangeCount > 0
          ? `Joinery changed this part ${provenance.joineryChangeCount} time${provenance.joineryChangeCount === 1 ? "" : "s"}${provenance.lastJoineryRuleId ? ` (latest: ${formatJointRuleLabel(provenance.lastJoineryRuleId)}).` : "."}`
          : "No joinery rule has changed this part's finished dimensions.";
      return (
        `${roughSummary} ` +
        `Displayed: ${formatImperial(part.finished.t)}→${formatImperial(part.rough.t)}, ` +
        `${formatImperial(part.finished.w)}→${formatImperial(part.rough.w)}, ` +
        `${formatImperial(part.finished.l)}→${formatImperial(part.rough.l)}. ` +
        joinerySummary
      );
    },
    [part, millingAllowanceInches, provenance]
  );

  return (
    <>
      <tr className="bg-white/[0.02] align-top">
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
              className="text-[10px] text-[var(--gl-copper-bright)] hover:underline"
              onClick={onToggleExplain}
            >
              {openExplain ? "Hide why" : "Why?"}
            </button>
            <button
              type="button"
              className="text-[10px] text-white/40 hover:text-red-300"
              onClick={onRemove}
            >
              Remove
            </button>
          </div>
        </td>
      </tr>
      {openExplain ? (
        <tr className="bg-black/25">
          <td colSpan={12} className="px-3 py-2 text-xs text-[var(--gl-muted)]">
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
      className="rounded-full border border-white/15 bg-black/30 px-2 py-0.5 text-[10px] text-[var(--gl-cream-soft)]"
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
    <label className="flex items-center gap-1 text-[10px] text-[var(--gl-muted)]">
      <span>{label}</span>
      <input
        type="number"
        step="any"
        className="input-wood w-[4.25rem] py-1 text-[10px]"
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
      <span className="text-[9px] text-[var(--gl-muted)]">
        {formatImperial(dim.t)} × {formatImperial(dim.w)} × {formatImperial(dim.l)}
      </span>
    </div>
  );
}
