"use client";

import { useState } from "react";
import { useProject } from "@/components/ProjectContext";
import { buildConsoleShellCasework } from "@/lib/archetypes/casework";
import { parseInches } from "@/lib/imperial";

function parsePositive(s: string): number | null {
  const n = parseInches(s);
  if (n === null || n <= 0) return null;
  return n;
}

/**
 * Minimal TV-console / open-shelf shell: top, pair of sides, one fixed shelf.
 * Rough sizes follow project milling allowance via addParts (non-manual rough).
 */
export function TvConsoleStub() {
  const { addParts } = useProject();
  const [outerW, setOuterW] = useState("54");
  const [outerH, setOuterH] = useState("24");
  const [outerD, setOuterD] = useState("16");
  const [materialT, setMaterialT] = useState("0.75");

  function handleAddShell() {
    const W = parsePositive(outerW);
    const H = parsePositive(outerH);
    const D = parsePositive(outerD);
    const t = parsePositive(materialT);
    if (W === null || H === null || D === null || t === null) return;

    const built = buildConsoleShellCasework({
      outerWidth: W,
      outerHeight: H,
      outerDepth: D,
      materialThickness: t,
    });
    if (!built.ok) return;

    addParts(built.parts);
  }

  const w = parsePositive(outerW);
  const h = parsePositive(outerH);
  const d = parsePositive(outerD);
  const t = parsePositive(materialT);
  const canAdd = w !== null && h !== null && d !== null && t !== null && w > 2 * t;

  return (
    <section className="rounded-2xl border border-white/10 bg-white/[0.04] p-6 shadow-[0_0_0_1px_rgba(255,255,255,0.04)] backdrop-blur-md">
      <h2 className="font-display text-lg tracking-tight text-[var(--gl-cream)]">TV console (stub)</h2>
      <p className="mt-2 text-sm leading-relaxed text-[var(--gl-muted)]">
        Placeholder shell: overall box with a top, two sides, and one fixed shelf sized to inside width. Wire
        openings, partitions, and joinery are not modeled yet — use the{" "}
        <strong className="font-medium text-[var(--gl-cream-soft)]">Dresser</strong> preset for a fuller case
        workflow, or edit parts manually in <strong className="font-medium text-[var(--gl-cream-soft)]">Shop</strong>.
      </p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <label className="block text-sm">
          <span className="text-[var(--gl-muted)]">Overall width</span>
          <input className="input-wood mt-1" value={outerW} onChange={(e) => setOuterW(e.target.value)} />
        </label>
        <label className="block text-sm">
          <span className="text-[var(--gl-muted)]">Overall height</span>
          <input className="input-wood mt-1" value={outerH} onChange={(e) => setOuterH(e.target.value)} />
        </label>
        <label className="block text-sm">
          <span className="text-[var(--gl-muted)]">Overall depth</span>
          <input className="input-wood mt-1" value={outerD} onChange={(e) => setOuterD(e.target.value)} />
        </label>
        <label className="block text-sm">
          <span className="text-[var(--gl-muted)]">Stock thickness</span>
          <input className="input-wood mt-1" value={materialT} onChange={(e) => setMaterialT(e.target.value)} />
        </label>
      </div>

      <button
        type="button"
        disabled={!canAdd}
        onClick={handleAddShell}
        className="mt-6 rounded-xl bg-[var(--gl-copper)] px-4 py-2.5 text-sm font-semibold text-[var(--gl-bg)] transition hover:bg-[var(--gl-copper-bright)] disabled:cursor-not-allowed disabled:opacity-40"
      >
        Add shell parts to project
      </button>
    </section>
  );
}
