"use client";

import { useMemo, useState } from "react";
import { useProject } from "@/components/ProjectContext";
import { applyDadoShelfWidth } from "@/lib/joinery/dado-shelf";
import { applyGrooveForQuarterBackPanel } from "@/lib/joinery/groove-back";
import { applyMortiseTenonRail, applyMortiseTenonStile } from "@/lib/joinery/mortise-tenon";
import type { JointRuleId } from "@/lib/joinery/types";
import { formatImperial, parseInches } from "@/lib/imperial";

const RULE_OPTIONS: { id: JointRuleId; label: string }[] = [
  { id: "groove_quarter_back", label: "Groove for ¼ back" },
  { id: "dado_shelf_width", label: "Dado — shelf width (shrink W)" },
  { id: "mortise_tenon_rail", label: "M&T — rail (extend L)" },
  { id: "mortise_tenon_stile", label: "M&T — stile (shorten L)" },
];

const RULE_LABELS: Record<JointRuleId, string> = {
  groove_quarter_back: "Groove / ¼ back",
  dado_shelf_width: "Dado shelf",
  mortise_tenon_rail: "M&T rail",
  mortise_tenon_stile: "M&T stile",
};

function formatTxWxL(t: number, w: number, l: number): string {
  return `${formatImperial(t)} × ${formatImperial(w)} × ${formatImperial(l)}`;
}

export function JoineryPanel() {
  const { project, updatePart, addJointRecord } = useProject();
  const [open, setOpen] = useState(true);
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

  const grooveDepth = parseInches(grooveDepthStr);
  const panelThickness = parseInches(panelThickStr);
  const tenonLen = parseInches(tenonLenStr);
  const dadoDepth = parseInches(dadoDepthStr);

  const ruleResult = useMemo(() => {
    if (ruleId === "groove_quarter_back") {
      if (grooveDepth === null || grooveDepth < 0 || panelThickness === null || panelThickness < 0) return null;
      return applyGrooveForQuarterBackPanel({ grooveDepth, panelThickness });
    }
    if (ruleId === "dado_shelf_width") {
      if (dadoDepth === null || dadoDepth < 0) return null;
      return applyDadoShelfWidth({ dadoDepth });
    }
    if (ruleId === "mortise_tenon_rail") {
      if (tenonLen === null || tenonLen < 0) return null;
      return applyMortiseTenonRail({ tenonLengthPerEnd: tenonLen });
    }
    if (ruleId === "mortise_tenon_stile") {
      if (tenonLen === null || tenonLen < 0) return null;
      return applyMortiseTenonStile({ tenonLengthPerEnd: tenonLen });
    }
    return null;
  }, [ruleId, grooveDepth, panelThickness, tenonLen, dadoDepth]);

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

    addJointRecord({
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
  }

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
    <section className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 backdrop-blur-md">
      <button
        type="button"
        className="flex w-full items-center justify-between gap-2 text-left"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
      >
        <div>
          <p className="text-xs font-medium tracking-widest text-[var(--gl-muted)] uppercase">Joinery</p>
          <p className="mt-1 text-sm text-[var(--gl-muted)]">Rules, history, and before/after finished sizes.</p>
        </div>
        <span className="text-[var(--gl-muted)]">{open ? "−" : "+"}</span>
      </button>

      {open ? (
        <div className="mt-4 space-y-4 border-t border-white/10 pt-4">
          {project.joints.length > 0 ? (
            <div className="rounded-xl border border-white/10 bg-black/20 p-3">
              <p className="text-xs font-medium text-[var(--gl-cream)]">Applied connections ({project.joints.length})</p>
              <ul className="mt-2 space-y-1">
                {[...project.joints].reverse().map((j) => {
                  const part = project.parts.find((p) => p.id === j.primaryPartId);
                  const mate = j.matePartId ? project.parts.find((p) => p.id === j.matePartId) : undefined;
                  const label = RULE_LABELS[j.ruleId as JointRuleId] ?? j.ruleId;
                  const name = part?.name?.trim() || "Part";
                  const mateName = mate?.name?.trim();
                  const isOpen = expandedJointId === j.id;
                  return (
                    <li key={j.id} className="text-xs text-[var(--gl-muted)]">
                      <button
                        type="button"
                        className="flex w-full items-center justify-between gap-2 rounded-lg px-2 py-1.5 text-left hover:bg-white/5"
                        onClick={() => setExpandedJointId(isOpen ? null : j.id)}
                      >
                        <span className="text-[var(--gl-cream-soft)]">
                          {label} — {name}
                          {mateName ? ` ↔ ${mateName}` : ""}
                        </span>
                        <span className="text-[var(--gl-muted)]">{isOpen ? "−" : "+"}</span>
                      </button>
                      {isOpen ? (
                        <div className="ml-2 mt-1 space-y-2 border-l border-white/10 pl-3">
                          <p className="text-[11px] leading-relaxed text-[var(--gl-muted)]">{j.explanation}</p>
                          {j.primaryEdgeLabel || j.mateEdgeLabel ? (
                            <p className="text-[11px] text-[var(--gl-muted)]">
                              {j.primaryEdgeLabel ? (
                                <>
                                  Primary: <span className="text-[var(--gl-cream-soft)]">{j.primaryEdgeLabel}</span>
                                </>
                              ) : null}
                              {j.primaryEdgeLabel && j.mateEdgeLabel ? " · " : null}
                              {j.mateEdgeLabel ? (
                                <>
                                  Mate: <span className="text-[var(--gl-cream-soft)]">{j.mateEdgeLabel}</span>
                                </>
                              ) : null}
                            </p>
                          ) : null}
                          <p className="font-mono text-[11px] text-[var(--gl-cream)]">
                            Before {formatTxWxL(j.finishedBefore.t, j.finishedBefore.w, j.finishedBefore.l)}
                          </p>
                          <p className="font-mono text-[11px] text-[var(--gl-copper-bright)]">
                            After {formatTxWxL(j.finishedAfter.t, j.finishedAfter.w, j.finishedAfter.l)}
                          </p>
                        </div>
                      ) : null}
                    </li>
                  );
                })}
              </ul>
            </div>
          ) : null}

          <label className="block text-xs text-[var(--gl-muted)]">
            Rule
            <select
              className="mt-1 w-full rounded-lg border border-white/15 bg-black/30 px-3 py-2 text-sm text-[var(--gl-cream)]"
              value={ruleId}
              onChange={(e) => setRuleId(e.target.value as JointRuleId)}
            >
              {RULE_OPTIONS.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.label}
                </option>
              ))}
            </select>
          </label>

          {ruleId === "groove_quarter_back" ? (
            <div className="grid grid-cols-2 gap-3">
              <label className="block text-xs text-[var(--gl-muted)]">
                Groove depth
                <input
                  className="mt-1 w-full rounded-lg border border-white/15 bg-black/30 px-3 py-2 text-sm text-[var(--gl-cream)]"
                  value={grooveDepthStr}
                  onChange={(e) => setGrooveDepthStr(e.target.value)}
                  inputMode="decimal"
                  aria-invalid={grooveDepth === null || grooveDepth < 0}
                />
              </label>
              <label className="block text-xs text-[var(--gl-muted)]">
                Panel thickness (label)
                <input
                  className="mt-1 w-full rounded-lg border border-white/15 bg-black/30 px-3 py-2 text-sm text-[var(--gl-cream)]"
                  value={panelThickStr}
                  onChange={(e) => setPanelThickStr(e.target.value)}
                  inputMode="decimal"
                  aria-invalid={panelThickness === null || panelThickness < 0}
                />
              </label>
            </div>
          ) : ruleId === "dado_shelf_width" ? (
            <label className="block text-xs text-[var(--gl-muted)]">
              Dado depth (in)
              <input
                className="mt-1 w-full rounded-lg border border-white/15 bg-black/30 px-3 py-2 text-sm text-[var(--gl-cream)]"
                value={dadoDepthStr}
                onChange={(e) => setDadoDepthStr(e.target.value)}
                inputMode="decimal"
                aria-invalid={dadoDepth === null || dadoDepth < 0}
              />
            </label>
          ) : (
            <label className="block text-xs text-[var(--gl-muted)]">
              Tenon length per end (in)
              <input
                className="mt-1 w-full rounded-lg border border-white/15 bg-black/30 px-3 py-2 text-sm text-[var(--gl-cream)]"
                value={tenonLenStr}
                onChange={(e) => setTenonLenStr(e.target.value)}
                inputMode="decimal"
                aria-invalid={tenonLen === null || tenonLen < 0}
              />
            </label>
          )}

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
              Adds the rule’s deltas to the part’s finished T×W×L. Rough recomputes unless rough is manual.
            </p>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
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
          </div>
        </div>
      ) : null}
    </section>
  );
}
