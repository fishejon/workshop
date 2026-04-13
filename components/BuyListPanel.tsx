"use client";

import { useMemo } from "react";
import { useProject } from "@/components/ProjectContext";
import {
  groupPartsByMaterial,
  totalAdjustedBoardFeet,
  totalAdjustedLinearFeet,
  totalBoardFeet,
  totalLinearFeet,
} from "@/lib/board-feet";
import { formatImperial } from "@/lib/imperial";

export function BuyListPanel() {
  const { project } = useProject();

  const groups = useMemo(
    () => groupPartsByMaterial(project.parts, project.wasteFactorPercent),
    [project.parts, project.wasteFactorPercent]
  );

  const subtotal = totalBoardFeet(groups);
  const adjusted = totalAdjustedBoardFeet(groups);
  const subtotalLf = totalLinearFeet(groups);
  const adjustedLf = totalAdjustedLinearFeet(groups);

  return (
    <section className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 backdrop-blur-md">
      <p className="text-xs font-medium tracking-widest text-[var(--gl-muted)] uppercase">Buy list</p>
      <p className="mt-1 text-sm text-[var(--gl-muted)]">
        Exact inputs: <strong className="text-[var(--gl-cream)]">rough T×W×L and quantity</strong> drive BF/LF math
        (144 cu in = 1 BF, 12&quot; = 1 LF). Planning assumptions: waste ({project.wasteFactorPercent}%), thickness
        category / nominal yard language, and stick cap{" "}
        <strong className="text-[var(--gl-cream)]">{formatImperial(project.maxTransportLengthInches)}</strong> for
        transport. Confirm nominal thickness and available lengths with your lumber yard before purchase.
      </p>

      {groups.length === 0 ? (
        <p className="mt-4 text-sm text-[var(--gl-muted)]">Add parts to see grouped board footage.</p>
      ) : (
        <div className="mt-4 space-y-4">
          <div className="flex flex-wrap gap-4 text-sm text-[var(--gl-cream)]">
            <span>
              Subtotal BF: <strong>{subtotal.toFixed(2)}</strong>
            </span>
            <span>
              With waste: <strong>{adjusted.toFixed(2)}</strong>
            </span>
            <span className="text-[var(--gl-muted)]">
              LF (rough L): <strong className="text-[var(--gl-cream)]">{subtotalLf.toFixed(2)}</strong>
              {" → "}
              <strong>{adjustedLf.toFixed(2)}</strong> with waste
            </span>
          </div>
          <ul className="space-y-3">
            {groups.map((g) => (
              <li
                key={g.key}
                className="rounded-xl border border-white/10 bg-black/20 p-4 text-sm text-[var(--gl-cream)]"
              >
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <span className="font-medium">{g.materialLabel}</span>
                  <span className="text-xs text-[var(--gl-muted)]">{g.thicknessCategory}</span>
                </div>
                <p className="mt-1 text-xs text-[var(--gl-muted)]">
                  Exact subtotal: {g.subtotalBoardFeet.toFixed(2)} BF and {g.subtotalLinearFeet.toFixed(2)} LF from rough
                  sizes/qty. Yard estimate with waste: <strong>{g.adjustedBoardFeet.toFixed(2)}</strong> BF and{" "}
                  <strong>{g.adjustedLinearFeet.toFixed(2)}</strong> LF. Plan on sticks ≤{" "}
                  {formatImperial(project.maxTransportLengthInches)}; verify actual stock lengths, kerf, and cut plan at
                  the bench.
                </p>
                <ul className="mt-2 space-y-0.5 text-xs text-[var(--gl-muted)]">
                  {g.lines.map((ln) => (
                    <li key={ln.partId}>
                      {ln.partName} ×{ln.quantity} — {ln.boardFeetTotal.toFixed(2)} BF, {ln.linearFeetTotal.toFixed(2)} LF
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
