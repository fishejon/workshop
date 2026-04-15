"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useProject } from "@/components/ProjectContext";
import { DresserPreview } from "@/components/DresserPreview";
import { NominalStockWidthSelect } from "@/components/NominalStockWidthSelect";
import {
  DRESSER_CARCASS_ASSEMBLIES,
  DRESSER_DEFAULT_ROW_COUNT,
  DRESSER_DEFAULT_ROW_OPENING_HEIGHTS,
  DRESSER_PRIMARY_HARDWOOD_4_4,
  DRESSER_SLIDE_PRESETS,
  type DresserSlidePresetKey,
} from "@/lib/archetypes/assemblies";
import {
  buildDresserCaseworkCarcass,
  computeDresserCaseworkEngine,
} from "@/lib/archetypes/casework";
import {
  budgetForRowOpeningHeights,
  outerHeightFromRowOpenings,
  type DresserColumnCount,
} from "@/lib/dresser-engine";
import { balanceRowOpeningHeights } from "@/lib/dresser-row-balance";
import type { Part } from "@/lib/project-types";
import { formatImperial, formatImperialInput, parseInches } from "@/lib/imperial";
import { useSetDresserMaterialsSnapshot } from "@/components/DresserMaterialsSnapshotContext";

type SlideKey = DresserSlidePresetKey;

function parsePositive(s: string): number | null {
  const n = parseInches(s);
  if (n === null || n <= 0) return null;
  return n;
}

function parseNonNegative(s: string): number | null {
  const n = parseInches(s);
  if (n === null || n < 0) return null;
  return n;
}

const FRACTION_DENOMINATOR = 16;

function fmtInches(inches: number): string {
  return formatImperial(inches, FRACTION_DENOMINATOR);
}

export function DresserPlanner() {
  const { project, replacePartsInAssemblies, setMaxPurchasableBoardWidthInches } = useProject();

  const [outerW, setOuterW] = useState("48");
  const [outerH, setOuterH] = useState("34");
  const [outerD, setOuterD] = useState("18");
  const [sideT, setSideT] = useState("0.75");
  const [centerSupportT, setCenterSupportT] = useState("0.75");
  const [topPanelT, setTopPanelT] = useState("0.75");
  const [columns, setColumns] = useState<DresserColumnCount>(2);
  const [rows, setRows] = useState(String(DRESSER_DEFAULT_ROW_COUNT));
  /** Each drawer row opening height in inches (must sum to case budget — see hint below). */
  const [rowOpeningHeights, setRowOpeningHeights] = useState<string[]>(() => [
    ...DRESSER_DEFAULT_ROW_OPENING_HEIGHTS,
  ]);
  const [kick, setKick] = useState("0");
  const [topAsm, setTopAsm] = useState("1.5");
  const [bottomPanel, setBottomPanel] = useState("0.75");
  const [rail, setRail] = useState("0.75");
  const [backT, setBackT] = useState("0.25");
  const [rearClear, setRearClear] = useState("0.5");
  const [slideLen, setSlideLen] = useState("22");
  const [slidePreset, setSlidePreset] = useState<SlideKey>("sideMount");
  const [slideWClr, setSlideWClr] = useState(String(DRESSER_SLIDE_PRESETS.sideMount.w));
  const [slideHClr, setSlideHClr] = useState(String(DRESSER_SLIDE_PRESETS.sideMount.h));
  const [drawerJoineryW, setDrawerJoineryW] = useState("0");
  const [drawerJoineryH, setDrawerJoineryH] = useState("0");
  /** When true, auto-balance skips this row’s height. */
  const [rowOpeningLocked, setRowOpeningLocked] = useState<boolean[]>(() => []);

  function applySlidePreset(key: SlideKey) {
    setSlidePreset(key);
    if (key !== "custom") {
      const p = DRESSER_SLIDE_PRESETS[key];
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
    setRowOpeningLocked((prev) => {
      const next = prev.slice(0, n);
      while (next.length < n) next.push(false);
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

  const handleRowOpeningChange = useCallback(
    (i: number, v: string) => {
      setRowOpeningHeights((prev) => {
        const directNext = prev.map((x, j) => (j === i ? v : x));
        const nv = parseInches(v.trim());
        if (nv === null || nv <= 0) {
          return directNext;
        }
        const h = parsePositive(outerH);
        const k = parseInches(kick.trim() === "" ? "0" : kick) ?? 0;
        const top = parseInches(topAsm);
        const bot = parseInches(bottomPanel);
        const r = parseInches(rail);
        if (h === null || top === null || bot === null || r === null || !Number.isFinite(rowCount) || rowCount < 1) {
          return directNext;
        }
        const bud = budgetForRowOpeningHeights({
          outerHeight: h,
          kickHeight: k,
          topAssemblyHeight: top,
          bottomPanelThickness: bot,
          rowCount,
          railBetweenDrawers: r,
        });
        if (bud === null) {
          return directNext;
        }
        const nums = prev.slice(0, rowCount).map((s, j) => {
          if (j === i) return nv;
          const x = parseInches(s.trim());
          return x !== null && x > 0 ? x : bud / rowCount;
        });
        const lockPad = rowOpeningLocked.slice(0, rowCount);
        while (lockPad.length < rowCount) lockPad.push(false);
        const balanced = balanceRowOpeningHeights({
          heightsInches: nums,
          budgetInches: bud,
          editedIndex: i,
          newValueInches: nv,
          locked: lockPad,
        });
        const next = [...prev];
        for (let j = 0; j < rowCount; j++) {
          next[j] = formatImperialInput(balanced[j]!, FRACTION_DENOMINATOR);
        }
        for (let j = rowCount; j < prev.length; j++) {
          next[j] = prev[j] ?? "";
        }
        return next;
      });
    },
    [outerH, kick, topAsm, bottomPanel, rail, rowCount, rowOpeningLocked]
  );

  const carcassResult = useMemo(() => {
    if (!Number.isFinite(rowCount) || rowCount < 1) {
      return { ok: false as const, message: "Row count must be at least 1." };
    }
    const w = parsePositive(outerW);
    const h = parsePositive(outerH);
    const d = parsePositive(outerD);
    const sT = parsePositive(sideT);
    const cT = parsePositive(centerSupportT);
    const topPanel = parsePositive(topPanelT);
    const maxBoardWidth = project.maxPurchasableBoardWidthInches;
    const k = parseInches(kick.trim() === "" ? "0" : kick);
    const top = parseInches(topAsm);
    const bot = parseInches(bottomPanel);
    const r = parseInches(rail);
    const b = parseInches(backT);

    if (w === null || h === null || d === null || sT === null || cT === null || topPanel === null) {
      return {
        ok: false as const,
        message: "Enter valid overall W × H × D and positive side/center/top thicknesses.",
      };
    }
    if (!Number.isFinite(maxBoardWidth) || maxBoardWidth <= 0) {
      return {
        ok: false as const,
        message: "Set a valid max purchasable board width in Project setup (or the field below) for glue-up planning.",
      };
    }
    if (k === null || k < 0 || top === null || top < 0 || bot === null || bot < 0) {
      return { ok: false as const, message: "Top/bottom must be valid; kick can be 0." };
    }
    if (r === null || r < 0 || b === null || b < 0) {
      return { ok: false as const, message: "Rails and back thickness must be valid (≥ 0)." };
    }

    return buildDresserCaseworkCarcass({
      outerWidth: w,
      outerHeight: h,
      outerDepth: d,
      materialThickness: sT,
      dividerThickness: cT,
      topPanelThickness: topPanel,
      maxPurchasableBoardWidth: maxBoardWidth,
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
    sideT,
    centerSupportT,
    topPanelT,
    project.maxPurchasableBoardWidthInches,
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
    const sT = parsePositive(sideT);
    const cT = parsePositive(centerSupportT);
    const k = parseInches(kick.trim() === "" ? "0" : kick);
    const top = parseInches(topAsm);
    const bot = parseInches(bottomPanel);
    const r = parseInches(rail);
    const b = parseInches(backT);
    const rc = parseInches(rearClear);
    const sl = parsePositive(slideLen);
    const sw = parseInches(slideWClr);
    const sh = parseInches(slideHClr);
    const jw = parseInches(drawerJoineryW);
    const jh = parseInches(drawerJoineryH);

    if (w === null || h === null || d === null || sT === null || cT === null) {
      return { ok: false as const, message: "Enter valid overall W × H × D and side/center thicknesses." };
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
    if (jw === null || jh === null || jw < 0 || jh < 0) {
      return { ok: false as const, message: "Drawer joinery allowances must be valid non-negative numbers." };
    }

    const openingHeights = rowOpeningHeights.slice(0, rowCount).map((s) => {
      const v = parseInches(s.trim());
      if (v === null || v <= 0) return NaN;
      return v;
    });
    if (openingHeights.some((x) => Number.isNaN(x))) {
      return { ok: false as const, message: "Each row needs a positive opening height in inches (e.g. 8 or 7 1/2)." };
    }

    return computeDresserCaseworkEngine({
      outerWidth: w,
      outerHeight: h,
      outerDepth: d,
      materialThickness: sT,
      dividerThickness: cT,
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
      drawerJoineryWidthAllowance: jw,
      drawerJoineryHeightAllowance: jh,
    });
  }, [
    outerW,
    outerH,
    outerD,
    sideT,
    centerSupportT,
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
    drawerJoineryW,
    drawerJoineryH,
  ]);

  const previewOpeningHeights = useMemo(() => {
    return rowOpeningHeights.slice(0, rowCount).map((s) => {
      const v = parseInches(s.trim());
      return v !== null && v > 0 ? v : 4;
    });
  }, [rowOpeningHeights, rowCount]);

  const intentDerived = useMemo(() => {
    const width = parsePositive(outerW);
    const height = parsePositive(outerH);
    const depth = parsePositive(outerD);
    const side = parsePositive(sideT);
    const divider = parsePositive(centerSupportT);
    const kickHeight = parseNonNegative(kick.trim() === "" ? "0" : kick);
    const topAssembly = parseNonNegative(topAsm);
    const bottom = parseNonNegative(bottomPanel);
    const railHeight = parseNonNegative(rail);
    const back = parseNonNegative(backT);
    const rear = parseNonNegative(rearClear);
    const slideNominal = parsePositive(slideLen);
    const slideWidth = parseNonNegative(slideWClr);
    const slideHeight = parseNonNegative(slideHClr);
    const joineryWidth = parseNonNegative(drawerJoineryW);
    const joineryHeight = parseNonNegative(drawerJoineryH);
    const openings = rowOpeningHeights.slice(0, rowCount).map((s) => parseInches(s.trim()));
    let openingsSum: number | null = null;
    if (openings.every((v): v is number => v !== null && v > 0)) {
      openingsSum = openings.reduce((sum, value) => sum + value, 0);
    }
    const caseInteriorWidth =
      width !== null && side !== null ? width - 2 * side : null;
    const columnOpeningWidth =
      caseInteriorWidth !== null && divider !== null
        ? (caseInteriorWidth - Math.max(columns - 1, 0) * divider) / columns
        : null;
    const openingBudget =
      height !== null &&
      kickHeight !== null &&
      topAssembly !== null &&
      bottom !== null &&
      railHeight !== null &&
      Number.isFinite(rowCount) &&
      rowCount > 0
        ? budgetForRowOpeningHeights({
            outerHeight: height,
            kickHeight,
            topAssemblyHeight: topAssembly,
            bottomPanelThickness: bottom,
            rowCount,
            railBetweenDrawers: railHeight,
          })
        : null;
    const depthAvailableForBox =
      depth !== null && back !== null && rear !== null ? depth - back - rear : null;
    const resolvedBoxDepth =
      depthAvailableForBox !== null && slideNominal !== null
        ? Math.min(slideNominal, Math.max(0, depthAvailableForBox))
        : null;
    const totalWidthDeduction =
      slideWidth !== null && joineryWidth !== null ? slideWidth + joineryWidth : null;
    const totalHeightDeduction =
      slideHeight !== null && joineryHeight !== null ? slideHeight + joineryHeight : null;
    return {
      caseInteriorWidth,
      columnOpeningWidth,
      openingBudget,
      openingsSum,
      depthAvailableForBox,
      resolvedBoxDepth,
      totalWidthDeduction,
      totalHeightDeduction,
    };
  }, [
    outerW,
    outerH,
    outerD,
    sideT,
    centerSupportT,
    kick,
    topAsm,
    bottomPanel,
    rail,
    rowCount,
    columns,
    rowOpeningHeights,
    backT,
    rearClear,
    slideLen,
    slideWClr,
    slideHClr,
    drawerJoineryW,
    drawerJoineryH,
  ]);

  const suggestedOverallFromOpenings = useMemo(() => {
    const k = parseInches(kick.trim() === "" ? "0" : kick) ?? 0;
    const top = parseInches(topAsm);
    const bot = parseInches(bottomPanel);
    const r = parseInches(rail);
    if (top === null || bot === null || r === null || !Number.isFinite(rowCount) || rowCount < 1) {
      return null;
    }
    const heights = rowOpeningHeights.slice(0, rowCount).map((s) => parseInches(s.trim()));
    if (heights.some((v) => v === null || v <= 0)) {
      return null;
    }
    return outerHeightFromRowOpenings(
      {
        kickHeight: k,
        bottomPanelThickness: bot,
        topAssemblyHeight: top,
        railBetweenDrawers: r,
        rowCount,
      },
      heights as number[]
    );
  }, [kick, topAsm, bottomPanel, rail, rowCount, rowOpeningHeights]);

  const casePartsToAdd = useMemo<Omit<Part, "id">[]>(() => {
    if (carcassResult.ok !== true) return [];
    return carcassResult.parts.map((p) => ({
      name: p.name,
      assembly: p.assembly,
      quantity: p.quantity,
      finished: p.finished,
      rough: { t: 0, w: 0, l: 0, manual: false },
      material: DRESSER_PRIMARY_HARDWOOD_4_4,
      grainNote: p.grainNote ?? "",
      status: p.status,
    }));
  }, [carcassResult]);

  const drawerPartsToAdd = useMemo<Omit<Part, "id">[]>(() => {
    if (result.ok !== true) return [];
    const sw = parseInches(slideWClr) ?? 0;
    const sh = parseInches(slideHClr) ?? 0;
    const jw = parseInches(drawerJoineryW) ?? 0;
    const jh = parseInches(drawerJoineryH) ?? 0;
    const joineryTrace = result.drawerJoineryApplied.provenance;
    return result.cells.map((c) => ({
      name: `Drawer box (${c.label})`,
      assembly: "Drawers",
      quantity: 1,
      finished: { t: 0.5, w: c.boxWidth, l: c.boxHeight },
      rough: { t: 0, w: 0, l: 0, manual: false },
      material: DRESSER_PRIMARY_HARDWOOD_4_4,
      grainNote:
        `Depth (slide run) ${fmtInches(c.boxDepth)} · opening ${fmtInches(c.openingWidth)} × ${fmtInches(c.openingHeight)} · ` +
        `box formula: W−${fmtInches(sw)}−${fmtInches(jw)}, H−${fmtInches(sh)}−${fmtInches(jh)} · ${joineryTrace}`,
      status: "needs_milling",
    }));
  }, [result, slideWClr, slideHClr, drawerJoineryW, drawerJoineryH]);

  /** Carcass sync runs whenever case math is valid — independent of drawer row / opening balance. */
  const carcassAutoSyncSignature = useMemo(() => {
    if (carcassResult.ok !== true || casePartsToAdd.length < 1) return null;
    return JSON.stringify({
      millingAllowanceInches: project.millingAllowanceInches,
      parts: casePartsToAdd.map((p) => ({
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
  }, [carcassResult.ok, casePartsToAdd, project.millingAllowanceInches]);

  const drawerAutoSyncSignature = useMemo(() => {
    if (result.ok !== true || drawerPartsToAdd.length < 1) return null;
    return JSON.stringify({
      millingAllowanceInches: project.millingAllowanceInches,
      parts: drawerPartsToAdd.map((p) => ({
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
  }, [result.ok, drawerPartsToAdd, project.millingAllowanceInches]);

  const snapshotDrawerZoneHeight = carcassResult.ok === true ? carcassResult.drawerZoneHeight : null;
  const setDresserSnapshot = useSetDresserMaterialsSnapshot();
  useEffect(() => {
    setDresserSnapshot({
      columnInnerWidth: intentDerived.columnOpeningWidth,
      drawerZoneHeight: snapshotDrawerZoneHeight,
      openingBudget: intentDerived.openingBudget,
      openingsSum: intentDerived.openingsSum,
      depthAvailableForBox: intentDerived.depthAvailableForBox,
      resolvedBoxDepth: intentDerived.resolvedBoxDepth,
      totalWidthDeduction: intentDerived.totalWidthDeduction,
      totalHeightDeduction: intentDerived.totalHeightDeduction,
      caseOk: carcassResult.ok === true,
      drawerMathOk: result.ok === true,
    });
    return () => {
      setDresserSnapshot(null);
    };
  }, [
    setDresserSnapshot,
    intentDerived.columnOpeningWidth,
    intentDerived.openingBudget,
    intentDerived.openingsSum,
    intentDerived.depthAvailableForBox,
    intentDerived.resolvedBoxDepth,
    intentDerived.totalWidthDeduction,
    intentDerived.totalHeightDeduction,
    snapshotDrawerZoneHeight,
    carcassResult.ok,
    result.ok,
  ]);

  const casePartsForSyncRef = useRef(casePartsToAdd);
  const drawerPartsForSyncRef = useRef(drawerPartsToAdd);
  const replaceDresserPartsRef = useRef(replacePartsInAssemblies);

  useEffect(() => {
    casePartsForSyncRef.current = casePartsToAdd;
  }, [casePartsToAdd]);

  useEffect(() => {
    drawerPartsForSyncRef.current = drawerPartsToAdd;
  }, [drawerPartsToAdd]);

  useEffect(() => {
    replaceDresserPartsRef.current = replacePartsInAssemblies;
  }, [replacePartsInAssemblies]);

  useEffect(() => {
    if (carcassAutoSyncSignature === null) return;
    const handle = window.setTimeout(() => {
      const c = casePartsForSyncRef.current;
      if (c.length < 1) return;
      replaceDresserPartsRef.current(DRESSER_CARCASS_ASSEMBLIES, c);
    }, 450);
    return () => window.clearTimeout(handle);
  }, [carcassAutoSyncSignature]);

  useEffect(() => {
    if (drawerAutoSyncSignature === null) return;
    const handle = window.setTimeout(() => {
      const d = drawerPartsForSyncRef.current;
      if (d.length < 1) return;
      replaceDresserPartsRef.current(["Drawers"], d);
    }, 450);
    return () => window.clearTimeout(handle);
  }, [drawerAutoSyncSignature]);

  return (
    <div className="space-y-8">
      <div className="space-y-8">
        <section className="rounded-2xl border border-[var(--gl-border)] bg-[var(--gl-surface)] p-6 shadow-[0_0_0_1px_var(--gl-border)]">
          <h2 className="font-display text-lg tracking-tight text-[var(--gl-cream)]">Intent-first case inputs</h2>
          <p className="mt-1 text-sm text-[var(--gl-muted)]">
            Define the cabinet by intent first: overall envelope, structural thicknesses, layout and slide
            allowances, then target drawer opening heights by row. The planner computes what those choices imply for
            every opening and box.
          </p>
          <p className="mt-4 rounded-lg border border-[var(--gl-border)] bg-[var(--gl-surface-inset)] px-3 py-2 text-xs leading-relaxed text-[var(--gl-muted)]">
            <strong className="text-[var(--gl-cream-soft)]">What you type vs what the app fills in:</strong> every
            field in this intent section is yours to enter or choose. A compact{" "}
            <strong className="text-[var(--gl-cream-soft)]">Dresser math</strong> readout lives in{" "}
            <strong className="text-[var(--gl-cream-soft)]">Materials</strong> (same column as the cut list). Valid{" "}
            <strong className="text-[var(--gl-cream-soft)]">case / base / back</strong> rows sync to the shared{" "}
            <strong className="text-[var(--gl-cream-soft)]">Cut list</strong> as soon as the carcass computes (even if
            drawer opening heights are not balanced yet). <strong className="text-[var(--gl-cream-soft)]">Drawer</strong>{" "}
            rows sync when slide and opening math is valid. Rough sizes follow Project milling allowance.
          </p>
          <details className="mt-3 rounded-lg border border-[var(--gl-border)] bg-[var(--gl-surface-muted)] px-3 py-2 text-sm text-[var(--gl-muted)]">
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
          <p className="mt-5 text-xs font-medium tracking-widest text-[var(--gl-muted)] uppercase">
            Your inputs — case envelope &amp; stock
          </p>
          <div className="mt-2 grid gap-4 sm:grid-cols-3">
            <Field label="Overall width (outside)" source="manual">
              <In value={outerW} onChange={setOuterW} />
            </Field>
            <Field label="Overall height (outside)" source="manual">
              <In value={outerH} onChange={setOuterH} />
            </Field>
            <Field label="Overall depth (outside)" source="manual">
              <In value={outerD} onChange={setOuterD} />
            </Field>
            <Field label="Case side thickness" source="manual">
              <In value={sideT} onChange={setSideT} hint="Primary side stock thickness (e.g. 3/4)." />
            </Field>
            <Field label="Center support / divider thickness" source="manual">
              <In
                value={centerSupportT}
                onChange={setCenterSupportT}
                hint="Vertical column divider thickness used in opening-width math."
              />
            </Field>
            <Field label="Top panel thickness" source="manual">
              <In
                value={topPanelT}
                onChange={setTopPanelT}
                hint="Case top stock thickness for parts output (separate from top assembly height)."
              />
            </Field>
            <Field
              label="Max purchasable board (nominal stock)"
              source="manual"
              hint="Pick the widest dressed board you actually buy (same setting as Project setup). Used for glue-up strip planning and buy-list width checks."
            >
              <NominalStockWidthSelect
                valueInches={project.maxPurchasableBoardWidthInches}
                onChangeInches={(n) => setMaxPurchasableBoardWidthInches(Math.max(0.0001, n))}
                selectId="dresser-max-board-nominal"
                customInputId="dresser-max-board-custom-in"
              />
            </Field>
            <Field label="Columns (vertical stacks)" source="manual">
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
            <Field label="Drawer rows (horizontal bands)" source="manual">
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

          <p className="mt-6 text-xs font-medium tracking-widest text-[var(--gl-muted)] uppercase">
            Your inputs — layout, back &amp; slides
          </p>
          <div className="mt-2 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Field
              label="Toe kick (optional)"
              source="manual"
              hint="0 = none (e.g. legs/feet hold the box up). Otherwise recessed height under the front—no drawers in this band."
            >
              <In value={kick} onChange={setKick} placeholder="0" />
            </Field>
            <Field
              label="Top assembly height"
              source="manual"
              hint="From the very top of the cabinet down to the top of the uppermost drawer opening (top, subtop, dust shelf, apron, intentional gap)."
            >
              <In value={topAsm} onChange={setTopAsm} />
            </Field>
            <Field
              label="Bottom panel thickness"
              source="manual"
              hint="Thickness of the bottom structure the lowest drawers sit on/above."
            >
              <In value={bottomPanel} onChange={setBottomPanel} />
            </Field>
            <Field
              label="Rail between drawers"
              source="manual"
              hint="Horizontal frame member between stacked drawer openings (subtracts from drawer stack height)."
            >
              <In value={rail} onChange={setRail} />
            </Field>
            <Field
              label="Back panel thickness"
              source="manual"
              hint="Thickness of the cabinet back (e.g. 1/4″ ply or shiplap)."
            >
              <In value={backT} onChange={setBackT} />
            </Field>
            <Field
              label="Rear clearance (behind drawer box)"
              source="manual"
              hint="Depth you reserve between the drawer box back and the cabinet back—slack for install, wiring, or wood movement."
            >
              <In value={rearClear} onChange={setRearClear} />
            </Field>
          </div>

          <p className="mt-6 text-xs font-medium tracking-widest text-[var(--gl-muted)] uppercase">
            Slide + drawer box allowances
          </p>
          <p className="mt-1 text-sm text-[var(--gl-muted)]">
            Pick a slide preset or enter clearances manually, then set extra joinery allowances (beyond slide clearance)
            removed from each opening for box width and height.
          </p>
          <div className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Field label="Slide style preset" source="manual">
              <select
                className="input-wood"
                value={slidePreset}
                onChange={(e) => applySlidePreset(e.target.value as SlideKey)}
              >
                {(Object.keys(DRESSER_SLIDE_PRESETS) as SlideKey[]).map((k) => (
                  <option key={k} value={k}>
                    {DRESSER_SLIDE_PRESETS[k].label}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Slide length (nominal)" source="manual">
              <In value={slideLen} onChange={setSlideLen} hint="Box depth = min(this, usable depth)" />
            </Field>
            <Field label="Slide width clearance (opening → box)" source="manual">
              <In
                value={slideWClr}
                onChange={(v) => {
                  setSlideWClr(v);
                  setSlidePreset("custom");
                }}
              />
            </Field>
            <Field label="Slide height clearance (opening → box)" source="manual">
              <In
                value={slideHClr}
                onChange={(v) => {
                  setSlideHClr(v);
                  setSlidePreset("custom");
                }}
              />
            </Field>
            <Field label="Joinery width allowance (total)" source="manual">
              <In
                value={drawerJoineryW}
                onChange={setDrawerJoineryW}
                hint="Extra total width removed from opening beyond slide clearance."
              />
            </Field>
            <Field label="Joinery height allowance (total)" source="manual">
              <In
                value={drawerJoineryH}
                onChange={setDrawerJoineryH}
                hint="Extra total height removed from opening beyond slide clearance."
              />
            </Field>
          </div>
          <p className="mt-3 rounded-lg border border-[var(--gl-border)] bg-[var(--gl-surface-muted)] px-3 py-2 text-xs text-[var(--gl-muted)]">
            Formula used: <strong className="text-[var(--gl-cream)]">box width = opening width − slide width clearance − joinery width allowance</strong> and{" "}
            <strong className="text-[var(--gl-cream)]">box height = opening height − slide height clearance − joinery height allowance</strong>.
          </p>
          {result.ok ? (
            <p className="mt-2 rounded-lg border border-[var(--gl-copper)]/25 bg-[var(--gl-copper)]/8 px-3 py-2 text-xs text-[var(--gl-cream-soft)]">
              Joinery provenance: {result.drawerJoineryApplied.provenance}
            </p>
          ) : null}

          {carcassResult.ok === false ? <p className="mt-4 text-sm text-[var(--gl-danger)]">{carcassResult.message}</p> : null}

          <div className="mt-6">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-xs font-medium tracking-wide text-[var(--gl-muted)] uppercase">
                  Your inputs — drawer row opening heights
                </p>
                <p className="mt-1 text-sm text-[var(--gl-muted)]">
                  Enter the <strong className="text-[var(--gl-cream-soft)]">clear opening height</strong> for each row.
                  Changing a row rebalances unlocked rows to keep the sum on budget. Check <strong>Lock</strong> on rows you
                  do not want auto-adjusted.
                </p>
              </div>
              <button
                type="button"
                className="shrink-0 rounded-lg border border-[var(--gl-border-strong)] bg-[var(--gl-surface-muted)] px-3 py-2 text-xs font-medium text-[var(--gl-cream)] hover:bg-[var(--gl-surface-muted)]"
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
                <div key={`row-h-${i}`} className="flex flex-col gap-2 rounded-lg border border-[var(--gl-border)] bg-[var(--gl-surface-inset)]/40 p-3">
                  <Field
                    label={`Row ${i + 1} opening height`}
                    source="manual"
                    hint="Inside height of the drawer opening for this band."
                  >
                    <In value={w} onChange={(v) => handleRowOpeningChange(i, v)} />
                  </Field>
                  <label className="flex cursor-pointer items-center gap-2 text-xs text-[var(--gl-muted)]">
                    <input
                      type="checkbox"
                      className="rounded border-[var(--gl-border-strong)]"
                      checked={rowOpeningLocked[i] ?? false}
                      onChange={(e) => {
                        const checked = e.target.checked;
                        setRowOpeningLocked((prev) => {
                          const next = prev.slice();
                          while (next.length <= i) next.push(false);
                          next[i] = checked;
                          return next;
                        });
                      }}
                    />
                    Lock (skip in auto-balance)
                  </label>
                </div>
              ))}
            </div>
            {suggestedOverallFromOpenings !== null ? (
              <p className="mt-3 text-sm text-[var(--gl-cream)]">
                Height implied by these openings (kick + bottom + rows + rails + top):{" "}
                <strong className="text-[var(--gl-copper-bright)]">{fmtInches(suggestedOverallFromOpenings)}</strong>
                {" — "}compare to overall height above; tweak top/kick/rail or overall height until they match what you want.
              </p>
            ) : null}
          </div>
        </section>
      </div>

      <div className="space-y-6">
        <div className="rounded-2xl border border-[var(--gl-border)] bg-gradient-to-b from-[var(--gl-surface)] to-[var(--gl-bg)] p-5 shadow-[inset_0_1px_0_var(--gl-border)]">
          <p className="text-xs font-medium tracking-widest text-[var(--gl-muted)] uppercase">
            Visual preview only
          </p>
          <p className="mt-2 text-xs text-[var(--gl-muted)]">
            Front elevation is for proportion/orientation only and is not manufacturing output. Use{" "}
            <strong className="text-[var(--gl-cream-soft)]">Materials</strong> (Dresser math) and the cut list for
            numbers and marks.
          </p>
          <DresserPreview
            outerW={parsePositive(outerW) ?? 48}
            outerH={parsePositive(outerH) ?? 34}
            outerD={parsePositive(outerD) ?? 18}
            columnCount={columns}
            rowCount={Number.isFinite(rowCount) && rowCount > 0 ? rowCount : 3}
            rowOpeningHeightsInches={previewOpeningHeights}
            kickH={parseInches(kick.trim() === "" ? "0" : kick) ?? 0}
            topBand={parseInches(topAsm) ?? 0}
            bottomBand={parseInches(bottomPanel) ?? 0}
            rail={parseInches(rail) ?? 0}
            materialT={parsePositive(sideT) ?? 0.75}
          />
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
    <p className="mt-2 rounded-lg border border-[var(--gl-border)] bg-[var(--gl-surface-muted)] px-3 py-2 text-xs text-[var(--gl-muted)]">
      Opening heights must sum to{" "}
      <strong className="text-[var(--gl-cream)]">{fmtInches(bud)}</strong>
      {currentSum !== null ? (
        <>
          {" "}
          · Current sum: <strong className="text-[var(--gl-cream)]">{fmtInches(currentSum)}</strong>
          {Math.abs(currentSum - bud) > 1 / 32 ? (
            <span className="text-[var(--gl-warning)]">
              {" "}
              — off by {fmtInches(Math.abs(currentSum - bud))} (±{fmtInches(1 / 32)} allowed)
            </span>
          ) : (
            <span className="text-[var(--gl-success)]"> — balanced</span>
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
  source,
}: {
  label: string;
  children: ReactNode;
  hint?: string;
  /** Marks fields the user edits (vs read-only calculated blocks elsewhere). */
  source?: "manual";
}) {
  return (
    <label className="flex h-full flex-col gap-1.5 text-sm">
      <span className="flex min-h-[2.8rem] flex-wrap content-start items-start gap-2 font-medium text-[var(--gl-cream-soft)]">
        {label}
        {source === "manual" ? (
          <span className="rounded border border-[var(--gl-border)] bg-[var(--gl-surface-muted)] px-1.5 py-0.5 text-[10px] font-normal tracking-wide text-[var(--gl-muted)] uppercase">
            Your input
          </span>
        ) : null}
      </span>
      {children}
      {hint ? <span className="min-h-[2.3rem] text-xs leading-snug text-[var(--gl-muted)]">{hint}</span> : null}
    </label>
  );
}

function In({
  value,
  onChange,
  hint,
  placeholder,
  normalizeOnBlur = true,
}: {
  value: string;
  onChange: (v: string) => void;
  hint?: string;
  placeholder?: string;
  normalizeOnBlur?: boolean;
}) {
  function handleBlur() {
    if (!normalizeOnBlur) return;
    const parsed = parseInches(value);
    if (parsed === null) return;
    onChange(formatImperialInput(parsed, FRACTION_DENOMINATOR));
  }

  return (
    <>
      <input
        className="input-wood"
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        onBlur={handleBlur}
        inputMode="decimal"
      />
      <span className="text-xs text-[var(--gl-muted)]">
        {hint ?? "Fractions supported (e.g. 34 1/2, 7/8, 3/4)."}
      </span>
    </>
  );
}
