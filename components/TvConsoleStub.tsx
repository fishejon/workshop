"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useProject } from "@/components/ProjectContext";
import {
  buildConsoleShellCasework,
  CONSOLE_SHELL_REPLACE_ASSEMBLIES,
} from "@/lib/archetypes/casework";
import { parseInches } from "@/lib/imperial";

function parsePositive(s: string): number | null {
  const n = parseInches(s);
  if (n === null || n <= 0) return null;
  return n;
}

/**
 * Experimental TV-console / open-shelf shell: top, pair of sides, one fixed shelf.
 * Rough sizes follow project milling allowance; Case rows sync via replace like Sideboard console.
 */
export function TvConsoleStub() {
  const { project, replacePartsInAssemblies } = useProject();
  const [outerW, setOuterW] = useState("54");
  const [outerH, setOuterH] = useState("24");
  const [outerD, setOuterD] = useState("16");
  const [materialT, setMaterialT] = useState("0.75");

  const buildResult = useMemo(() => {
    const W = parsePositive(outerW);
    const H = parsePositive(outerH);
    const D = parsePositive(outerD);
    const t = parsePositive(materialT);
    if (W === null || H === null || D === null || t === null) return null;
    return buildConsoleShellCasework({
      outerWidth: W,
      outerHeight: H,
      outerDepth: D,
      materialThickness: t,
    });
  }, [outerW, outerH, outerD, materialT]);

  const consoleShellSyncSignature = useMemo(() => {
    if (!buildResult || buildResult.ok !== true) return null;
    return JSON.stringify({
      millingAllowanceInches: project.millingAllowanceInches,
      parts: buildResult.parts.map((p) => ({
        name: p.name,
        assembly: p.assembly,
        quantity: p.quantity,
        finished: p.finished,
        roughManual: p.rough.manual,
        material: p.material,
        grainNote: p.grainNote,
        status: p.status,
      })),
    });
  }, [buildResult, project.millingAllowanceInches]);

  const buildResultRef = useRef(buildResult);
  buildResultRef.current = buildResult;

  const replaceConsoleRef = useRef(replacePartsInAssemblies);
  replaceConsoleRef.current = replacePartsInAssemblies;

  useEffect(() => {
    if (consoleShellSyncSignature === null) return;
    const handle = window.setTimeout(() => {
      const br = buildResultRef.current;
      if (!br || br.ok !== true) return;
      replaceConsoleRef.current([...CONSOLE_SHELL_REPLACE_ASSEMBLIES], br.parts);
    }, 450);
    return () => window.clearTimeout(handle);
  }, [consoleShellSyncSignature]);

  const w = parsePositive(outerW);
  const h = parsePositive(outerH);
  const d = parsePositive(outerD);
  const t = parsePositive(materialT);
  const canAdd = w !== null && h !== null && d !== null && t !== null && w > 2 * t;

  return (
    <section className="rounded-2xl border border-[var(--gl-border)] bg-[var(--gl-surface)] p-6 shadow-[0_0_0_1px_var(--gl-border)]">
      <h2 className="font-display text-lg tracking-tight text-[var(--gl-cream)]">TV console (experimental)</h2>
      <p className="mt-2 text-sm leading-relaxed text-[var(--gl-muted)]">
        Early-access shell: overall box with a top, two sides, and one fixed shelf sized to inside width. Wire
        openings, partitions, and joinery are not modeled yet. While dimensions are valid,{" "}
        <strong className="font-medium text-[var(--gl-cream-soft)]">Case</strong> rows on the shared cut list stay in
        sync automatically.
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

      {!canAdd ? (
        <p className="mt-6 text-xs text-[var(--gl-warning)]">
          Enter positive overall sizes and stock thickness so the shell geometry (and cut list) can compute.
        </p>
      ) : null}
    </section>
  );
}
