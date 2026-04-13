"use client";

import { useMemo, useState } from "react";
import { useProject } from "@/components/ProjectContext";
import { applyGrooveForQuarterBackPanel } from "@/lib/joinery/groove-back";
import type { JointRuleId } from "@/lib/joinery/types";
import { formatImperial, parseInches } from "@/lib/imperial";

const RULE_OPTIONS: { id: JointRuleId; label: string }[] = [
  { id: "groove_quarter_back", label: "Groove for ¼ back" },
];

export function JoineryPanel() {
  const { project, updatePart } = useProject();
  const [open, setOpen] = useState(true);
  const [ruleId, setRuleId] = useState<JointRuleId>("groove_quarter_back");
  const [grooveDepthStr, setGrooveDepthStr] = useState("1/4");
  const [panelThickStr, setPanelThickStr] = useState("1/4");
  const [hypoW, setHypoW] = useState("");
  const [hypoL, setHypoL] = useState("");
  const [selectedBackId, setSelectedBackId] = useState<string>("");

  const grooveDepth = parseInches(grooveDepthStr);
  const panelThickness = parseInches(panelThickStr);

  const ruleResult = useMemo(() => {
    if (grooveDepth === null || grooveDepth < 0 || panelThickness === null || panelThickness < 0) {
      return null;
    }
    if (ruleId === "groove_quarter_back") {
      return applyGrooveForQuarterBackPanel({ grooveDepth, panelThickness });
    }
    return null;
  }, [ruleId, grooveDepth, panelThickness]);

  const backParts = useMemo(() => project.parts.filter((p) => p.assembly === "Back"), [project.parts]);

  const hypoParsed = useMemo(() => {
    const w = hypoW.trim() ? parseInches(hypoW) : null;
    const l = hypoL.trim() ? parseInches(hypoL) : null;
    if (w === null || l === null || w <= 0 || l <= 0) return null;
    return { w, l };
  }, [hypoW, hypoL]);

  const recommendedHypo = useMemo(() => {
    if (!ruleResult || !hypoParsed) return null;
    const { finishedDimensionDeltas: d } = ruleResult;
    return {
      t: panelThickness ?? 0,
      w: hypoParsed.w + d.w,
      l: hypoParsed.l + d.l,
    };
  }, [ruleResult, hypoParsed, panelThickness]);

  function applyToSelected() {
    if (!ruleResult || !selectedBackId) return;
    const part = project.parts.find((p) => p.id === selectedBackId);
    if (!part) return;
    const { finishedDimensionDeltas: d } = ruleResult;
    updatePart(selectedBackId, {
      finished: {
        t: part.finished.t + d.t,
        w: part.finished.w + d.w,
        l: part.finished.l + d.l,
      },
    });
  }

  const invalidInputs =
    grooveDepth === null || grooveDepth < 0 || panelThickness === null || panelThickness < 0;

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
          <p className="mt-1 text-sm text-[var(--gl-muted)]">Rules that adjust finished sizes with a short rationale.</p>
        </div>
        <span className="text-[var(--gl-muted)]">{open ? "−" : "+"}</span>
      </button>

      {open ? (
        <div className="mt-4 space-y-4 border-t border-white/10 pt-4">
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

          {invalidInputs ? (
            <p className="text-sm text-amber-200/90">Enter valid non-negative depths (e.g. 0.25 or 1/4).</p>
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

          <div className="rounded-xl border border-white/10 bg-black/20 p-3">
            <p className="text-xs font-medium text-[var(--gl-cream)]">Apply to a back part</p>
            <p className="mt-1 text-xs text-[var(--gl-muted)]">Adds the deltas above to the part’s current finished T×W×L. Rough recomputes unless rough is manual.</p>
            {backParts.length === 0 ? (
              <p className="mt-2 text-sm text-[var(--gl-muted)]">No parts with assembly &quot;Back&quot; yet.</p>
            ) : (
              <>
                <select
                  className="mt-2 w-full rounded-lg border border-white/15 bg-black/30 px-3 py-2 text-sm text-[var(--gl-cream)]"
                  value={selectedBackId}
                  onChange={(e) => setSelectedBackId(e.target.value)}
                >
                  <option value="">Select back part…</option>
                  {backParts.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name.trim() || "Unnamed"} — W {formatImperial(p.finished.w)} × L {formatImperial(p.finished.l)}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  disabled={!selectedBackId || !ruleResult || invalidInputs}
                  className="mt-2 rounded-lg border border-[var(--gl-copper-bright)]/50 bg-[var(--gl-copper)]/20 px-3 py-2 text-xs font-medium text-[var(--gl-cream)] enabled:hover:bg-[var(--gl-copper)]/30 disabled:cursor-not-allowed disabled:opacity-40"
                  onClick={applyToSelected}
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
