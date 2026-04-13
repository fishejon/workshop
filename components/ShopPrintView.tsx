"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  groupPartsByMaterial,
  totalAdjustedBoardFeet,
  totalBoardFeet,
} from "@/lib/board-feet";
import { formatImperial } from "@/lib/imperial";
import type { Dimension3, Project } from "@/lib/project-types";
import {
  STORAGE_KEY,
  createEmptyProject,
  parseProject,
} from "@/lib/project-utils";

function formatTxWxL(d: Dimension3): string {
  return `${formatImperial(d.t)} × ${formatImperial(d.w)} × ${formatImperial(d.l)}`;
}

export function ShopPrintView() {
  const [project, setProject] = useState<Project | null>(null);

  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect -- hydrate print view from localStorage after mount */
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      setProject(createEmptyProject());
      return;
    }
    const parsed = parseProject(raw);
    setProject(parsed ?? createEmptyProject());
    /* eslint-enable react-hooks/set-state-in-effect */
  }, []);

  const groups = useMemo(
    () => (project ? groupPartsByMaterial(project.parts, project.wasteFactorPercent) : []),
    [project]
  );

  const subtotalBf = useMemo(() => totalBoardFeet(groups), [groups]);
  const adjustedBf = useMemo(() => totalAdjustedBoardFeet(groups), [groups]);

  if (!project) {
    return (
      <div className="shop-print-page px-6 py-10 shop-print-muted">
        Loading project…
      </div>
    );
  }

  return (
    <div className="shop-print-page min-h-full bg-[var(--gl-cream)] text-[var(--gl-ink)]">
      <div className="mx-auto max-w-4xl px-6 py-8">
        <p className="no-print mb-6 text-sm">
          <Link
            href="/"
            className="text-[var(--gl-copper)] underline decoration-[var(--gl-copper)]/40 underline-offset-2 hover:decoration-[var(--gl-copper)]"
          >
            ← Back to planner
          </Link>
        </p>

        <header className="shop-print-section shop-print-avoid-break border-b border-[var(--gl-ink)]/20 pb-4">
          <h1 className="font-display text-2xl tracking-tight text-[var(--gl-ink)]">{project.name}</h1>
          <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
            <div className="flex gap-2">
              <dt className="shop-print-muted">Milling allowance</dt>
              <dd className="font-medium">{formatImperial(project.millingAllowanceInches)} per axis</dd>
            </div>
            <div className="flex gap-2">
              <dt className="shop-print-muted">Max transport</dt>
              <dd className="font-medium">{formatImperial(project.maxTransportLengthInches)}</dd>
            </div>
            <div className="flex gap-2">
              <dt className="shop-print-muted">Waste factor</dt>
              <dd className="font-medium">{project.wasteFactorPercent}%</dd>
            </div>
          </dl>
        </header>

        <section className="shop-print-section mt-8">
          <h2 className="shop-print-muted mb-3 text-xs font-semibold tracking-widest uppercase">
            Finished parts
          </h2>
          {project.parts.length === 0 ? (
            <p className="text-sm shop-print-muted">No parts in this project.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="shop-print-table w-full border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b border-[var(--gl-ink)]/30">
                    <th className="py-2 pr-3 font-semibold">Name</th>
                    <th className="py-2 pr-3 font-semibold">Asm</th>
                    <th className="py-2 pr-3 font-semibold">Qty</th>
                    <th className="py-2 font-semibold">Finished T×W×L</th>
                    <th className="py-2 font-semibold">Rough T×W×L</th>
                  </tr>
                </thead>
                <tbody>
                  {project.parts.map((p) => (
                    <tr key={p.id} className="shop-print-avoid-break border-b border-[var(--gl-ink)]/15">
                      <td className="py-2 pr-3 align-top">{p.name}</td>
                      <td className="py-2 pr-3 align-top">{p.assembly}</td>
                      <td className="py-2 pr-3 align-top tabular-nums">{p.quantity}</td>
                      <td className="py-2 pr-3 align-top font-mono text-xs tabular-nums">{formatTxWxL(p.finished)}</td>
                      <td className="py-2 align-top font-mono text-xs tabular-nums">{formatTxWxL(p.rough)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="shop-print-section mt-10">
          <h2 className="shop-print-muted mb-3 text-xs font-semibold tracking-widest uppercase">
            Buy list summary
          </h2>
          <p className="mb-4 text-xs shop-print-muted">
            Board feet from rough T×W×L (144 cu in = 1 BF). Sticks ≤ {formatImperial(project.maxTransportLengthInches)}{" "}
            for planning—verify cuts and kerf at the bench.
          </p>
          {groups.length === 0 ? (
            <p className="text-sm shop-print-muted">Add parts with materials to see board-foot groups.</p>
          ) : (
            <>
              <p className="mb-4 text-sm">
                <span className="mr-4">
                  Subtotal BF: <strong className="tabular-nums">{subtotalBf.toFixed(2)}</strong>
                </span>
                <span>
                  With {project.wasteFactorPercent}% waste:{" "}
                  <strong className="tabular-nums">{adjustedBf.toFixed(2)}</strong>
                </span>
              </p>
              <ul className="space-y-4">
                {groups.map((g) => (
                  <li
                    key={g.key}
                    className="shop-print-avoid-break rounded-lg border border-[var(--gl-ink)]/20 bg-white/60 p-4 text-sm"
                  >
                    <div className="flex flex-wrap items-baseline justify-between gap-2">
                      <span className="font-semibold text-[var(--gl-ink)]">{g.materialLabel}</span>
                      <span className="text-xs shop-print-muted">{g.thicknessCategory}</span>
                    </div>
                    <p className="mt-1 text-xs shop-print-muted">
                      {g.subtotalBoardFeet.toFixed(2)} BF →                       <strong className="text-[var(--gl-ink)]">{g.adjustedBoardFeet.toFixed(2)}</strong>{" "}
                      BF with waste.
                    </p>
                    <ul className="mt-2 space-y-0.5 text-xs shop-print-muted">
                      {g.lines.map((ln) => (
                        <li key={ln.partId}>
                          {ln.partName} ×{ln.quantity} — {ln.boardFeetTotal.toFixed(2)} BF
                        </li>
                      ))}
                    </ul>
                  </li>
                ))}
              </ul>
            </>
          )}
        </section>

        <p className="no-print mt-10 text-center text-xs shop-print-muted">
          Use your browser&apos;s print dialog for a paper copy.
        </p>
      </div>
    </div>
  );
}
