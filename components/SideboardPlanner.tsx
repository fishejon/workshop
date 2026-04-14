"use client";

import { useMemo, useState } from "react";
import { useProject } from "@/components/ProjectContext";
import { buildConsoleShellCasework } from "@/lib/archetypes/casework";
import { formatImperial, parseInches } from "@/lib/imperial";

function parsePositive(s: string): number | null {
  const n = parseInches(s);
  if (n === null || n <= 0) return null;
  return n;
}

export function SideboardPlanner() {
  const { addParts, project } = useProject();
  const [outerW, setOuterW] = useState("66");
  const [outerH, setOuterH] = useState("30");
  const [outerD, setOuterD] = useState("18");
  const [materialT, setMaterialT] = useState("0.75");
  const [shelfBackset, setShelfBackset] = useState("0.25");
  const [lastExplain, setLastExplain] = useState("");

  const buildResult = useMemo(() => {
    const W = parsePositive(outerW);
    const H = parsePositive(outerH);
    const D = parsePositive(outerD);
    const t = parsePositive(materialT);
    const backset = parseInches(shelfBackset);
    if (W === null || H === null || D === null || t === null || backset === null || backset < 0) return null;
    return buildConsoleShellCasework({
      outerWidth: W,
      outerHeight: H,
      outerDepth: D,
      materialThickness: t,
      shelfDepthBacksetInches: backset,
    });
  }, [outerW, outerH, outerD, materialT, shelfBackset]);

  const warnings = useMemo(() => {
    const W = parsePositive(outerW);
    const H = parsePositive(outerH);
    const D = parsePositive(outerD);
    const t = parsePositive(materialT);
    if (W === null || H === null || D === null || t === null) return [];
    const next: string[] = [];
    if (W / H > 2.8) next.push("Very wide and low proportions; consider a center support or thicker top.");
    if (D < 14) next.push("Depth is tight for A/V gear or drawer slides.");
    if (W > 84) next.push("Over 84 in can be hard to transport and may need split construction.");
    if (t < 0.7) next.push("Stock under 0.7 in can feel light for a long sideboard span.");
    return next;
  }, [outerW, outerH, outerD, materialT]);

  function applyRecommendation() {
    if (project.workshop.lumberProfile === "sheet_goods") {
      setMaterialT("0.75");
      setShelfBackset("0");
      setLastExplain("Applied sheet-goods defaults: 3/4 stock and flush shelf depth.");
      return;
    }
    if (project.workshop.lumberProfile === "rough_hardwood") {
      setMaterialT("0.875");
      setShelfBackset("0.25");
      setLastExplain("Applied rough-mill defaults: thicker stock and slight shelf backset.");
      return;
    }
    setMaterialT("0.75");
    setShelfBackset("0.25");
    setLastExplain("Applied general hardwood defaults for sideboard shell.");
  }

  function handleAdd() {
    if (!buildResult || !buildResult.ok) return;
    addParts(buildResult.parts);
    setLastExplain(
      `Added ${buildResult.parts.length} sideboard shell part rows using ${formatImperial(parsePositive(materialT) ?? 0)} stock.`
    );
  }

  return (
    <section className="rounded-2xl border border-[var(--gl-border)] bg-[var(--gl-surface)] p-6 shadow-[0_0_0_1px_var(--gl-border)]">
      <h2 className="font-display text-lg tracking-tight text-[var(--gl-cream)]">Sideboard console</h2>
      <p className="mt-2 text-sm text-[var(--gl-muted)]">
        Archetype-backed shell planner using the shared casework pipeline (parts, joinery panel, buy list, print).
      </p>
      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <Field label="Overall width" value={outerW} setValue={setOuterW} />
        <Field label="Overall height" value={outerH} setValue={setOuterH} />
        <Field label="Overall depth" value={outerD} setValue={setOuterD} />
        <Field label="Stock thickness" value={materialT} setValue={setMaterialT} />
        <Field label="Shelf backset" value={shelfBackset} setValue={setShelfBackset} />
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          className="rounded-lg border border-[var(--gl-border-strong)] bg-[var(--gl-surface-muted)] px-3 py-2 text-xs font-medium text-[var(--gl-cream)] hover:bg-[var(--gl-surface-muted)]"
          onClick={applyRecommendation}
        >
          Apply workshop defaults
        </button>
        <button
          type="button"
          disabled={!buildResult || buildResult.ok !== true}
          className="rounded-xl bg-[var(--gl-copper)] px-4 py-2.5 text-sm font-semibold text-[var(--gl-on-accent)] transition hover:bg-[var(--gl-copper-bright)] disabled:cursor-not-allowed disabled:opacity-40"
          onClick={handleAdd}
        >
          Add sideboard shell parts
        </button>
      </div>
      {buildResult && buildResult.ok === false ? (
        <p className="mt-3 text-sm text-[var(--gl-danger)]">{buildResult.reason}</p>
      ) : null}
      {warnings.length > 0 ? (
        <ul className="mt-3 space-y-1 rounded-lg border border-[color-mix(in_srgb,var(--gl-warning)_30%,var(--gl-border))] bg-[var(--gl-warning-bg)] p-3 text-xs text-[var(--gl-warning)]">
          {warnings.map((warning) => (
            <li key={warning}>- {warning}</li>
          ))}
        </ul>
      ) : null}
      {lastExplain ? <p className="mt-3 text-xs text-[var(--gl-cream-soft)]">{lastExplain}</p> : null}
    </section>
  );
}

function Field({
  label,
  value,
  setValue,
}: {
  label: string;
  value: string;
  setValue: (next: string) => void;
}) {
  return (
    <label className="block text-sm">
      <span className="text-[var(--gl-muted)]">{label}</span>
      <input className="input-wood mt-1" value={value} onChange={(e) => setValue(e.target.value)} />
    </label>
  );
}
