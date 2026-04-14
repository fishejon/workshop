"use client";

/* eslint-disable react-hooks/preserve-manual-memoization -- manual memo deps are intentional; React Compiler rule misfires here */
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useProject } from "@/components/ProjectContext";
import { DresserPreview } from "@/components/DresserPreview";
import { NominalStockWidthSelect } from "@/components/NominalStockWidthSelect";
import {
  DRESSER_ASSEMBLIES,
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
  computeDrawerJoineryAllowances,
  DRAWER_JOINERY_PRESET_META,
  type DrawerJoineryPresetId,
} from "@/lib/joinery/drawer-allowances";
import {
  budgetForRowOpeningHeights,
  outerHeightFromRowOpenings,
  type DresserColumnCount,
} from "@/lib/dresser-engine";
import type { Part } from "@/lib/project-types";
import { formatImperial, formatImperialInput, parseInches } from "@/lib/imperial";

type SlideKey = DresserSlidePresetKey;
type CaseJoineryStyle = "screw_glue" | "dados" | "confirmat" | "other";
type DrawerJoineryKey = DrawerJoineryPresetId | "custom";

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

type GenerationSummary = {
  mode: "append_all" | "replace_all" | "append_case" | "append_drawers";
  addedCount: number;
  replacedCount: number;
};

export function DresserPlanner() {
  const { project, addParts, replacePartsInAssemblies, setMaxPurchasableBoardWidthInches } = useProject();

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
  const [caseJoineryStyle, setCaseJoineryStyle] = useState<CaseJoineryStyle>("dados");
  const [drawerJoineryPreset, setDrawerJoineryPreset] = useState<DrawerJoineryKey>("butt");
  const [drawerJoineryMaterialThickness, setDrawerJoineryMaterialThickness] = useState("0.5");
  const [drawerJoineryHalfLapRatio, setDrawerJoineryHalfLapRatio] = useState("0.5");
  const [drawerJoineryHalfLapDepth, setDrawerJoineryHalfLapDepth] = useState("");
  const [drawerJoineryW, setDrawerJoineryW] = useState("0");
  const [drawerJoineryH, setDrawerJoineryH] = useState("0");
  const [generationSummary, setGenerationSummary] = useState<GenerationSummary | null>(null);

  const [backsolve, setBacksolve] = useState<string[]>(["", "", ""]);

  function applySlidePreset(key: SlideKey) {
    setSlidePreset(key);
    if (key !== "custom") {
      const p = DRESSER_SLIDE_PRESETS[key];
      setSlideWClr(String(p.w));
      setSlideHClr(String(p.h));
    }
  }

  function applyDrawerJoineryPreset(key: DrawerJoineryKey) {
    setDrawerJoineryPreset(key);
    if (key !== "custom") {
      const thickness = parsePositive(drawerJoineryMaterialThickness) ?? 0.5;
      const ratio = parseInches(drawerJoineryHalfLapRatio);
      const depth = parseInches(drawerJoineryHalfLapDepth);
      const computed = computeDrawerJoineryAllowances({
        preset: key,
        materialThickness: thickness,
        halfLapRatio: ratio ?? undefined,
        halfLapDepth: depth ?? undefined,
      });
      setDrawerJoineryW(String(computed.widthAllowance));
      setDrawerJoineryH(String(computed.heightAllowance));
    }
  }

  useEffect(() => {
    if (drawerJoineryPreset === "custom") return;
    const thickness = parsePositive(drawerJoineryMaterialThickness);
    if (thickness === null) return;
    const ratio = parseInches(drawerJoineryHalfLapRatio);
    const depth = parseInches(drawerJoineryHalfLapDepth);
    if (ratio !== null && ratio < 0) return;
    if (depth !== null && depth < 0) return;
    const computed = computeDrawerJoineryAllowances({
      preset: drawerJoineryPreset,
      materialThickness: thickness,
      halfLapRatio: ratio ?? undefined,
      halfLapDepth: depth ?? undefined,
    });
    /* eslint-disable react-hooks/set-state-in-effect -- keep derived joinery allowances synchronized with preset parameters */
    setDrawerJoineryW(String(computed.widthAllowance));
    setDrawerJoineryH(String(computed.heightAllowance));
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [
    drawerJoineryPreset,
    drawerJoineryMaterialThickness,
    drawerJoineryHalfLapRatio,
    drawerJoineryHalfLapDepth,
  ]);

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
    const joineryMaterialThickness = parsePositive(drawerJoineryMaterialThickness);
    const halfLapRatio = parseInches(drawerJoineryHalfLapRatio);
    const halfLapDepth = parseInches(drawerJoineryHalfLapDepth);

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
    if (joineryMaterialThickness === null) {
      return { ok: false as const, message: "Drawer side material thickness must be a positive number." };
    }
    if (halfLapRatio !== null && halfLapRatio < 0) {
      return { ok: false as const, message: "Half-lap ratio must be non-negative when provided." };
    }
    if (halfLapDepth !== null && halfLapDepth < 0) {
      return { ok: false as const, message: "Half-lap depth must be non-negative when provided." };
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
      drawerJoineryPreset: drawerJoineryPreset === "custom" ? undefined : drawerJoineryPreset,
      drawerJoineryMaterialThickness: joineryMaterialThickness,
      drawerJoineryHalfLapRatio: halfLapRatio ?? undefined,
      drawerJoineryHalfLapDepth:
        drawerJoineryHalfLapDepth.trim() === "" ? undefined : (halfLapDepth ?? undefined),
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
    drawerJoineryPreset,
    drawerJoineryMaterialThickness,
    drawerJoineryHalfLapRatio,
    drawerJoineryHalfLapDepth,
    drawerJoineryW,
    drawerJoineryH,
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

  const casePartsToAdd = useMemo<Omit<Part, "id">[]>(() => {
    if (carcassResult.ok !== true) return [];
    const caseJoineryNote =
      caseJoineryStyle === "dados"
        ? "case joinery ref: dados/grooves"
        : caseJoineryStyle === "screw_glue"
          ? "case joinery ref: screw + glue"
          : caseJoineryStyle === "confirmat"
            ? "case joinery ref: confirmat / knockdown"
            : "case joinery ref: custom";
    return carcassResult.parts.map((p) => ({
      name: p.name,
      assembly: p.assembly,
      quantity: p.quantity,
      finished: p.finished,
      rough: { t: 0, w: 0, l: 0, manual: false },
      material: DRESSER_PRIMARY_HARDWOOD_4_4,
      grainNote: [p.grainNote ?? "", caseJoineryNote].filter(Boolean).join(" · "),
      status: p.status,
    }));
  }, [carcassResult, caseJoineryStyle]);

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

  const existingDresserPartCount = useMemo(
    () => project.parts.filter((part) => DRESSER_ASSEMBLIES.includes(part.assembly)).length,
    [project.parts]
  );

  const generationSummaryText = useMemo(() => {
    if (!generationSummary) return null;
    if (generationSummary.mode === "replace_all") {
      return `Replaced ${generationSummary.replacedCount} dresser row(s) with ${generationSummary.addedCount} newly generated row(s).`;
    }
    if (generationSummary.mode === "append_all") {
      return `Added ${generationSummary.addedCount} dresser row(s) without removing existing rows.`;
    }
    if (generationSummary.mode === "append_case") {
      return `Added ${generationSummary.addedCount} case/base/back row(s) without removing existing rows.`;
    }
    return `Added ${generationSummary.addedCount} drawer row(s) without removing existing rows.`;
  }, [generationSummary]);

  function handleAddCaseParts() {
    if (casePartsToAdd.length < 1) return;
    addParts(casePartsToAdd);
    setGenerationSummary({ mode: "append_case", addedCount: casePartsToAdd.length, replacedCount: 0 });
  }

  function handleAddDrawerParts() {
    if (drawerPartsToAdd.length < 1) return;
    addParts(drawerPartsToAdd);
    setGenerationSummary({ mode: "append_drawers", addedCount: drawerPartsToAdd.length, replacedCount: 0 });
  }

  function handleAppendAllDresserParts() {
    if (casePartsToAdd.length < 1 || drawerPartsToAdd.length < 1) return;
    const combined = [...casePartsToAdd, ...drawerPartsToAdd];
    addParts(combined);
    setGenerationSummary({ mode: "append_all", addedCount: combined.length, replacedCount: 0 });
  }

  function handleReplaceDresserParts() {
    if (casePartsToAdd.length < 1 || drawerPartsToAdd.length < 1) return;
    const combined = [...casePartsToAdd, ...drawerPartsToAdd];
    replacePartsInAssemblies(DRESSER_ASSEMBLIES, combined);
    setGenerationSummary({
      mode: "replace_all",
      addedCount: combined.length,
      replacedCount: existingDresserPartCount,
    });
  }

  return (
    <div className="space-y-8">
      <div className="space-y-8">
        <section className="rounded-2xl border border-[var(--gl-border)] bg-[var(--gl-surface)] p-6 shadow-[0_0_0_1px_var(--gl-border)]">
          <h2 className="font-display text-lg tracking-tight text-[var(--gl-cream)]">Intent-first case inputs</h2>
          <p className="mt-1 text-sm text-[var(--gl-muted)]">
            Define the cabinet by intent first: overall envelope, structural thicknesses, then target drawer
            opening heights by row. The planner computes what those choices imply for every opening and box.
          </p>
          <p className="mt-4 rounded-lg border border-[var(--gl-border)] bg-[var(--gl-surface-inset)] px-3 py-2 text-xs leading-relaxed text-[var(--gl-muted)]">
            <strong className="text-[var(--gl-cream-soft)]">What you type vs what the app fills in:</strong> every
            field in this intent section is yours to enter or choose. The{" "}
            <strong className="text-[var(--gl-cream-soft)]">Calculated outputs</strong> block below is read-only math
            from those inputs. Cutlist parts do not change until you press{" "}
            <strong className="text-[var(--gl-cream-soft)]">Generate / replace dresser parts</strong> — see the
            Cut list tab for parts, lumber & buy list, and procurement.
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

          <div className="mt-6">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-xs font-medium tracking-wide text-[var(--gl-muted)] uppercase">
                  Your inputs — drawer row opening heights
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
                <Field
                  key={`row-h-${i}`}
                  label={`Row ${i + 1} opening height`}
                  source="manual"
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

          <p className="mt-6 text-xs font-medium tracking-widest text-[var(--gl-muted)] uppercase">
            Your inputs — layout, back, slides &amp; joinery
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
            <Field
              label="Case joinery style (reference)"
              source="manual"
              hint="Reference only for now; use this to keep your case-part assumptions explicit."
            >
              <select
                className="input-wood"
                value={caseJoineryStyle}
                onChange={(e) => setCaseJoineryStyle(e.target.value as CaseJoineryStyle)}
              >
                <option value="dados">Dados / grooves + glue</option>
                <option value="screw_glue">Screw + glue carcass</option>
                <option value="confirmat">Confirmat / knockdown screws</option>
                <option value="other">Other / custom</option>
              </select>
            </Field>
          </div>
          {carcassResult.ok === false ? (
            <p className="mt-4 text-sm text-[var(--gl-danger)]">{carcassResult.message}</p>
          ) : null}
          <button
            type="button"
            className="mt-4 rounded-xl bg-[var(--gl-copper)] px-4 py-2.5 text-sm font-semibold text-[var(--gl-on-accent)] transition hover:bg-[var(--gl-copper-bright)] disabled:cursor-not-allowed disabled:opacity-40"
            disabled={carcassResult.ok !== true}
            onClick={handleAddCaseParts}
          >
            1) Add case parts (append)
          </button>
          <p className="mt-2 text-xs text-[var(--gl-muted)]">
            Appends only case/base/back rows and keeps any existing drawer rows untouched.
          </p>
        </section>

        <section className="rounded-2xl border border-[var(--gl-border)] bg-[var(--gl-surface)] p-6">
          <h2 className="font-display text-lg tracking-tight text-[var(--gl-cream)]">Slide + joinery intent</h2>
          <p className="mt-1 text-sm text-[var(--gl-muted)]">
            Choose hardware style and joinery assumptions explicitly. Final drawer box dimensions are calculated from these allowances.
          </p>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
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
            <Field label="Slide width clearance (opening -> box)" source="manual">
              <In value={slideWClr} onChange={(v) => {
                setSlideWClr(v);
                setSlidePreset("custom");
              }}
              />
            </Field>
            <Field label="Slide height clearance (opening -> box)" source="manual">
              <In value={slideHClr} onChange={(v) => {
                setSlideHClr(v);
                setSlidePreset("custom");
              }}
              />
            </Field>
            <Field label="Drawer joinery style preset" source="manual">
              <select
                className="input-wood"
                value={drawerJoineryPreset}
                onChange={(e) => applyDrawerJoineryPreset(e.target.value as DrawerJoineryKey)}
              >
                {(Object.keys(DRAWER_JOINERY_PRESET_META) as DrawerJoineryPresetId[]).map((k) => (
                  <option key={k} value={k}>
                    {DRAWER_JOINERY_PRESET_META[k].engineeringLabel}
                  </option>
                ))}
                <option value="custom">Custom joinery allowance</option>
              </select>
            </Field>
            <Field label="Drawer side material thickness" source="manual" hint="Preset formulas use this as t.">
              <In value={drawerJoineryMaterialThickness} onChange={setDrawerJoineryMaterialThickness} />
            </Field>
            {drawerJoineryPreset === "dovetail_half_lap" ? (
              <>
                <Field label="Half-lap ratio (per side)" source="manual">
                  <In
                    value={drawerJoineryHalfLapRatio}
                    onChange={setDrawerJoineryHalfLapRatio}
                    hint="Used when explicit depth is blank."
                  />
                </Field>
                <Field label="Half-lap depth per side (optional)" source="manual">
                  <In
                    value={drawerJoineryHalfLapDepth}
                    onChange={setDrawerJoineryHalfLapDepth}
                    hint="Overrides ratio-based depth when set."
                  />
                </Field>
              </>
            ) : null}
            <Field label="Joinery width allowance (total)" source="manual">
              <In
                value={drawerJoineryW}
                onChange={(v) => {
                  setDrawerJoineryW(v);
                  setDrawerJoineryPreset("custom");
                }}
                hint="Extra total width removed from opening beyond slide clearance."
              />
            </Field>
            <Field label="Joinery height allowance (total)" source="manual">
              <In
                value={drawerJoineryH}
                onChange={(v) => {
                  setDrawerJoineryH(v);
                  setDrawerJoineryPreset("custom");
                }}
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
              <Field key={`bs-${i}`} label={`Opening height row ${i + 1}`} source="manual">
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
            <p className="mt-3 text-sm text-[var(--gl-danger)]">{backsolveResult.error}</p>
          ) : null}
          {backsolveResult && "suggested" in backsolveResult && typeof backsolveResult.suggested === "number" ? (
            <p className="mt-3 text-sm text-[var(--gl-cream)]">
              Suggested overall height:{" "}
              <strong className="text-[var(--gl-copper-bright)]">
                {fmtInches(backsolveResult.suggested)}
              </strong>{" "}
              (then tune top/kick for reveals and joinery).
            </p>
          ) : null}
        </section>
      </div>

      <div className="space-y-6">
        <div className="rounded-2xl border border-[var(--gl-border)] bg-gradient-to-b from-[var(--gl-surface)] to-[var(--gl-bg)] p-5 shadow-[inset_0_1px_0_var(--gl-border)]">
          <p className="text-xs font-medium tracking-widest text-[var(--gl-muted)] uppercase">
            Visual preview only
          </p>
          <p className="mt-2 text-xs text-[var(--gl-muted)]">
            Front elevation is for proportion/orientation only and is not manufacturing output. Use the calculated
            values below for cutlist and fit decisions.
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
            materialT={parsePositive(sideT) ?? 0.75}
          />
        </div>

        <div className="rounded-2xl border border-[var(--gl-border)] bg-[var(--gl-surface)] p-5">
          <p className="text-xs font-medium tracking-widest text-[var(--gl-muted)] uppercase">
            Calculated outputs
          </p>
          <p className="mt-2 text-xs text-[var(--gl-muted)]">
            These values are derived from the intent inputs above. They update live as you edit; they are not separate
            fields to fill in.
          </p>
          <div className="mt-4 space-y-4">
            <div className="rounded-lg border border-[var(--gl-border)] bg-[var(--gl-surface-muted)] px-3 py-2 text-xs leading-relaxed text-[var(--gl-muted)]">
              <p className="font-medium tracking-wide text-[var(--gl-cream-soft)] uppercase">
                Intent-derived case outputs
              </p>
              <p className="mt-2">
                case interior width = overall width - 2 × side thickness ={" "}
                <strong className="text-[var(--gl-cream)]">
                  {intentDerived.caseInteriorWidth !== null ? fmtInches(intentDerived.caseInteriorWidth) : "—"}
                </strong>
              </p>
              <p>
                per-column opening width = (case interior width - ({Math.max(columns - 1, 0)} × divider thickness)) / {columns} ={" "}
                <strong className="text-[var(--gl-cream)]">
                  {intentDerived.columnOpeningWidth !== null ? fmtInches(intentDerived.columnOpeningWidth) : "—"}
                </strong>
              </p>
              <p>
                row opening budget = drawer zone - rail total ={" "}
                <strong className="text-[var(--gl-cream)]">
                  {intentDerived.openingBudget !== null ? fmtInches(intentDerived.openingBudget) : "—"}
                </strong>
                {" · "}current row opening sum ={" "}
                <strong className="text-[var(--gl-cream)]">
                  {intentDerived.openingsSum !== null ? fmtInches(intentDerived.openingsSum) : "—"}
                </strong>
              </p>
              <p>
                usable depth = overall depth - back thickness - rear clearance ={" "}
                <strong className="text-[var(--gl-cream)]">
                  {intentDerived.depthAvailableForBox !== null ? fmtInches(intentDerived.depthAvailableForBox) : "—"}
                </strong>
                {" · "}resolved box depth = min(slide nominal, usable depth) ={" "}
                <strong className="text-[var(--gl-cream)]">
                  {intentDerived.resolvedBoxDepth !== null ? fmtInches(intentDerived.resolvedBoxDepth) : "—"}
                </strong>
              </p>
              <p>
                width deduction (slide + joinery) ={" "}
                <strong className="text-[var(--gl-cream)]">
                  {intentDerived.totalWidthDeduction !== null ? fmtInches(intentDerived.totalWidthDeduction) : "—"}
                </strong>
                {" · "}height deduction (slide + joinery) ={" "}
                <strong className="text-[var(--gl-cream)]">
                  {intentDerived.totalHeightDeduction !== null ? fmtInches(intentDerived.totalHeightDeduction) : "—"}
                </strong>
              </p>
            </div>
            {result.ok === false ? (
              <p className="text-sm text-[var(--gl-danger)]">{result.message}</p>
            ) : (
              <>
              <p className="text-sm text-[var(--gl-muted)]">
                Interior space and opening math:
                <span className="block mt-1 text-xs leading-relaxed">
                  case interior width = overall width - 2 × side thickness
                  {" · "}
                  per-column opening width = (case interior width - (columns - 1) × center support thickness) / columns
                </span>
              </p>
              <p className="text-sm text-[var(--gl-muted)]">
                Per-column opening width{" "}
                <strong className="text-[var(--gl-cream)]">{fmtInches(result.columnInnerWidth)}</strong>
                {" · "}
                Drawer-zone height{" "}
                <strong className="text-[var(--gl-cream)]">{fmtInches(result.drawerZoneHeight)}</strong>
              </p>
              <p className="rounded-lg border border-[var(--gl-border)] bg-[var(--gl-surface-muted)] px-3 py-2 text-xs leading-relaxed text-[var(--gl-muted)]">
                Final drawer formulas:
                <span className="block mt-1">
                  box width = opening width - slide width clearance - joinery width allowance
                </span>
                <span className="block">
                  box height = opening height - slide height clearance - joinery height allowance
                </span>
                <span className="block">
                  box depth = min(slide length nominal, usable depth)
                </span>
              </p>
              <p className="rounded-lg border border-[var(--gl-copper)]/30 bg-[var(--gl-copper)]/8 px-3 py-2 text-xs leading-relaxed text-[var(--gl-cream-soft)]">
                Current run values: interior width = {fmtInches(parsePositive(outerW) ?? 0)} - 2 ×{" "}
                {fmtInches(parsePositive(sideT) ?? 0)}; per-column opening = (
                {fmtInches((parsePositive(outerW) ?? 0) - 2 * (parsePositive(sideT) ?? 0))} -{" "}
                {Math.max(columns - 1, 0)} × {fmtInches(parsePositive(centerSupportT) ?? 0)}) / {columns} ={" "}
                {fmtInches(result.columnInnerWidth)}.
              </p>
              <p className="rounded-lg border border-[var(--gl-border)] bg-[var(--gl-surface-muted)] px-3 py-2 text-xs leading-relaxed text-[var(--gl-muted)]">
                Build-critical clearances: side clearance per side ≈{" "}
                <strong className="text-[var(--gl-cream)]">
                  {fmtInches((parseInches(slideWClr) ?? 0) / 2)}
                </strong>
                {" · "}
                total width deduction ={" "}
                <strong className="text-[var(--gl-cream)]">
                  {fmtInches((parseInches(slideWClr) ?? 0) + (parseInches(drawerJoineryW) ?? 0))}
                </strong>
                {" · "}
                total height deduction ={" "}
                <strong className="text-[var(--gl-cream)]">
                  {fmtInches((parseInches(slideHClr) ?? 0) + (parseInches(drawerJoineryH) ?? 0))}
                </strong>
                .
              </p>
              <div className="max-h-[min(55vh,520px)] overflow-auto rounded-xl border border-[var(--gl-border)]">
                <table className="gl-numeric w-full text-left text-sm">
                  <thead className="sticky top-0 bg-[var(--gl-ink)]/95 text-xs tracking-wide text-[var(--gl-muted)] uppercase">
                    <tr>
                      <th className="px-3 py-2 font-medium">Cell</th>
                      <th className="px-3 py-2 font-medium">Opening W×H</th>
                      <th className="px-3 py-2 font-medium">Box W×H×D</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--gl-border)] text-[var(--gl-cream)]">
                    {result.cells.map((c) => (
                      <tr key={`${c.columnIndex}-${c.rowIndex}`} className="bg-[var(--gl-surface-inset)]">
                        <td className="px-3 py-2.5 font-medium">{c.label}</td>
                        <td className="px-3 py-2.5 text-[var(--gl-muted)]">
                          {fmtInches(c.openingWidth)} × {fmtInches(c.openingHeight)}
                        </td>
                        <td className="px-3 py-2.5">
                          {fmtInches(c.boxWidth)} × {fmtInches(c.boxHeight)} ×{" "}
                          {fmtInches(c.boxDepth)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="text-xs leading-relaxed text-[var(--gl-muted)]">
                Box depth uses the smaller of slide length and usable depth (
                {fmtInches(result.depthAvailableForBox)} available). Overlay drawers, inset
                face frames, and bottom-mount slide rules are not modeled yet—bump clearances manually.
              </p>
              <button
                type="button"
                className="mt-4 rounded-xl bg-[var(--gl-copper)] px-4 py-2.5 text-sm font-semibold text-[var(--gl-on-accent)] transition hover:bg-[var(--gl-copper-bright)]"
                onClick={handleAddDrawerParts}
              >
                2) Add drawer boxes (append)
              </button>
              <p className="text-xs text-[var(--gl-muted)]">
                Appends only drawer rows so you can stage generation if you prefer.
              </p>
              </>
            )}
          </div>
        </div>

        <section className="rounded-2xl border border-[var(--gl-copper)]/30 bg-[var(--gl-copper)]/8 p-5">
          <p className="text-xs font-medium tracking-widest text-[var(--gl-muted)] uppercase">
            Parts list handoff
          </p>
          <p className="mt-2 text-sm text-[var(--gl-muted)]">
            For a clean dresser pass, generate both together. This uses the current case + slide settings and makes the
            add vs replace behavior explicit.
          </p>
          <p className="mt-2 text-xs text-[var(--gl-muted)]">
            Ready now: {casePartsToAdd.length} case/base/back part(s) + {drawerPartsToAdd.length} drawer box part(s).
            Existing dresser-tagged rows in parts list: {existingDresserPartCount}.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              className="rounded-xl bg-[var(--gl-copper)] px-4 py-2.5 text-sm font-semibold text-[var(--gl-on-accent)] transition hover:bg-[var(--gl-copper-bright)] disabled:cursor-not-allowed disabled:opacity-40"
              disabled={casePartsToAdd.length < 1 || drawerPartsToAdd.length < 1}
              onClick={handleAppendAllDresserParts}
            >
              Add full dresser set (append)
            </button>
            <button
              type="button"
              className="rounded-xl border border-[var(--gl-border-strong)] bg-[var(--gl-surface-muted)] px-4 py-2.5 text-sm font-semibold text-[var(--gl-cream)] transition hover:bg-[var(--gl-surface-muted)] disabled:cursor-not-allowed disabled:opacity-40"
              disabled={casePartsToAdd.length < 1 || drawerPartsToAdd.length < 1}
              onClick={handleReplaceDresserParts}
            >
              Replace dresser rows (case/base/back/drawers)
            </button>
          </div>
          {generationSummaryText ? (
            <p className="mt-3 text-xs text-[var(--gl-cream-soft)]">{generationSummaryText}</p>
          ) : null}
        </section>
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
    <label className="flex flex-col gap-1.5 text-sm">
      <span className="flex flex-wrap items-center gap-2 font-medium text-[var(--gl-cream-soft)]">
        {label}
        {source === "manual" ? (
          <span className="rounded border border-[var(--gl-border)] bg-[var(--gl-surface-muted)] px-1.5 py-0.5 text-[10px] font-normal tracking-wide text-[var(--gl-muted)] uppercase">
            Your input
          </span>
        ) : null}
      </span>
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
