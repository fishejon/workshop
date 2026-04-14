"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  groupPartsByMaterial,
  totalAdjustedBoardFeet,
  totalAdjustedLinearFeet,
  totalBoardFeet,
  totalLinearFeet,
} from "@/lib/board-feet";
import { formatShopImperial } from "@/lib/imperial";
import type { Dimension3, Project } from "@/lib/project-types";
import {
  STORAGE_KEY,
  createEmptyProject,
  parseProject,
} from "@/lib/project-utils";
import { cutListExportCheckpointsReady, jointsEffectiveForCutList } from "@/lib/cut-list-scope";
import { derivePartAssumptionsDetailed } from "@/lib/part-assumptions";
import { evaluateAllPurchaseScenarios } from "@/lib/purchase-scenarios";
import {
  canExportOrPrintProject,
  getBlockingValidationIssues,
  validateProject,
} from "@/lib/validation";

function formatTxWxL(d: Dimension3): string {
  return `${formatShopImperial(d.t)} × ${formatShopImperial(d.w)} × ${formatShopImperial(d.l)}`;
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
  const subtotalLf = useMemo(() => totalLinearFeet(groups), [groups]);
  const adjustedLf = useMemo(() => totalAdjustedLinearFeet(groups), [groups]);
  const validationIssues = useMemo(() => (project ? validateProject(project) : []), [project]);
  const jointsForCutList = useMemo(() => (project ? jointsEffectiveForCutList(project) : []), [project]);
  const canPrint = Boolean(
    project && canExportOrPrintProject(cutListExportCheckpointsReady(project), validationIssues)
  );
  const blockingIssues = useMemo(() => getBlockingValidationIssues(validationIssues), [validationIssues]);

  const purchasePreview = useMemo(() => {
    if (!project) return null;
    return (
      evaluateAllPurchaseScenarios({
      parts: project.parts,
      wasteFactorPercent: project.wasteFactorPercent,
      maxTransportLengthInches: project.maxTransportLengthInches,
      maxPurchasableBoardWidthInches: project.maxPurchasableBoardWidthInches,
      stockWidthByMaterialGroup: project.stockWidthByMaterialGroup,
      costRatesByGroup: project.costRatesByGroup,
      kerfInches: 0.125,
      }).find((plan) => plan.scenario === "fitTransport") ?? null
    );
  }, [project]);

  if (!project) {
    return (
      <div className="shop-print-page px-6 py-10 shop-print-muted">
        Loading project…
      </div>
    );
  }

  if (!canPrint) {
    return (
      <div className="shop-print-page min-h-full bg-[var(--gl-cream)] text-[var(--gl-ink)]">
        <div className="mx-auto max-w-3xl px-6 py-8">
          <p className="mb-6 text-sm">
            <Link
              href="/"
              className="text-[var(--gl-copper)] underline decoration-[var(--gl-copper)]/40 underline-offset-2 hover:decoration-[var(--gl-copper)]"
            >
              Back to planner
            </Link>
          </p>
          <section
            id="print-lock-section"
            className="rounded-xl border border-[var(--gl-border)] bg-white/80 p-5"
            aria-labelledby="print-lock-title"
          >
            <h1 id="print-lock-title" className="font-display text-2xl text-[var(--gl-ink)]">
              Print locked pending Review
            </h1>
            <p className="mt-2 text-sm text-[var(--gl-ink)]/80">
              Go to Review and resolve blocking checks, or acknowledge material assumptions, before printing/exporting.
            </p>
            <p className="mt-3 text-sm">
              Lock summary: Blocking issues {blockingIssues.length}. Material assumptions{" "}
              {project.checkpoints.materialAssumptionsReviewed ? "acknowledged" : "not acknowledged"}.
            </p>
            <ul className="mt-4 space-y-2 text-sm" aria-label="Print lock checkpoint status">
              <li>
                Material assumptions:{" "}
                <strong>
                  {project.checkpoints.materialAssumptionsReviewed ? "Acknowledged" : "Not acknowledged"}
                </strong>
              </li>
            </ul>
            {blockingIssues.length > 0 ? (
              <>
                <p className="mt-4 text-sm font-medium text-[var(--gl-ink)]">Blocking validation reasons</p>
                <ul
                  className="mt-2 list-disc space-y-1 pl-5 text-sm"
                  aria-label={`Blocking validation reasons: ${blockingIssues.length}`}
                >
                  {blockingIssues.map((issue) => (
                    <li key={issue.id}>{issue.message}</li>
                  ))}
                </ul>
              </>
            ) : null}
            <p className="mt-4 text-sm">
              Jump back to{" "}
              <Link href="/#review-checkpoints-section" className="underline underline-offset-2">
                Review checkpoints
              </Link>{" "}
              or{" "}
              <Link href="/#parts-table-section" className="underline underline-offset-2">
                Parts table
              </Link>
              .
            </p>
          </section>
        </div>
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

        <header className="shop-print-section shop-print-avoid-break border-b border-[var(--gl-border)] pb-4">
          <h1 className="font-display text-2xl tracking-tight text-[var(--gl-ink)]">{project.name}</h1>
          <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
            <div className="flex gap-2">
              <dt className="shop-print-muted">Milling allowance</dt>
              <dd className="font-medium">{formatShopImperial(project.millingAllowanceInches)} per axis</dd>
            </div>
            <div className="flex gap-2">
              <dt className="shop-print-muted">Max transport</dt>
              <dd className="font-medium">{formatShopImperial(project.maxTransportLengthInches)}</dd>
            </div>
            <div className="flex gap-2">
              <dt className="shop-print-muted">Waste factor</dt>
              <dd className="font-medium">{project.wasteFactorPercent}%</dd>
            </div>
            <div className="flex gap-2">
              <dt className="shop-print-muted">Max purchasable board width</dt>
              <dd className="font-medium">{formatShopImperial(project.maxPurchasableBoardWidthInches)}</dd>
            </div>
          </dl>
        </header>

        <section className="shop-print-section mt-8">
          <h2 className="shop-print-muted mb-3 text-xs font-semibold tracking-widest uppercase">
            Finished parts
          </h2>
          <p className="mb-2 text-xs shop-print-muted">
            Assumptions column reflects the same cut-list scope as the app (panel glue-up checks; joinery history only
            when enabled in product). Max single-board panel width:{" "}
            {formatShopImperial(project.maxPurchasableBoardWidthInches)}.
          </p>
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
                    <th className="py-2 pl-3 font-semibold">Assumptions</th>
                  </tr>
                </thead>
                <tbody>
                  {project.parts.map((p) => {
                    const derived = derivePartAssumptionsDetailed(p, jointsForCutList, project);
                    return (
                      <tr key={p.id} className="shop-print-avoid-break border-b border-[var(--gl-border)]">
                        <td className="py-2 pr-3 align-top">{p.name}</td>
                        <td className="py-2 pr-3 align-top">{p.assembly}</td>
                        <td className="py-2 pr-3 align-top tabular-nums">{p.quantity}</td>
                        <td className="py-2 pr-3 align-top font-mono text-xs tabular-nums">{formatTxWxL(p.finished)}</td>
                        <td className="py-2 align-top font-mono text-xs tabular-nums">{formatTxWxL(p.rough)}</td>
                        <td className="py-2 pl-3 align-top text-xs shop-print-muted">
                          {derived.assumptions.joinery}
                          <br />
                          {derived.assumptions.glueUp}
                          <br />
                          {derived.provenanceSummary}
                        </td>
                      </tr>
                    );
                  })}
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
            BF/LF are computed from <strong className="text-[var(--gl-ink)]">rough T×W×L × qty</strong> (144 cu in = 1 BF;
            LF = Σ rough L ÷ 12 per piece), not finished net dimensions. <strong className="text-[var(--gl-ink)]">
              Thickness category
            </strong>{" "}
            is nominal yard language—pricing often still uses nominal thickness after surfacing. Waste ({project.wasteFactorPercent}%)
            applies to those rough subtotals; transport cap {formatShopImperial(project.maxTransportLengthInches)} is for
            planning only. Board-count estimation uses width-lane expansion with max purchasable width{" "}
            {formatShopImperial(project.maxPurchasableBoardWidthInches)} (solids on rough width; panels via glue-up strip
            expansion) plus constrained length packing. Verify surfaced vs rough and actual stock widths/lengths before
            procurement.
          </p>
          {purchasePreview ? (
            <div className="mb-4 rounded-lg border border-[var(--gl-border)] bg-white/70 p-3 text-xs shop-print-muted">
              <p className="font-semibold text-[var(--gl-ink)]">2D board estimate (engineering model)</p>
              <p className="mt-1 text-[var(--gl-ink)]/90">{purchasePreview.twoDimensional.headline}</p>
              <p className="mt-1">{purchasePreview.twoDimensional.detail}</p>
              <ul className="mt-2 list-inside list-disc">
                {purchasePreview.twoDimensional.assumptions.map((a) => (
                  <li key={a}>{a}</li>
                ))}
              </ul>
            </div>
          ) : null}
          {groups.length === 0 ? (
            <p className="text-sm shop-print-muted">Add parts with materials to see board-foot groups.</p>
          ) : (
            <>
              <p className="mb-4 text-sm">
                <span className="mr-4">
                  Subtotal BF: <strong className="tabular-nums">{subtotalBf.toFixed(2)}</strong>
                </span>
                <span className="mr-4">
                  With {project.wasteFactorPercent}% waste:{" "}
                  <strong className="tabular-nums">{adjustedBf.toFixed(2)}</strong> BF
                </span>
                <span className="mr-4">
                  Subtotal LF: <strong className="tabular-nums">{subtotalLf.toFixed(2)}</strong>
                </span>
                <span>
                  With waste: <strong className="tabular-nums">{adjustedLf.toFixed(2)}</strong> LF
                </span>
              </p>
              <ul className="space-y-4">
                {groups.map((g) => {
                  const twoDGroup = purchasePreview?.twoDimensional.groups.find((row) => row.key === g.key);
                  const costGroup = purchasePreview?.groupCosts.find((row) => row.key === g.key);
                  return (
                    <li
                      key={g.key}
                      className="shop-print-avoid-break rounded-lg border border-[var(--gl-border)] bg-white/60 p-4 text-sm"
                    >
                    <div className="flex flex-wrap items-baseline justify-between gap-2">
                      <span className="font-semibold text-[var(--gl-ink)]">{g.materialLabel}</span>
                      <span className="text-xs shop-print-muted">{g.thicknessCategory}</span>
                    </div>
                    <div className="mt-2 rounded border border-[var(--gl-border)] bg-white/70 p-2 text-xs shop-print-muted">
                      <p className="font-semibold text-[var(--gl-ink)]">2D estimate first</p>
                      <p className="mt-0.5 text-[var(--gl-ink)]/90">
                        ~{twoDGroup?.estimatedBoards2d ?? 0} board(s) by width + length packing
                      </p>
                      <p className="mt-0.5">{twoDGroup?.detail}</p>
                    </div>
                    <div className="mt-2 rounded border border-[var(--gl-border)] bg-white/70 p-2 text-xs shop-print-muted">
                      <p className="font-semibold text-[var(--gl-ink)]">Assumptions</p>
                      <p className="mt-0.5">
                        Stock width assumed:{" "}
                        {formatShopImperial(
                          twoDGroup?.stockWidthAssumedInches ?? project.maxPurchasableBoardWidthInches
                        )}
                      </p>
                      {purchasePreview?.twoDimensional.assumptions.slice(0, 2).map((assumption) => (
                        <p key={assumption} className="mt-0.5">
                          {assumption}
                        </p>
                      ))}
                      {(twoDGroup?.flags ?? []).map((flag) => (
                        <p key={flag} className="mt-0.5 text-[var(--gl-ink)]/90">
                          {flag}
                        </p>
                      ))}
                    </div>
                    <div className="mt-2 rounded border border-[var(--gl-border)] bg-white/70 p-2 text-xs shop-print-muted">
                      <p className="font-semibold text-[var(--gl-ink)]">BF / LF / cost diagnostics</p>
                      <p className="mt-0.5">
                        Exact subtotal: {g.subtotalBoardFeet.toFixed(2)} BF and {g.subtotalLinearFeet.toFixed(2)} LF from rough
                        sizes/qty.
                      </p>
                      <p className="mt-0.5">
                        Yard estimate with waste: <strong className="text-[var(--gl-ink)]">{g.adjustedBoardFeet.toFixed(2)}</strong>{" "}
                        BF and <strong className="text-[var(--gl-ink)]">{g.adjustedLinearFeet.toFixed(2)}</strong> LF.
                      </p>
                      <p className="mt-0.5">
                        Estimated group cost:{" "}
                        <strong className="text-[var(--gl-ink)]">${(costGroup?.totalCost ?? 0).toFixed(2)}</strong>
                      </p>
                    </div>
                    <ul className="mt-2 space-y-0.5 text-xs shop-print-muted">
                      {g.lines.map((ln) => (
                        <li key={ln.partId}>
                          {ln.partName} ×{ln.quantity} — {ln.boardFeetTotal.toFixed(2)} BF, {ln.linearFeetTotal.toFixed(2)}{" "}
                          LF
                        </li>
                      ))}
                    </ul>
                    </li>
                  );
                })}
              </ul>
            </>
          )}
        </section>

        <p className="no-print mt-10 text-center text-xs shop-print-muted">
          Bring this print to the lumber yard: material label + thickness category + adjusted BF/LF, then finalize board
          counts from available stock lengths.
          <br />
          Use your browser&apos;s print dialog for a paper copy. For a <strong>PDF</strong>, choose{" "}
          <strong>Print → Save as PDF</strong> (or &quot;Microsoft Print to PDF&quot;) as the destination—no server-side
          PDF engine required.
        </p>
      </div>
    </div>
  );
}
