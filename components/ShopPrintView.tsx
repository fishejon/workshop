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
import { shopGuideRows } from "@/lib/shop-labels";
import {
  STORAGE_KEY,
  createEmptyProject,
  parseProject,
} from "@/lib/project-utils";
import { cutListExportCheckpointsReady, jointsEffectiveForCutList } from "@/lib/cut-list-scope";
import { partsForHardwoodYardCutList } from "@/lib/cut-list-yard-parts";
import { isMainPathJoineryEnabled } from "@/lib/main-path-joinery-flag";
import { derivePartAssumptionsDetailed } from "@/lib/part-assumptions";
import { evaluateAllPurchaseScenarios } from "@/lib/purchase-scenarios";
import {
  canExportOrPrintProject,
  getBlockingValidationIssues,
  validateProject,
} from "@/lib/validation";
import { validationIssueWhereHint } from "@/lib/validation/issue-action-hint";
import { hardwareService } from "@/lib/services/HardwareService";

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

  const yardParts = useMemo(() => (project ? partsForHardwoodYardCutList(project) : []), [project]);

  const groups = useMemo(
    () => (project ? groupPartsByMaterial(yardParts, project.wasteFactorPercent) : []),
    [project, yardParts]
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

  const shopGuideTableRows = useMemo(() => (project ? shopGuideRows(project.parts) : []), [project]);

  const hardwareSchedule = useMemo(() => (project ? hardwareService.generateSchedule(project) : []), [project]);

  const purchasePreview = useMemo(() => {
    if (!project) return null;
    return (
      evaluateAllPurchaseScenarios({
      parts: yardParts,
      wasteFactorPercent: project.wasteFactorPercent,
      maxTransportLengthInches: project.maxTransportLengthInches,
      maxPurchasableBoardWidthInches: project.maxPurchasableBoardWidthInches,
      stockWidthByMaterialGroup: project.stockWidthByMaterialGroup,
      costRatesByGroup: project.costRatesByGroup,
      kerfInches: 0.125,
      }).find((plan) => plan.scenario === "fitTransport") ?? null
    );
  }, [project, yardParts]);

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
              Print locked
            </h1>
            <p className="mt-2 text-sm text-[var(--gl-ink)]/80">
              Open the <strong>Materials</strong> tab, acknowledge <strong>Material assumptions</strong> at the top,
              and resolve any blocking validation issues before printing or exporting.
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
                    <li key={issue.id}>
                      <span className="block">{issue.message}</span>
                      <span className="mt-0.5 block text-sm text-[var(--gl-ink)]/70">
                        {validationIssueWhereHint(issue)}
                      </span>
                    </li>
                  ))}
                </ul>
              </>
            ) : null}
            <p className="mt-4 text-sm">
              <Link href="/" className="underline underline-offset-2">
                Back to planner
              </Link>{" "}
              — then switch to <strong>Materials</strong> to fix blockers and check material assumptions.
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
            Assumptions column reflects the same cut-list scope as the app (panel glue-up checks
            {isMainPathJoineryEnabled()
              ? "; joinery audit rows are included because NEXT_PUBLIC_GL_MAIN_PATH_JOINERY is enabled."
              : "; joinery history from Labs is omitted unless NEXT_PUBLIC_GL_MAIN_PATH_JOINERY is set)."}
            Max single-board panel width: {formatShopImperial(project.maxPurchasableBoardWidthInches)}.
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

        {hardwareSchedule.length > 0 ? (
          <section className="shop-print-section mt-8">
            <h2 className="shop-print-muted mb-3 text-xs font-semibold tracking-widest uppercase">
              Hardware schedule
            </h2>
            <p className="mb-2 text-xs shop-print-muted">
              Recommendations are generated from project parts. Always confirm model-specific clearances and load ratings
              with the manufacturer.
            </p>
            <table className="shop-print-table w-full border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-[var(--gl-ink)]/30">
                  <th className="py-2 pr-3 font-semibold">Type</th>
                  <th className="py-2 pr-3 font-semibold">Qty</th>
                  <th className="py-2 pr-3 font-semibold">Specs</th>
                  <th className="py-2 font-semibold">Notes</th>
                </tr>
              </thead>
              <tbody>
                {hardwareSchedule.map((item) => (
                  <tr key={item.id} className="shop-print-avoid-break border-b border-[var(--gl-border)]">
                    <td className="py-2 pr-3">{item.type}</td>
                    <td className="py-2 pr-3 tabular-nums">{item.quantity}</td>
                    <td className="py-2 pr-3 text-xs shop-print-muted">
                      {[item.specs.slideType, item.specs.extension, item.specs.length ? `${item.specs.length}"` : "", item.specs.weightCapacity ? `${item.specs.weightCapacity} lb` : "", item.specs.finish]
                        .filter(Boolean)
                        .join(", ")}
                    </td>
                    <td className="py-2 text-xs shop-print-muted">{item.notes ?? "Confirm manufacturer data sheet."}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        ) : null}

        <section className="shop-print-section mt-8">
          <h2 className="shop-print-muted mb-3 text-xs font-semibold tracking-widest uppercase">
            Shop labels &amp; assembly guide
          </h2>
          <p className="mb-3 text-xs shop-print-muted">
            Write each <strong className="text-[var(--gl-ink)]">GL-</strong> code on the matching rough stick. Pack
            order on the cut-layout strips is for stick efficiency and may differ from assembly order—check your case
            drawings.
          </p>
          {shopGuideTableRows.length === 0 ? (
            <p className="text-sm shop-print-muted">No rough instances to label (add parts with rough L and qty).</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="shop-print-table w-full border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b border-[var(--gl-ink)]/30">
                    <th className="py-2 pr-3 font-semibold">Label</th>
                    <th className="py-2 pr-3 font-semibold">Assembly</th>
                    <th className="py-2 pr-3 font-semibold">Part</th>
                    <th className="py-2 pr-3 font-semibold">Rough L</th>
                    <th className="py-2 pr-3 font-semibold">Finished T×W×L</th>
                    <th className="py-2 font-semibold">Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {shopGuideTableRows.map((row) => (
                    <tr key={row.roughInstanceId} className="shop-print-avoid-break border-b border-[var(--gl-border)]">
                      <td className="py-2 pr-3 align-top font-mono text-xs font-semibold tabular-nums">
                        {row.shopLabel}
                      </td>
                      <td className="py-2 pr-3 align-top">{row.assembly}</td>
                      <td className="py-2 pr-3 align-top">{row.partName}</td>
                      <td className="py-2 pr-3 align-top font-mono text-xs tabular-nums">
                        {formatShopImperial(row.roughLInches)}
                      </td>
                      <td className="py-2 pr-3 align-top font-mono text-xs tabular-nums">
                        {formatTxWxL(row.finished)}
                      </td>
                      <td className="py-2 align-top text-xs shop-print-muted">{row.grainNote || "—"}</td>
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
