"use client";

/* eslint-disable react-hooks/preserve-manual-memoization -- manual memo deps are intentional; React Compiler rule misfires here */
import { useMemo, useState, type ReactNode } from "react";
import { useProject } from "@/components/ProjectContext";
import { DresserPreview } from "@/components/DresserPreview";
import { buildDresserCarcassParts } from "@/lib/dresser-carcass";
import {
  budgetForRowOpeningHeights,
  computeDresser,
  outerHeightFromRowOpenings,
  type DresserColumnCount,
} from "@/lib/dresser-engine";
import type { Part } from "@/lib/project-types";
import { formatImperial, parseInches } from "@/lib/imperial";

const SLIDE_PRESETS = {
  sideMount: { label: "Side-mount slides (rule of thumb)", w: 0.5, h: 0.25 },
  tight: { label: "Tighter side-mount", w: 0.375, h: 0.1875 },
  undermount: { label: "Undermount (placeholder — verify mfg.)", w: 0.125, h: 0.75 },
  custom: { label: "Custom clearances", w: 0.5, h: 0.25 },
} as const;

type SlideKey = keyof typeof SLIDE_PRESETS;

function parsePositive(s: string): number | null {
  const n = parseInches(s);
  if (n === null || n <= 0) return null;
  return n;
}

export function DresserPlanner() {
  const { addParts } = useProject();

  const [outerW, setOuterW] = useState("48");
  const [outerH, setOuterH] = useState("34");
  const [outerD, setOuterD] = useState("18");
  const [materialT, setMaterialT] = useState("0.75");
  const [columns, setColumns] = useState<DresserColumnCount>(2);
  const [rows, setRows] = useState("3");
  /** Each drawer row opening height in inches (must sum to case budget — see hint below). */
  const [rowOpeningHeights, setRowOpeningHeights] = useState<string[]>(["10", "10", "10.25"]);
  const [kick, setKick] = useState("0");
  const [topAsm, setTopAsm] = useState("1.5");
  const [bottomPanel, setBottomPanel] = useState("0.75");
  const [rail, setRail] = useState("0.75");
  const [backT, setBackT] = useState("0.25");
  const [rearClear, setRearClear] = useState("0.5");
  const [slideLen, setSlideLen] = useState("22");
  const [slidePreset, setSlidePreset] = useState<SlideKey>("sideMount");
  const [slideWClr, setSlideWClr] = useState(String(SLIDE_PRESETS.sideMount.w));
  const [slideHClr, setSlideHClr] = useState(String(SLIDE_PRESETS.sideMount.h));

  const [backsolve, setBacksolve] = useState<string[]>(["", "", ""]);

  function applySlidePreset(key: SlideKey) {
    setSlidePreset(key);
    if (key !== "custom") {
      const p = SLIDE_PRESETS[key];
      setSlideWClr(String(p.w));
      setSlideHClr(String(p.h));
    }
  }

  const rowCount = Number.parseInt(rows, 10);

  function syncRowOpeningFields(n: number) {
    setRowOpeningHeights((prev) => {
      const next = prev.slice(0, n);
      const pad = next[next.length - 1] ?? "8";
      while (next.length < n) next.push(pad);
      return next;
    });
    setBacksolve((prev) => {
      const next = prev.slice(0, n);
      while (next.length < n) next.push("");
      return next;
    });
  }

  function fillEqualRowOpenings() {
    const h = parsePositive(outerH);
    const k = parseInches(kick.trim() === "" ? "0" : kick) ?? 0;
    const top = parseInches(topAsm);
    const bot = parseInches(bottomPanel);
    const r = parseInches(rail);
    if (h === null || top === null || bot === null || r === null || k < 0 || !Number.isFinite(rowCount) || rowCount < 1) {
      return;
    }
    const bud = budgetForRowOpeningHeights({
      outerHeight: h,
      kickHeight: k,
      topAssemblyHeight: top,
      bottomPanelThickness: bot,
      rowCount,
      railBetweenDrawers: r,
    });
    if (bud === null) return;
    const each = bud / rowCount;
    const s = each.toFixed(3).replace(/\.?0+$/, "");
    setRowOpeningHeights(Array.from({ length: rowCount }, () => s));
  }

  const carcassResult = useMemo(() => {
    if (!Number.isFinite(rowCount) || rowCount < 1) {
      return { ok: false as const, message: "Row count must be at least 1." };
    }
    const w = parsePositive(outerW);
    const h = parsePositive(outerH);
    const d = parsePositive(outerD);
    const t = parsePositive(materialT);
    const k = parseInches(kick.trim() === "" ? "0" : kick);
    const top = parseInches(topAsm);
    const bot = parseInches(bottomPanel);
    const r = parseInches(rail);
    const b = parseInches(backT);

    if (w === null || h === null || d === null || t === null) {
      return { ok: false as const, message: "Enter valid overall W × H × D and material thickness." };
    }
    if (k === null || k < 0 || top === null || top < 0 || bot === null || bot < 0) {
      return { ok: false as const, message: "Top/bottom must be valid; kick can be 0." };
    }
    if (r === null || r < 0 || b === null || b < 0) {
      return { ok: false as const, message: "Rails and back thickness must be valid (≥ 0)." };
    }

    return buildDresserCarcassParts({
      outerWidth: w,
      outerHeight: h,
      outerDepth: d,
      materialThickness: t,
      columnCount: columns,
      kickHeight: k,
      topAssemblyHeight: top,
      bottomPanelThickness: bot,
      rowCount,
      railBetweenDrawers: r,
      backThickness: b,
    });
  }, [
    outerW,
    outerH,
    outerD,
    materialT,
    columns,
    rowCount,
    kick,
    topAsm,
    bottomPanel,
    rail,
    backT,
  ]);

  const result = useMemo(() => {
    if (!Number.isFinite(rowCount) || rowCount < 1) {
      return { ok: false as const, message: "Row count must be at least 1." };
    }
    const w = parsePositive(outerW);
    const h = parsePositive(outerH);
    const d = parsePositive(outerD);
    const t = parsePositive(materialT);
    const k = parseInches(kick.trim() === "" ? "0" : kick);
    const top = parseInches(topAsm);
    const bot = parseInches(bottomPanel);
    const r = parseInches(rail);
    const b = parseInches(backT);
    const rc = parseInches(rearClear);
    const sl = parsePositive(slideLen);
    const sw = parseInches(slideWClr);
    const sh = parseInches(slideHClr);

    if (w === null || h === null || d === null || t === null) {
      return { ok: false as const, message: "Enter valid overall W × H × D and material thickness." };
    }
    if (k === null || k < 0 || top === null || top < 0 || bot === null || bot < 0) {
      return { ok: false as const, message: "Top/bottom must be valid; kick can be 0 (e.g. legs instead of toe kick)." };
    }
    if (r === null || r < 0 || b === null || b < 0 || rc === null || rc < 0) {
      return { ok: false as const, message: "Rails, back, and rear clearance must be valid (≥ 0)." };
    }
    if (sl === null || sw === null || sh === null || sw < 0 || sh < 0) {
      return { ok: false as const, message: "Slide length and clearances must be valid numbers." };
    }

    const openingHeights = rowOpeningHeights.slice(0, rowCount).map((s) => {
      const v = parseInches(s.trim());
      if (v === null || v <= 0) return NaN;
      return v;
    });
    if (openingHeights.some((x) => Number.isNaN(x))) {
      return { ok: false as const, message: "Each row needs a positive opening height in inches (e.g. 8 or 7 1/2)." };
    }

    return computeDresser({
      outerWidth: w,
      outerHeight: h,
      outerDepth: d,
      materialThickness: t,
      columnCount: columns,
      rowCount,
      rowOpeningHeightsInches: openingHeights,
      kickHeight: k,
      topAssemblyHeight: top,
      bottomPanelThickness: bot,
      railBetweenDrawers: r,
      backThickness: b,
      rearClearanceForBox: rc,
      slideLengthNominal: sl,
      slideWidthClearance: sw,
      slideHeightClearance: sh,
    });
  }, [
    outerW,
    outerH,
    outerD,
    materialT,
    columns,
    rowCount,
    rowOpeningHeights,
    kick,
    topAsm,
    bottomPanel,
    rail,
    backT,
    rearClear,
    slideLen,
    slideWClr,
    slideHClr,
  ]);

  const backsolveResult = useMemo(() => {
    if (!Number.isFinite(rowCount) || rowCount < 1) return null;
    const heights: number[] = [];
    for (let i = 0; i < rowCount; i++) {
      const s = backsolve[i]?.trim() ?? "";
      if (!s) return null;
      const v = parseInches(s);
      if (v === null || v <= 0) return { error: `Row ${i + 1} target opening is invalid.` };
      heights.push(v);
    }
    const k = parseInches(kick.trim() === "" ? "0" : kick);
    const top = parseInches(topAsm);
    const bot = parseInches(bottomPanel);
    const r = parseInches(rail);
    if (k === null || k < 0 || top === null || top < 0 || bot === null || bot < 0 || r === null || r < 0) {
      return { error: "Top / bottom / rail must be valid to back-solve height (kick may be 0)." };
    }
    const suggested = outerHeightFromRowOpenings(
      {
        kickHeight: k,
        bottomPanelThickness: bot,
        topAssemblyHeight: top,
        railBetweenDrawers: r,
        rowCount,
      },
      heights
    );
    return { suggested };
  }, [backsolve, rowCount, kick, topAsm, bottomPanel, rail]);

  const previewOpeningHeights = useMemo(() => {
    return rowOpeningHeights.slice(0, rowCount).map((s) => {
      const v = parseInches(s.trim());
      return v !== null && v > 0 ? v : 4;
    });
  }, [rowOpeningHeights, rowCount]);

  function handleAddCaseParts() {
    if (carcassResult.ok !== true) return;
    const toAdd: Omit<Part, "id">[] = carcassResult.parts.map((p) => ({
      name: p.name,
      assembly: p.assembly,
      quantity: p.quantity,
      finished: p.finished,
      rough: { t: 0, w: 0, l: 0, manual: false },
      material: { label: "Primary hardwood", thicknessCategory: "4/4" },
      grainNote: p.grainNote ?? "",
      status: p.status,
    }));
    addParts(toAdd);
  }

  function handleAddDrawerParts() {
    if (result.ok !== true) return;
    const toAdd: Omit<Part, "id">[] = result.cells.map((c) => ({
      name: `Drawer box (${c.label})`,
      assembly: "Drawers",
      quantity: 1,
      finished: { t: 0.5, w: c.boxWidth, l: c.boxHeight },
      rough: { t: 0, w: 0, l: 0, manual: false },
      material: { label: "Primary hardwood", thicknessCategory: "4/4" },
      grainNote: `Depth (slide run) ${formatImperial(c.boxDepth)} · opening ${formatImperial(c.openingWidth)} × ${formatImperial(c.openingHeight)}`,
      status: "needs_milling",
    }));
    addParts(toAdd);
  }

  return (
    <div className="space-y-8">
      <div className="space-y-8">
        <section className="rounded-2xl border border-white/10 bg-white/[0.04] p-6 shadow-[0_0_0_1px_rgba(255,255,255,0.04)] backdrop-blur-md">
          <h2 className="font-display text-lg tracking-tight text-[var(--gl-cream)]">Case</h2>
          <p className="mt-1 text-sm text-[var(--gl-muted)]">
            Start with outside size. Drawer openings must fit in what’s left after the optional{" "}
            <strong className="font-medium text-[var(--gl-cream-soft)]">toe kick</strong> (0 if the case
            stands on legs/feet), the <strong className="font-medium text-[var(--gl-cream-soft)]">top assembly</strong>
            , and the <strong className="font-medium text-[var(--gl-cream-soft)]">bottom panel</strong> zone.
          </p>
          <details className="mt-3 rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-sm text-[var(--gl-muted)]">
            <summary className="cursor-pointer font-medium text-[var(--gl-cream-soft)]">
              Quick glossary
            </summary>
            <ul className="mt-2 list-inside list-disc space-y-1.5 text-xs leading-relaxed">
              <li>
                <strong className="text-[var(--gl-cream)]">Row opening heights</strong> — Real inches: the
                clear height you want for each horizontal drawer band. They must add up (with rails) to the
                drawer zone; use <strong>Split target equally</strong> if you want even rows.
              </li>
              <li>
                <strong className="text-[var(--gl-cream)]">Toe kick (optional)</strong> — Recessed plinth at
                the floor so you can stand close. Use <strong>0</strong> if you’re not building one (e.g.
                furniture feet or a platform base).
              </li>
              <li>
                <strong className="text-[var(--gl-cream)]">Top assembly</strong> — Everything from the top
                of the case down to where the top drawer opening begins (top, subtop, dust divider, apron,
                gap).
              </li>
              <li>
                <strong className="text-[var(--gl-cream)]">Rear clearance</strong> — Depth you don’t give
                the drawer box—space between box back and cabinet back.
              </li>
            </ul>
          </details>
          <div className="mt-5 grid gap-4 sm:grid-cols-3">
            <Field label="Overall width">
              <In value={outerW} onChange={setOuterW} />
            </Field>
            <Field label="Overall height">
              <In value={outerH} onChange={setOuterH} />
            </Field>
            <Field label="Overall depth">
              <In value={outerD} onChange={setOuterD} />
            </Field>
            <Field label="Material thickness (sides / dividers)">
              <In value={materialT} onChange={setMaterialT} hint="e.g. 3/4 for S4S hardwood" />
            </Field>
            <Field label="Columns">
              <select
                className="input-wood"
                value={columns}
                onChange={(e) => setColumns(Number(e.target.value) as DresserColumnCount)}
              >
                <option value={1}>One column</option>
                <option value={2}>Two columns</option>
                <option value={3}>Three columns</option>
              </select>
            </Field>
            <Field label="Drawer rows (total)">
              <input
                className="input-wood"
                type="number"
                min={1}
                max={12}
                value={rows}
                onChange={(e) => {
                  const n = Number.parseInt(e.target.value, 10);
                  const v = Number.isFinite(n) ? Math.min(12, Math.max(1, n)) : 1;
                  setRows(String(v));
                  syncRowOpeningFields(v);
                }}
              />
            </Field>
          </div>

          <div className="mt-6">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-xs font-medium tracking-wide text-[var(--gl-muted)] uppercase">
                  Drawer row opening heights
                </p>
                <p className="mt-1 text-sm text-[var(--gl-muted)]">
                  Enter the <strong className="text-[var(--gl-cream-soft)]">clear opening height</strong> you
                  want for each drawer row, in inches. All rows together (plus the thin rails between them)
                  must exactly fill the vertical drawer zone for your overall height—if they don’t, you’ll
                  get an error with the target total.
                </p>
              </div>
              <button
                type="button"
                className="shrink-0 rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-xs font-medium text-[var(--gl-cream)] hover:bg-white/15"
                onClick={fillEqualRowOpenings}
              >
                Split target equally
              </button>
            </div>
            <RowOpeningBudgetHint
              outerH={outerH}
              kick={kick}
              topAsm={topAsm}
              bottomPanel={bottomPanel}
              rail={rail}
              rowCount={rowCount}
              rowStrings={rowOpeningHeights}
            />
            <div className="mt-3 grid gap-3 sm:grid-cols-3">
              {rowOpeningHeights.slice(0, rowCount).map((w, i) => (
                <Field
                  key={`row-h-${i}`}
                  label={`Row ${i + 1} opening height`}
                  hint="Inside height of the drawer opening for this band."
                >
                  <In
                    value={w}
                    onChange={(v) =>
                      setRowOpeningHeights((prev) => prev.map((x, j) => (j === i ? v : x)))
                    }
                  />
                </Field>
              ))}
            </div>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Field
              label="Toe kick (optional)"
              hint="0 = none (e.g. legs/feet hold the box up). Otherwise recessed height under the front—no drawers in this band."
            >
              <In value={kick} onChange={setKick} placeholder="0" />
            </Field>
            <Field
              label="Top assembly height"
              hint="From the very top of the cabinet down to the top of the uppermost drawer opening (top, subtop, dust shelf, apron, intentional gap)."
            >
              <In value={topAsm} onChange={setTopAsm} />
            </Field>
            <Field label="Bottom panel thickness" hint="Thickness of the bottom structure the lowest drawers sit on/above.">
              <In value={bottomPanel} onChange={setBottomPanel} />
            </Field>
            <Field
              label="Rail between drawers"
              hint="Horizontal frame member between stacked drawer openings (subtracts from drawer stack height)."
            >
              <In value={rail} onChange={setRail} />
            </Field>
            <Field label="Back panel thickness" hint="Thickness of the cabinet back (e.g. 1/4″ ply or shiplap).">
              <In value={backT} onChange={setBackT} />
            </Field>
            <Field
              label="Rear clearance (behind drawer box)"
              hint="Depth you reserve between the drawer box back and the cabinet back—slack for install, wiring, or wood movement."
            >
              <In value={rearClear} onChange={setRearClear} />
            </Field>
          </div>
          {carcassResult.ok === false ? (
            <p className="mt-4 text-sm text-red-300/90">{carcassResult.message}</p>
          ) : null}
          <button
            type="button"
            className="mt-4 rounded-xl bg-[var(--gl-copper)] px-4 py-2.5 text-sm font-semibold text-[var(--gl-bg)] transition hover:bg-[var(--gl-copper-bright)] disabled:cursor-not-allowed disabled:opacity-40"
            disabled={carcassResult.ok !== true}
            onClick={handleAddCaseParts}
          >
            Add case parts to parts list
          </button>
        </section>

        <section className="rounded-2xl border border-white/10 bg-white/[0.04] p-6 backdrop-blur-md">
          <h2 className="font-display text-lg tracking-tight text-[var(--gl-cream)]">Slides</h2>
          <p className="mt-1 text-sm text-[var(--gl-muted)]">
            Pick a starting point, then tweak. Always confirm against the manufacturer install sheet.
          </p>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <Field label="Slide preset">
              <select
                className="input-wood"
                value={slidePreset}
                onChange={(e) => applySlidePreset(e.target.value as SlideKey)}
              >
                {(Object.keys(SLIDE_PRESETS) as SlideKey[]).map((k) => (
                  <option key={k} value={k}>
                    {SLIDE_PRESETS[k].label}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Nominal slide length">
              <In value={slideLen} onChange={setSlideLen} hint="Box depth = min(this, usable depth)" />
            </Field>
            <Field label="Width clearance (opening → box)">
              <In value={slideWClr} onChange={(v) => {
                setSlideWClr(v);
                setSlidePreset("custom");
              }}
              />
            </Field>
            <Field label="Height clearance (opening → box)">
              <In value={slideHClr} onChange={(v) => {
                setSlideHClr(v);
                setSlidePreset("custom");
              }}
              />
            </Field>
          </div>
        </section>

        <section className="rounded-2xl border border-dashed border-[var(--gl-copper)]/35 bg-[var(--gl-copper)]/5 p-6">
          <h2 className="font-display text-lg tracking-tight text-[var(--gl-cream)]">
            Back-solve overall height
          </h2>
          <p className="mt-1 text-sm text-[var(--gl-muted)]">
            If you already know each <strong>drawer opening height</strong> you want, enter them here to see
            a matching overall case height (same kick / top / bottom / rails as above).
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            {Array.from({ length: rowCount }, (_, i) => (
              <Field key={`bs-${i}`} label={`Opening height row ${i + 1}`}>
                <In
                  value={backsolve[i] ?? ""}
                  onChange={(v) =>
                    setBacksolve((prev) => prev.map((x, j) => (j === i ? v : x)))
                  }
                  placeholder="optional"
                />
              </Field>
            ))}
          </div>
          {backsolveResult && "error" in backsolveResult ? (
            <p className="mt-3 text-sm text-red-300/90">{backsolveResult.error}</p>
          ) : null}
          {backsolveResult && "suggested" in backsolveResult && typeof backsolveResult.suggested === "number" ? (
            <p className="mt-3 text-sm text-[var(--gl-cream)]">
              Suggested overall height:{" "}
              <strong className="text-[var(--gl-copper-bright)]">
                {formatImperial(backsolveResult.suggested)}
              </strong>{" "}
              (then tune top/kick for reveals and joinery).
            </p>
          ) : null}
        </section>
      </div>

      <div className="space-y-6">
        <div className="rounded-2xl border border-white/10 bg-gradient-to-b from-white/[0.08] to-white/[0.02] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]">
          <p className="text-xs font-medium tracking-widest text-[var(--gl-muted)] uppercase">
            Preview
          </p>
          <DresserPreview
            outerW={parsePositive(outerW) ?? 48}
            outerH={parsePositive(outerH) ?? 34}
            columnCount={columns}
            rowCount={Number.isFinite(rowCount) && rowCount > 0 ? rowCount : 3}
            rowOpeningHeightsInches={previewOpeningHeights}
            kickH={parseInches(kick.trim() === "" ? "0" : kick) ?? 0}
            topBand={parseInches(topAsm) ?? 0}
            bottomBand={parseInches(bottomPanel) ?? 0}
            rail={parseInches(rail) ?? 0}
            materialT={parsePositive(materialT) ?? 0.75}
          />
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 backdrop-blur-md">
          <p className="text-xs font-medium tracking-widest text-[var(--gl-muted)] uppercase">
            Openings &amp; boxes
          </p>
          {result.ok === false ? (
            <p className="mt-3 text-sm text-red-300/90">{result.message}</p>
          ) : (
            <div className="mt-4 space-y-4">
              <p className="text-sm text-[var(--gl-muted)]">
                Column interior width{" "}
                <strong className="text-[var(--gl-cream)]">{formatImperial(result.columnInnerWidth)}</strong>
                {" · "}
                Drawer stack zone{" "}
                <strong className="text-[var(--gl-cream)]">{formatImperial(result.drawerZoneHeight)}</strong>
              </p>
              <div className="max-h-[min(55vh,520px)] overflow-auto rounded-xl border border-white/10">
                <table className="w-full text-left text-sm">
                  <thead className="sticky top-0 bg-[var(--gl-ink)]/95 text-xs tracking-wide text-[var(--gl-muted)] uppercase">
                    <tr>
                      <th className="px-3 py-2 font-medium">Cell</th>
                      <th className="px-3 py-2 font-medium">Opening W×H</th>
                      <th className="px-3 py-2 font-medium">Box W×H×D</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/10 text-[var(--gl-cream)]">
                    {result.cells.map((c) => (
                      <tr key={`${c.columnIndex}-${c.rowIndex}`} className="bg-white/[0.02]">
                        <td className="px-3 py-2.5 font-medium">{c.label}</td>
                        <td className="px-3 py-2.5 text-[var(--gl-muted)]">
                          {formatImperial(c.openingWidth)} × {formatImperial(c.openingHeight)}
                        </td>
                        <td className="px-3 py-2.5">
                          {formatImperial(c.boxWidth)} × {formatImperial(c.boxHeight)} ×{" "}
                          {formatImperial(c.boxDepth)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="text-xs leading-relaxed text-[var(--gl-muted)]">
                Box depth uses the smaller of slide length and usable depth (
                {formatImperial(result.depthAvailableForBox)} available). Overlay drawers, inset
                face frames, and bottom-mount slide rules are not modeled yet—bump clearances manually.
              </p>
              <button
                type="button"
                className="mt-4 rounded-xl bg-[var(--gl-copper)] px-4 py-2.5 text-sm font-semibold text-[var(--gl-bg)] transition hover:bg-[var(--gl-copper-bright)]"
                onClick={handleAddDrawerParts}
              >
                Add drawer boxes to parts list
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function RowOpeningBudgetHint({
  outerH,
  kick,
  topAsm,
  bottomPanel,
  rail,
  rowCount,
  rowStrings,
}: {
  outerH: string;
  kick: string;
  topAsm: string;
  bottomPanel: string;
  rail: string;
  rowCount: number;
  rowStrings: string[];
}) {
  const h = parsePositive(outerH);
  const k = parseInches(kick.trim() === "" ? "0" : kick);
  const top = parseInches(topAsm);
  const bot = parseInches(bottomPanel);
  const r = parseInches(rail);
  if (
    h === null ||
    k === null ||
    k < 0 ||
    top === null ||
    top < 0 ||
    bot === null ||
    bot < 0 ||
    r === null ||
    r < 0 ||
    !Number.isFinite(rowCount) ||
    rowCount < 1
  ) {
    return null;
  }
  const bud = budgetForRowOpeningHeights({
    outerHeight: h,
    kickHeight: k,
    topAssemblyHeight: top,
    bottomPanelThickness: bot,
    rowCount,
    railBetweenDrawers: r,
  });
  if (bud === null) return null;
  const vals = rowStrings.slice(0, rowCount).map((s) => parseInches(s.trim()));
  const allValid = vals.every((v) => v !== null && v > 0);
  const currentSum = allValid ? vals.reduce<number>((a, b) => a + (b as number), 0) : null;
  return (
    <p className="mt-2 rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-xs text-[var(--gl-muted)]">
      Opening heights must sum to{" "}
      <strong className="text-[var(--gl-cream)]">{formatImperial(bud)}</strong>
      {currentSum !== null ? (
        <>
          {" "}
          · Current sum: <strong className="text-[var(--gl-cream)]">{formatImperial(currentSum)}</strong>
          {Math.abs(currentSum - bud) > 1 / 32 ? (
            <span className="text-amber-200/90">
              {" "}
              — off by {formatImperial(Math.abs(currentSum - bud))} (±{formatImperial(1 / 32)} allowed)
            </span>
          ) : (
            <span className="text-emerald-200/80"> — balanced</span>
          )}
        </>
      ) : (
        <span> · Fill every row to check the sum.</span>
      )}
    </p>
  );
}

function Field({
  label,
  children,
  hint,
}: {
  label: string;
  children: ReactNode;
  hint?: string;
}) {
  return (
    <label className="flex flex-col gap-1.5 text-sm">
      <span className="font-medium text-[var(--gl-cream-soft)]">{label}</span>
      {children}
      {hint ? <span className="text-xs leading-snug text-[var(--gl-muted)]">{hint}</span> : null}
    </label>
  );
}

function In({
  value,
  onChange,
  hint,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  hint?: string;
  placeholder?: string;
}) {
  return (
    <>
      <input
        className="input-wood"
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        inputMode="decimal"
      />
      {hint ? <span className="text-xs text-[var(--gl-muted)]">{hint}</span> : null}
    </>
  );
}
