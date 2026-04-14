"use client";

import { useMemo, useState } from "react";
import { useProject } from "@/components/ProjectContext";
import { applyDadoShelfWidth } from "@/lib/joinery/dado-shelf";
import {
  computeDrawerJoineryAllowances,
  DRAWER_JOINERY_PRESET_META,
  type DrawerJoineryPresetId,
} from "@/lib/joinery/drawer-allowances";
import { applyGrooveForQuarterBackPanel } from "@/lib/joinery/groove-back";
import { applyMortiseTenonRail, applyMortiseTenonStile } from "@/lib/joinery/mortise-tenon";
import { buildConstructionPresetPlan, type ConstructionPresetId } from "@/lib/joinery/construction-presets";
import {
  formatInchesForJoineryField,
  recommendedJoinerySummaryLine,
  recommendedParamsForRule,
} from "@/lib/joinery/recommended-params";
import type { JointRuleId } from "@/lib/joinery/types";
import { formatJointRuleLabel } from "@/lib/part-provenance";
import { formatImperial, parseInches } from "@/lib/imperial";
import { newPartId } from "@/lib/project-utils";

const RULE_OPTIONS: { id: JointRuleId; label: string }[] = [
  { id: "groove_quarter_back", label: "Groove for ¼ back" },
  { id: "dado_shelf_width", label: "Dado — shelf width (shrink W)" },
  { id: "mortise_tenon_rail", label: "M&T — rail (extend L)" },
  { id: "mortise_tenon_stile", label: "M&T — stile (shorten L)" },
];

const PRESET_OPTIONS: { id: ConstructionPresetId; label: string }[] = [
  { id: "frame_and_panel", label: "Frame-and-panel" },
  { id: "dovetailed_drawer_box", label: "Dovetailed drawer box" },
  { id: "grooved_back_case", label: "Grooved back case" },
];

function formatTxWxL(t: number, w: number, l: number): string {
  return `${formatImperial(t)} × ${formatImperial(w)} × ${formatImperial(l)}`;
}

export function JoineryPanel() {
  const { project, validationIssues, updatePart, addJointRecord, addConnectionRecord } = useProject();
  const [open, setOpen] = useState(true);
  const [presetId, setPresetId] = useState<ConstructionPresetId>("frame_and_panel");
  const [ruleId, setRuleId] = useState<JointRuleId>("groove_quarter_back");
  const [grooveDepthStr, setGrooveDepthStr] = useState("1/4");
  const [panelThickStr, setPanelThickStr] = useState("1/4");
  const [tenonLenStr, setTenonLenStr] = useState("1");
  const [dadoDepthStr, setDadoDepthStr] = useState("1/4");
  const [hypoW, setHypoW] = useState("");
  const [hypoL, setHypoL] = useState("");
  const [selectedPartId, setSelectedPartId] = useState<string>("");
  const [matePartId, setMatePartId] = useState<string>("");
  const [primaryEdgeLabel, setPrimaryEdgeLabel] = useState("");
  const [mateEdgeLabel, setMateEdgeLabel] = useState("");
  const [expandedJointId, setExpandedJointId] = useState<string | null>(null);
  const [advancedParamsOpen, setAdvancedParamsOpen] = useState(false);
  const [edgeMetadataOpen, setEdgeMetadataOpen] = useState(false);
  const [useCustomJoineryParams, setUseCustomJoineryParams] = useState(false);
  const [drawerPresetId, setDrawerPresetId] = useState<DrawerJoineryPresetId>("butt");
  const [drawerMaterialThicknessStr, setDrawerMaterialThicknessStr] = useState("0.5");
  const [drawerHalfLapRatioStr, setDrawerHalfLapRatioStr] = useState("0.5");
  const [drawerHalfLapDepthStr, setDrawerHalfLapDepthStr] = useState("");

  function evaluateRule(
    currentRuleId: JointRuleId,
    params: Record<string, number>
  ): ReturnType<typeof applyGrooveForQuarterBackPanel> | null {
    if (currentRuleId === "groove_quarter_back") {
      return applyGrooveForQuarterBackPanel({
        grooveDepth: Math.max(0, params.grooveDepth ?? 0),
        panelThickness: Math.max(0, params.panelThickness ?? 0.25),
      });
    }
    if (currentRuleId === "dado_shelf_width") {
      return applyDadoShelfWidth({ dadoDepth: Math.max(0, params.dadoDepth ?? 0) });
    }
    if (currentRuleId === "mortise_tenon_rail") {
      return applyMortiseTenonRail({ tenonLengthPerEnd: Math.max(0, params.tenonLengthPerEnd ?? 0) });
    }
    if (currentRuleId === "mortise_tenon_stile") {
      return applyMortiseTenonStile({ tenonLengthPerEnd: Math.max(0, params.tenonLengthPerEnd ?? 0) });
    }
    return null;
  }

  const backParts = useMemo(() => project.parts.filter((p) => p.assembly === "Back"), [project.parts]);

  const selectableParts = useMemo(() => {
    if (ruleId === "groove_quarter_back") return backParts;
    return project.parts;
  }, [ruleId, backParts, project.parts]);

  const resolvedPartId = useMemo(
    () => (selectableParts.some((p) => p.id === selectedPartId) ? selectedPartId : ""),
    [selectableParts, selectedPartId]
  );

  const resolvedMateId = useMemo(() => {
    if (!matePartId || matePartId === resolvedPartId) return "";
    return project.parts.some((p) => p.id === matePartId) ? matePartId : "";
  }, [matePartId, resolvedPartId, project.parts]);

  const selectedPartForJoinery = useMemo(
    () => (resolvedPartId ? project.parts.find((p) => p.id === resolvedPartId) : undefined),
    [project.parts, resolvedPartId]
  );
  const primaryFinishedThicknessIn = selectedPartForJoinery?.finished.t ?? null;

  const effectiveJoineryNumbers = useMemo(() => {
    if (ruleId === "groove_quarter_back") {
      if (!useCustomJoineryParams) {
        const r = recommendedParamsForRule("groove_quarter_back", primaryFinishedThicknessIn);
        if (r.ruleId !== "groove_quarter_back") {
          return {
            grooveDepth: null as number | null,
            panelThickness: null as number | null,
            dadoDepth: null as number | null,
            tenonLen: null as number | null,
          };
        }
        return {
          grooveDepth: r.grooveDepth,
          panelThickness: r.panelThickness,
          dadoDepth: null as number | null,
          tenonLen: null as number | null,
        };
      }
      return {
        grooveDepth: parseInches(grooveDepthStr),
        panelThickness: parseInches(panelThickStr),
        dadoDepth: null,
        tenonLen: null,
      };
    }
    if (ruleId === "dado_shelf_width") {
      if (!useCustomJoineryParams) {
        const r = recommendedParamsForRule("dado_shelf_width", primaryFinishedThicknessIn);
        if (r.ruleId !== "dado_shelf_width") {
          return {
            grooveDepth: null,
            panelThickness: null,
            dadoDepth: null,
            tenonLen: null,
          };
        }
        return {
          grooveDepth: null,
          panelThickness: null,
          dadoDepth: r.dadoDepth,
          tenonLen: null,
        };
      }
      return {
        grooveDepth: null,
        panelThickness: null,
        dadoDepth: parseInches(dadoDepthStr),
        tenonLen: null,
      };
    }
    if (!useCustomJoineryParams) {
      const r = recommendedParamsForRule(ruleId, primaryFinishedThicknessIn);
      if (r.ruleId !== "mortise_tenon_rail" && r.ruleId !== "mortise_tenon_stile") {
        return {
          grooveDepth: null,
          panelThickness: null,
          dadoDepth: null,
          tenonLen: null,
        };
      }
      return {
        grooveDepth: null,
        panelThickness: null,
        dadoDepth: null,
        tenonLen: r.tenonLengthPerEnd,
      };
    }
    return {
      grooveDepth: null,
      panelThickness: null,
      dadoDepth: null,
      tenonLen: parseInches(tenonLenStr),
    };
  }, [
    ruleId,
    useCustomJoineryParams,
    primaryFinishedThicknessIn,
    grooveDepthStr,
    panelThickStr,
    dadoDepthStr,
    tenonLenStr,
  ]);

  const grooveDepth = effectiveJoineryNumbers.grooveDepth;
  const panelThickness = effectiveJoineryNumbers.panelThickness;
  const dadoDepth = effectiveJoineryNumbers.dadoDepth;
  const tenonLen = effectiveJoineryNumbers.tenonLen;

  const ruleResult = useMemo(() => {
    if (ruleId === "groove_quarter_back") {
      if (grooveDepth === null || grooveDepth < 0 || panelThickness === null || panelThickness < 0) return null;
      return evaluateRule(ruleId, { grooveDepth, panelThickness });
    }
    if (ruleId === "dado_shelf_width") {
      if (dadoDepth === null || dadoDepth < 0) return null;
      return evaluateRule(ruleId, { dadoDepth });
    }
    if (tenonLen === null || tenonLen < 0) return null;
    return evaluateRule(ruleId, { tenonLengthPerEnd: tenonLen });
  }, [ruleId, grooveDepth, panelThickness, tenonLen, dadoDepth]);

  const mateCandidates = useMemo(
    () => project.parts.filter((p) => p.id !== resolvedPartId),
    [project.parts, resolvedPartId]
  );

  const hypoParsed = useMemo(() => {
    const w = hypoW.trim() ? parseInches(hypoW) : null;
    const l = hypoL.trim() ? parseInches(hypoL) : null;
    if (w === null || l === null || w <= 0 || l <= 0) return null;
    return { w, l };
  }, [hypoW, hypoL]);

  const recommendedHypo = useMemo(() => {
    if (!ruleResult || ruleId !== "groove_quarter_back" || !hypoParsed) return null;
    const { finishedDimensionDeltas: d } = ruleResult;
    return {
      t: panelThickness ?? 0,
      w: hypoParsed.w + d.w,
      l: hypoParsed.l + d.l,
    };
  }, [ruleResult, hypoParsed, panelThickness, ruleId]);

  const selectedPresetPlan = useMemo(
    () => buildConstructionPresetPlan(project.parts, presetId),
    [project.parts, presetId]
  );

  const presetAffectedPartCount = useMemo(
    () =>
      selectedPresetPlan.applications.reduce((sum, app) => {
        return sum + app.partIds.length;
      }, 0),
    [selectedPresetPlan]
  );

  const drawerPresetPreview = useMemo(() => {
    const t = parseInches(drawerMaterialThicknessStr);
    if (t === null || t <= 0) return null;
    const ratio = parseInches(drawerHalfLapRatioStr);
    const depth = parseInches(drawerHalfLapDepthStr);
    if (ratio !== null && ratio < 0) return null;
    if (depth !== null && depth < 0) return null;
    return computeDrawerJoineryAllowances({
      preset: drawerPresetId,
      materialThickness: t,
      halfLapRatio: ratio ?? undefined,
      halfLapDepth: drawerHalfLapDepthStr.trim() ? (depth ?? undefined) : undefined,
    });
  }, [
    drawerPresetId,
    drawerMaterialThicknessStr,
    drawerHalfLapRatioStr,
    drawerHalfLapDepthStr,
  ]);

  function resetJoineryParamsToRecommended() {
    setUseCustomJoineryParams(false);
  }

  function applyRuleToSelected() {
    if (!ruleResult || !resolvedPartId) return;
    const part = project.parts.find((p) => p.id === resolvedPartId);
    if (!part) return;
    if (ruleId === "groove_quarter_back" && part.assembly !== "Back") return;

    const before = { ...part.finished };
    const d = ruleResult.finishedDimensionDeltas;
    const after = {
      t: before.t + d.t,
      w: before.w + d.w,
      l: before.l + d.l,
    };
    updatePart(resolvedPartId, { finished: after });

    const params: Record<string, number> =
      ruleId === "groove_quarter_back"
        ? { grooveDepth: grooveDepth ?? 0, panelThickness: panelThickness ?? 0 }
        : ruleId === "dado_shelf_width"
          ? { dadoDepth: dadoDepth ?? 0 }
          : { tenonLengthPerEnd: tenonLen ?? 0 };

    const pe = primaryEdgeLabel.trim();
    const me = mateEdgeLabel.trim();

    const jointId = newPartId();
    const applicationId = newPartId();
    addJointRecord({
      id: jointId,
      applicationId,
      ruleId,
      primaryPartId: resolvedPartId,
      matePartId: resolvedMateId || undefined,
      primaryEdgeLabel: pe || undefined,
      mateEdgeLabel: me || undefined,
      params,
      explanation: ruleResult.explanation,
      finishedBefore: before,
      finishedAfter: after,
    });

    if (resolvedMateId) {
      addConnectionRecord({
        applicationId,
        partAId: resolvedPartId,
        partBId: resolvedMateId,
        ruleId,
        params,
        primaryEdgeLabel: pe || undefined,
        mateEdgeLabel: me || undefined,
        explanation: ruleResult.explanation,
        jointId,
        createdAt: new Date().toISOString(),
      });
    }
  }

  function applySelectedPreset() {
    const presetPlan = buildConstructionPresetPlan(project.parts, presetId);
    if (presetPlan.applications.length < 1) return;
    const applicationId = newPartId();
    for (const application of presetPlan.applications) {
      const result = evaluateRule(application.ruleId, application.params);
      if (!result) continue;
      for (const partId of application.partIds) {
        const part = project.parts.find((candidate) => candidate.id === partId);
        if (!part) continue;
        if (application.ruleId === "groove_quarter_back" && part.assembly !== "Back" && part.status !== "panel") {
          continue;
        }
        const before = { ...part.finished };
        const after = {
          t: before.t + result.finishedDimensionDeltas.t,
          w: before.w + result.finishedDimensionDeltas.w,
          l: before.l + result.finishedDimensionDeltas.l,
        };
        updatePart(partId, { finished: after });
        const jointId = newPartId();
        const matePart = project.parts.find(
          (candidate) => candidate.id !== partId && candidate.assembly === part.assembly
        );
        addJointRecord({
          id: jointId,
          applicationId,
          presetId: presetPlan.id,
          presetLabel: presetPlan.label,
          ruleId: application.ruleId,
          primaryPartId: partId,
          matePartId: matePart?.id,
          params: application.params,
          explanation: `${application.explanation} ${result.explanation}`,
          finishedBefore: before,
          finishedAfter: after,
        });
        if (matePart) {
          addConnectionRecord({
            applicationId,
            partAId: partId,
            partBId: matePart.id,
            ruleId: application.ruleId,
            params: application.params,
            explanation: `${presetPlan.label}: ${application.explanation}`,
            jointId,
            createdAt: new Date().toISOString(),
          });
        }
      }
    }
  }

  const groupedHistory = useMemo(() => {
    const jointsByApplication = new Map<string, typeof project.joints>();
    for (const joint of project.joints) {
      const key = joint.applicationId ?? joint.id;
      const existing = jointsByApplication.get(key) ?? [];
      existing.push(joint);
      jointsByApplication.set(key, existing);
    }
    const connectionByJointId = new Map<string, typeof project.connections>();
    for (const connection of project.connections) {
      if (!connection.jointId) continue;
      const existing = connectionByJointId.get(connection.jointId) ?? [];
      existing.push(connection);
      connectionByJointId.set(connection.jointId, existing);
    }
    return [...jointsByApplication.entries()]
      .reverse()
      .map(([applicationId, joints]) => {
        const byAssembly = new Map<string, typeof joints>();
        for (const joint of joints) {
          const part = project.parts.find((candidate) => candidate.id === joint.primaryPartId);
          const assembly = part?.assembly ?? "Other";
          const rows = byAssembly.get(assembly) ?? [];
          rows.push(joint);
          byAssembly.set(assembly, rows);
        }
        return {
          applicationId,
          joints,
          assemblyGroups: [...byAssembly.entries()],
          label: joints[0]?.presetLabel ?? formatJointRuleLabel(joints[0]?.ruleId ?? "connection"),
          connectionByJointId,
        };
      });
  }, [project]);

  const invalidGroove =
    grooveDepth === null || grooveDepth < 0 || panelThickness === null || panelThickness < 0;
  const invalidDado = dadoDepth === null || dadoDepth < 0;
  const invalidTenon = tenonLen === null || tenonLen < 0;
  const invalidInputs =
    ruleId === "groove_quarter_back"
      ? invalidGroove
      : ruleId === "dado_shelf_width"
        ? invalidDado
        : invalidTenon;

  return (
    <section
      id="joinery-panel-section"
      className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 backdrop-blur-md"
      aria-labelledby="joinery-panel-title"
    >
      <button
        type="button"
        className="flex w-full items-center justify-between gap-2 text-left"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
      >
        <div>
          <p id="joinery-panel-title" className="text-xs font-medium tracking-widest text-[var(--gl-muted)] uppercase">
            Joinery
          </p>
          <p className="mt-1 text-sm text-[var(--gl-muted)]">Rules, history, and before/after finished sizes.</p>
        </div>
        <span className="text-[var(--gl-muted)]">{open ? "−" : "+"}</span>
      </button>

      {open ? (
        <div className="mt-4 space-y-4 border-t border-white/10 pt-4">
          {validationIssues.some((issue) => issue.source === "joinery") ? (
            <div className="rounded-xl border border-amber-300/30 bg-amber-500/10 p-3">
              <p className="text-xs font-medium text-amber-100">Joinery validation issues</p>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-xs text-amber-100/90" aria-label="Joinery issues">
                {validationIssues
                  .filter((issue) => issue.source === "joinery")
                  .slice(0, 5)
                  .map((issue) => (
                    <li key={issue.id}>
                      [{issue.severity}] {issue.message}
                    </li>
                  ))}
              </ul>
            </div>
          ) : null}
          {groupedHistory.length > 0 ? (
            <div className="rounded-xl border border-white/10 bg-black/20 p-3">
              <p className="text-xs font-medium text-[var(--gl-cream)]">
                Construction logic trace ({project.joints.length} records)
              </p>
              <ul className="mt-2 space-y-1">
                {groupedHistory.map((group) => {
                  const isOpen = expandedJointId === group.applicationId;
                  return (
                    <li key={group.applicationId} className="text-xs text-[var(--gl-muted)]">
                      <button
                        type="button"
                        className="flex w-full items-center justify-between gap-2 rounded-lg px-2 py-1.5 text-left hover:bg-white/5"
                        onClick={() => setExpandedJointId(isOpen ? null : group.applicationId)}
                      >
                        <span className="text-[var(--gl-cream-soft)]">
                          {group.label} · {group.joints.length} change{group.joints.length === 1 ? "" : "s"}
                        </span>
                        <span className="text-[var(--gl-muted)]">{isOpen ? "−" : "+"}</span>
                      </button>
                      {isOpen ? (
                        <div className="ml-2 mt-1 space-y-2 border-l border-white/10 pl-3">
                          {group.assemblyGroups.map(([assembly, joints]) => (
                            <div key={`${group.applicationId}-${assembly}`} className="rounded-lg border border-white/10 bg-black/20 p-2">
                              <p className="text-[11px] font-medium tracking-wide text-[var(--gl-cream-soft)] uppercase">
                                {assembly}
                              </p>
                              <ul className="mt-1 space-y-1">
                                {joints.map((j) => {
                                  const part = project.parts.find((p) => p.id === j.primaryPartId);
                                  const mate = j.matePartId
                                    ? project.parts.find((p) => p.id === j.matePartId)
                                    : undefined;
                                  const d = {
                                    t: j.finishedAfter.t - j.finishedBefore.t,
                                    w: j.finishedAfter.w - j.finishedBefore.w,
                                    l: j.finishedAfter.l - j.finishedBefore.l,
                                  };
                                  const linkedConnections = group.connectionByJointId.get(j.id) ?? [];
                                  return (
                                    <li key={j.id} className="rounded border border-white/10 bg-black/20 p-2">
                                      <p className="text-[11px] text-[var(--gl-cream-soft)]">
                                        {formatJointRuleLabel(j.ruleId)} → {(part?.name || "Part").trim()}
                                        {mate ? ` ↔ ${(mate.name || "Part").trim()}` : ""}
                                      </p>
                                      <p className="mt-0.5 text-[11px] text-[var(--gl-muted)]">{j.explanation}</p>
                                      <p className="mt-0.5 font-mono text-[11px] text-[var(--gl-cream)]">
                                        ΔT {d.t.toFixed(3)}&quot; · ΔW {d.w.toFixed(3)}&quot; · ΔL {d.l.toFixed(3)}&quot;
                                      </p>
                                      <p className="font-mono text-[11px] text-[var(--gl-muted)]">
                                        Before {formatTxWxL(j.finishedBefore.t, j.finishedBefore.w, j.finishedBefore.l)}
                                      </p>
                                      <p className="font-mono text-[11px] text-[var(--gl-copper-bright)]">
                                        After {formatTxWxL(j.finishedAfter.t, j.finishedAfter.w, j.finishedAfter.l)}
                                      </p>
                                      {linkedConnections.length > 0 ? (
                                        <p className="mt-0.5 text-[11px] text-[var(--gl-muted)]">
                                          Connection:{" "}
                                          {linkedConnections
                                            .map((conn) => {
                                              const partA = project.parts.find((p) => p.id === conn.partAId);
                                              const partB = project.parts.find((p) => p.id === conn.partBId);
                                              return `${(partA?.name || "Part").trim()} ↔ ${(partB?.name || "Part").trim()}`;
                                            })
                                            .join(" · ")}
                                        </p>
                                      ) : null}
                                    </li>
                                  );
                                })}
                              </ul>
                            </div>
                          ))}
                        </div>
                      ) : null}
                    </li>
                  );
                })}
              </ul>
            </div>
          ) : null}

          <div className="rounded-xl border border-white/10 bg-black/20 p-3">
            <p className="text-xs font-medium text-[var(--gl-cream)]">Construction presets</p>
            <p className="mt-1 text-xs text-[var(--gl-muted)]">
              Presets apply a coordinated bundle of joinery rules and linked connections in one traceable action.
            </p>
            <label className="mt-2 block text-xs text-[var(--gl-muted)]">
              Preset
              <select
                className="mt-1 w-full rounded-lg border border-white/15 bg-black/30 px-3 py-2 text-sm text-[var(--gl-cream)]"
                value={presetId}
                onChange={(e) => setPresetId(e.target.value as ConstructionPresetId)}
              >
                {PRESET_OPTIONS.map((preset) => (
                  <option key={preset.id} value={preset.id}>
                    {preset.label}
                  </option>
                ))}
              </select>
            </label>
            <p className="mt-2 text-xs leading-relaxed text-[var(--gl-cream-soft)]">{selectedPresetPlan.summary}</p>
            <ul className="mt-2 space-y-1 text-xs text-[var(--gl-muted)]">
              {selectedPresetPlan.applications.map((application) => (
                <li key={`${selectedPresetPlan.id}-${application.ruleId}`}>
                  {formatJointRuleLabel(application.ruleId)} · {application.partIds.length} target
                  {application.partIds.length === 1 ? "" : "s"}
                </li>
              ))}
            </ul>
            <button
              type="button"
              onClick={applySelectedPreset}
              disabled={presetAffectedPartCount < 1}
              className="mt-3 rounded-lg border border-[var(--gl-copper-bright)]/50 bg-[var(--gl-copper)]/20 px-3 py-2 text-xs font-medium text-[var(--gl-cream)] enabled:hover:bg-[var(--gl-copper)]/30 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Apply preset
            </button>
            {presetAffectedPartCount < 1 ? (
              <p className="mt-2 text-xs text-amber-200/90">
                No matching parts found for this preset yet. Add rails/stiles, drawers, shelves, or back parts first.
              </p>
            ) : null}
          </div>

          <div className="rounded-xl border border-white/10 bg-black/20 p-3">
            <p className="text-xs font-medium text-[var(--gl-cream)]">Drawer joinery allowance presets</p>
            <p className="mt-1 text-xs text-[var(--gl-muted)]">
              Engineering presets compute allowance from drawer side thickness and joint strategy.
            </p>
            <label className="mt-2 block text-xs text-[var(--gl-muted)]">
              Joint strategy
              <select
                className="mt-1 w-full rounded-lg border border-white/15 bg-black/30 px-3 py-2 text-sm text-[var(--gl-cream)]"
                value={drawerPresetId}
                onChange={(e) => setDrawerPresetId(e.target.value as DrawerJoineryPresetId)}
              >
                {(Object.keys(DRAWER_JOINERY_PRESET_META) as DrawerJoineryPresetId[]).map((preset) => (
                  <option key={preset} value={preset}>
                    {DRAWER_JOINERY_PRESET_META[preset].engineeringLabel}
                  </option>
                ))}
              </select>
            </label>
            <div className="mt-2 grid grid-cols-2 gap-2">
              <label className="text-xs text-[var(--gl-muted)]">
                Material thickness t
                <input
                  className="mt-1 w-full rounded-lg border border-white/15 bg-black/30 px-3 py-2 text-sm text-[var(--gl-cream)]"
                  value={drawerMaterialThicknessStr}
                  onChange={(e) => setDrawerMaterialThicknessStr(e.target.value)}
                />
              </label>
              {drawerPresetId === "dovetail_half_lap" ? (
                <label className="text-xs text-[var(--gl-muted)]">
                  Half-lap ratio
                  <input
                    className="mt-1 w-full rounded-lg border border-white/15 bg-black/30 px-3 py-2 text-sm text-[var(--gl-cream)]"
                    value={drawerHalfLapRatioStr}
                    onChange={(e) => setDrawerHalfLapRatioStr(e.target.value)}
                  />
                </label>
              ) : null}
            </div>
            {drawerPresetId === "dovetail_half_lap" ? (
              <label className="mt-2 block text-xs text-[var(--gl-muted)]">
                Half-lap depth per side (optional)
                <input
                  className="mt-1 w-full rounded-lg border border-white/15 bg-black/30 px-3 py-2 text-sm text-[var(--gl-cream)]"
                  value={drawerHalfLapDepthStr}
                  onChange={(e) => setDrawerHalfLapDepthStr(e.target.value)}
                />
              </label>
            ) : null}
            {drawerPresetPreview ? (
              <p className="mt-2 text-xs text-[var(--gl-cream-soft)]">
                Width allowance {formatImperial(drawerPresetPreview.widthAllowance)}; formula{" "}
                <span className="font-mono">{drawerPresetPreview.formulaId}</span>; provenance{" "}
                {drawerPresetPreview.provenance}
              </p>
            ) : (
              <p className="mt-2 text-xs text-amber-200/90">Enter valid non-negative values to preview allowance.</p>
            )}
          </div>

          <label className="block text-xs text-[var(--gl-muted)]">
            Rule
            <select
              className="mt-1 w-full rounded-lg border border-white/15 bg-black/30 px-3 py-2 text-sm text-[var(--gl-cream)]"
              value={ruleId}
              onChange={(e) => {
                setRuleId(e.target.value as JointRuleId);
                setUseCustomJoineryParams(false);
              }}
            >
              {RULE_OPTIONS.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.label}
                </option>
              ))}
            </select>
          </label>

          <div className="space-y-2 rounded-xl border border-white/10 bg-black/15 px-3 py-3">
            <p className="text-sm leading-relaxed text-[var(--gl-cream-soft)]">
              {useCustomJoineryParams ? (
                <>Using custom parameters — expand Advanced below to edit.</>
              ) : (
                <>
                  Using recommended:{" "}
                  {recommendedJoinerySummaryLine(ruleId, primaryFinishedThicknessIn, {
                    hasSelectedPart: Boolean(selectedPartForJoinery),
                    partLabel: selectedPartForJoinery?.name,
                  })}
                </>
              )}
            </p>
            <div className="rounded-lg border border-white/10 bg-black/20">
              <button
                type="button"
                className="flex w-full items-center justify-between gap-2 rounded-lg px-3 py-2.5 text-left text-xs font-medium text-[var(--gl-cream)]"
                onClick={() => setAdvancedParamsOpen((o) => !o)}
                aria-expanded={advancedParamsOpen}
              >
                <span>Advanced parameters</span>
                <span className="text-[var(--gl-muted)]">{advancedParamsOpen ? "−" : "+"}</span>
              </button>
              {advancedParamsOpen ? (
                <div className="space-y-3 border-t border-white/10 px-3 py-3">
                  <p className="text-[11px] leading-relaxed text-[var(--gl-muted)]">
                    Override groove, panel, dado, or tenon numbers. Rule changes reset to recommended values.
                  </p>
                  {ruleId === "groove_quarter_back" ? (
                    <div className="grid grid-cols-2 gap-3">
                      <label className="block text-xs text-[var(--gl-muted)]">
                        Groove depth
                        <input
                          className="mt-1 w-full rounded-lg border border-white/15 bg-black/30 px-3 py-2 text-sm text-[var(--gl-cream)]"
                          value={
                            useCustomJoineryParams
                              ? grooveDepthStr
                              : grooveDepth !== null
                                ? formatInchesForJoineryField(grooveDepth)
                                : ""
                          }
                          onChange={(e) => {
                            setUseCustomJoineryParams(true);
                            setGrooveDepthStr(e.target.value);
                          }}
                          inputMode="decimal"
                          aria-invalid={
                            useCustomJoineryParams
                              ? (() => {
                                  const v = parseInches(grooveDepthStr);
                                  return v === null || v < 0;
                                })()
                              : false
                          }
                        />
                      </label>
                      <label className="block text-xs text-[var(--gl-muted)]">
                        Panel thickness (label)
                        <input
                          className="mt-1 w-full rounded-lg border border-white/15 bg-black/30 px-3 py-2 text-sm text-[var(--gl-cream)]"
                          value={
                            useCustomJoineryParams
                              ? panelThickStr
                              : panelThickness !== null
                                ? formatInchesForJoineryField(panelThickness)
                                : ""
                          }
                          onChange={(e) => {
                            setUseCustomJoineryParams(true);
                            setPanelThickStr(e.target.value);
                          }}
                          inputMode="decimal"
                          aria-invalid={
                            useCustomJoineryParams
                              ? (() => {
                                  const v = parseInches(panelThickStr);
                                  return v === null || v < 0;
                                })()
                              : false
                          }
                        />
                      </label>
                    </div>
                  ) : ruleId === "dado_shelf_width" ? (
                    <label className="block text-xs text-[var(--gl-muted)]">
                      Dado depth (in)
                      <input
                        className="mt-1 w-full rounded-lg border border-white/15 bg-black/30 px-3 py-2 text-sm text-[var(--gl-cream)]"
                        value={
                          useCustomJoineryParams
                            ? dadoDepthStr
                            : dadoDepth !== null
                              ? formatInchesForJoineryField(dadoDepth)
                              : ""
                        }
                        onChange={(e) => {
                          setUseCustomJoineryParams(true);
                          setDadoDepthStr(e.target.value);
                        }}
                        inputMode="decimal"
                        aria-invalid={
                          useCustomJoineryParams
                            ? (() => {
                                const v = parseInches(dadoDepthStr);
                                return v === null || v < 0;
                              })()
                            : false
                        }
                      />
                    </label>
                  ) : (
                    <label className="block text-xs text-[var(--gl-muted)]">
                      Tenon length per end (in)
                      <input
                        className="mt-1 w-full rounded-lg border border-white/15 bg-black/30 px-3 py-2 text-sm text-[var(--gl-cream)]"
                        value={
                          useCustomJoineryParams
                            ? tenonLenStr
                            : tenonLen !== null
                              ? formatInchesForJoineryField(tenonLen)
                              : ""
                        }
                        onChange={(e) => {
                          setUseCustomJoineryParams(true);
                          setTenonLenStr(e.target.value);
                        }}
                        inputMode="decimal"
                        aria-invalid={
                          useCustomJoineryParams
                            ? (() => {
                                const v = parseInches(tenonLenStr);
                                return v === null || v < 0;
                              })()
                            : false
                        }
                      />
                    </label>
                  )}
                  {useCustomJoineryParams ? (
                    <button
                      type="button"
                      onClick={resetJoineryParamsToRecommended}
                      className="text-xs font-medium text-[var(--gl-copper-bright)] underline decoration-dotted underline-offset-2 hover:text-[var(--gl-cream)]"
                    >
                      Reset to recommended
                    </button>
                  ) : null}
                </div>
              ) : null}
            </div>
          </div>

          {invalidInputs ? (
            <p className="text-sm text-amber-200/90">Enter valid non-negative dimensions (e.g. 0.25 or 1/4).</p>
          ) : ruleResult ? (
            <p className="text-sm leading-relaxed text-[var(--gl-cream-soft)]">{ruleResult.explanation}</p>
          ) : null}

          {ruleResult && !invalidInputs ? (
            <p className="text-xs text-[var(--gl-muted)]">
              Suggested finished deltas: ΔT {ruleResult.finishedDimensionDeltas.t.toFixed(3)}&quot;, ΔW{" "}
              {ruleResult.finishedDimensionDeltas.w.toFixed(3)}&quot;, ΔL{" "}
              {ruleResult.finishedDimensionDeltas.l.toFixed(3)}&quot;
            </p>
          ) : null}

          {ruleId === "groove_quarter_back" && ruleResult && !invalidInputs ? (
            <div className="rounded-xl border border-white/10 bg-black/20 p-3">
              <p className="text-xs font-medium text-[var(--gl-cream)]">Hypothetical opening (read-only)</p>
              <p className="mt-1 text-xs text-[var(--gl-muted)]">
                If inner opening W×L were flush-sized, recommended panel finished T×W×L:
              </p>
              <div className="mt-2 grid grid-cols-2 gap-2">
                <label className="text-xs text-[var(--gl-muted)]">
                  Opening W
                  <input
                    className="mt-1 w-full rounded border border-white/10 bg-black/30 px-2 py-1.5 text-sm text-[var(--gl-cream)]"
                    value={hypoW}
                    onChange={(e) => setHypoW(e.target.value)}
                    placeholder="e.g. 32"
                  />
                </label>
                <label className="text-xs text-[var(--gl-muted)]">
                  Opening L
                  <input
                    className="mt-1 w-full rounded border border-white/10 bg-black/30 px-2 py-1.5 text-sm text-[var(--gl-cream)]"
                    value={hypoL}
                    onChange={(e) => setHypoL(e.target.value)}
                    placeholder="e.g. 28"
                  />
                </label>
              </div>
              {recommendedHypo && panelThickness !== null ? (
                <p className="mt-2 text-sm text-[var(--gl-copper-bright)]">
                  T {formatImperial(recommendedHypo.t)} × W {formatImperial(recommendedHypo.w)} × L{" "}
                  {formatImperial(recommendedHypo.l)}
                </p>
              ) : (
                <p className="mt-2 text-xs text-[var(--gl-muted)]">Enter positive W and L to see a recommendation.</p>
              )}
            </div>
          ) : null}

          <div className="rounded-xl border border-white/10 bg-black/20 p-3">
            <p className="text-xs font-medium text-[var(--gl-cream)]">Apply to a part</p>
            <p className="mt-1 text-xs text-[var(--gl-muted)]">
              Recommended flow: choose rule + part, then apply. Rough recomputes unless rough is manual.
            </p>
            {selectableParts.length === 0 ? (
              <p className="mt-2 text-sm text-[var(--gl-muted)]">
                {ruleId === "groove_quarter_back"
                  ? 'No parts with assembly "Back" yet.'
                  : ruleId === "dado_shelf_width"
                    ? "No parts yet—add a shelf part to shrink W for dados."
                    : "No parts in the project yet."}
              </p>
            ) : (
              <>
                <select
                  className="mt-2 w-full rounded-lg border border-white/15 bg-black/30 px-3 py-2 text-sm text-[var(--gl-cream)]"
                  value={resolvedPartId}
                  onChange={(e) => setSelectedPartId(e.target.value)}
                >
                  <option value="">Select part…</option>
                  {selectableParts.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name.trim() || "Unnamed"} ({p.assembly}) — L {formatImperial(p.finished.l)}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  disabled={!resolvedPartId || !ruleResult || invalidInputs}
                  className="mt-2 rounded-lg border border-[var(--gl-copper-bright)]/50 bg-[var(--gl-copper)]/20 px-3 py-2 text-xs font-medium text-[var(--gl-cream)] enabled:hover:bg-[var(--gl-copper)]/30 disabled:cursor-not-allowed disabled:opacity-40"
                  onClick={applyRuleToSelected}
                >
                  Apply rule to selected part
                </button>
              </>
            )}
            <div className="mt-3 rounded-lg border border-white/10 bg-black/20">
              <button
                type="button"
                className="flex w-full items-center justify-between gap-2 rounded-lg px-3 py-2 text-left text-xs font-medium text-[var(--gl-cream)]"
                onClick={() => setEdgeMetadataOpen((o) => !o)}
                aria-expanded={edgeMetadataOpen}
              >
                <span>Advanced edge metadata (optional)</span>
                <span className="text-[var(--gl-muted)]">{edgeMetadataOpen ? "−" : "+"}</span>
              </button>
              {edgeMetadataOpen ? (
                <div className="space-y-2 border-t border-white/10 px-3 py-3">
                  <p className="text-[11px] leading-relaxed text-[var(--gl-muted)]">
                    Add mate/edge notes only when you need traceable edge-level provenance in the joint log.
                  </p>
                  <div className="grid gap-2 sm:grid-cols-2">
                    <label className="block text-xs text-[var(--gl-muted)]">
                      Mate part (optional)
                      <select
                        className="mt-1 w-full rounded-lg border border-white/15 bg-black/30 px-3 py-2 text-sm text-[var(--gl-cream)]"
                        value={resolvedMateId}
                        onChange={(e) => setMatePartId(e.target.value)}
                        disabled={!resolvedPartId}
                      >
                        <option value="">None</option>
                        {mateCandidates.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name.trim() || "Unnamed"} ({p.assembly})
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="block text-xs text-[var(--gl-muted)]">
                      Primary edge / face (optional)
                      <input
                        className="mt-1 w-full rounded-lg border border-white/15 bg-black/30 px-3 py-2 text-sm text-[var(--gl-cream)]"
                        value={primaryEdgeLabel}
                        onChange={(e) => setPrimaryEdgeLabel(e.target.value)}
                        placeholder='e.g. "long grain / L"'
                      />
                    </label>
                    <label className="block text-xs text-[var(--gl-muted)] sm:col-span-2">
                      Mate edge / face (optional)
                      <input
                        className="mt-1 w-full rounded-lg border border-white/15 bg-black/30 px-3 py-2 text-sm text-[var(--gl-cream)]"
                        value={mateEdgeLabel}
                        onChange={(e) => setMateEdgeLabel(e.target.value)}
                        placeholder='e.g. "inside face, dado bottom"'
                      />
                    </label>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
