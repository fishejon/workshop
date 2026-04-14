"use client";

import { useMemo, useState } from "react";
import { DimensionalLumberPurchaseTable, ProjectCutRollup } from "@/components/LumberPurchaseSummary";
import { useProject } from "@/components/ProjectContext";
import {
  groupPartsByMaterial,
  totalAdjustedBoardFeet,
  totalAdjustedLinearFeet,
  totalBoardFeet,
  totalLinearFeet,
} from "@/lib/board-feet";
import { formatShopImperial } from "@/lib/imperial";
import { buildLumberVehicleRows } from "@/lib/lumber-vehicle-summary";
import {
  evaluateAllPurchaseScenarios,
  PURCHASE_SCENARIO_META,
  type PurchaseScenarioId,
} from "@/lib/purchase-scenarios";
import { NominalStockWidthSelect } from "@/components/NominalStockWidthSelect";

const SCENARIO_ORDER: PurchaseScenarioId[] = [
  "fitTransport",
  "simpleTrip",
  "minWaste",
  "minBoardCount",
];

export function BuyListPanel() {
  const { project, setMaterialGroupCostRate, setMaterialGroupStockWidth } = useProject();
  const [scenario, setScenario] = useState<PurchaseScenarioId>("fitTransport");

  const groups = useMemo(
    () => groupPartsByMaterial(project.parts, project.wasteFactorPercent),
    [project.parts, project.wasteFactorPercent]
  );

  const allPlans = useMemo(
    () =>
      evaluateAllPurchaseScenarios({
        parts: project.parts,
        wasteFactorPercent: project.wasteFactorPercent,
        maxTransportLengthInches: project.maxTransportLengthInches,
        maxPurchasableBoardWidthInches: project.maxPurchasableBoardWidthInches,
        stockWidthByMaterialGroup: project.stockWidthByMaterialGroup,
        costRatesByGroup: project.costRatesByGroup,
      }),
    [
      project.parts,
      project.wasteFactorPercent,
      project.maxTransportLengthInches,
      project.maxPurchasableBoardWidthInches,
      project.stockWidthByMaterialGroup,
      project.costRatesByGroup,
    ]
  );

  const plan = useMemo(
    () => allPlans.find((row) => row.scenario === scenario) ?? allPlans[0]!,
    [allPlans, scenario]
  );

  const planByScenario = useMemo(
    () => new Map(allPlans.map((row) => [row.scenario, row])),
    [allPlans]
  );

  const groupCostMap = useMemo(
    () => new Map((plan?.groupCosts ?? []).map((row) => [row.key, row])),
    [plan]
  );

  const vehicleRows = useMemo(
    () => buildLumberVehicleRows(groups, project.parts, project.maxTransportLengthInches),
    [groups, project.parts, project.maxTransportLengthInches]
  );

  const twoDGroupByKey = useMemo(
    () => new Map(plan.twoDimensional.groups.map((row) => [row.key, row])),
    [plan.twoDimensional.groups]
  );

  const subtotal = totalBoardFeet(groups);
  const adjusted = totalAdjustedBoardFeet(groups);
  const subtotalLf = totalLinearFeet(groups);
  const adjustedLf = totalAdjustedLinearFeet(groups);

  function formatMoney(n: number): string {
    return `$${n.toFixed(2)}`;
  }

  function parseOptionalRate(raw: string): number | undefined {
    const value = raw.trim();
    if (!value) return undefined;
    const parsed = Number.parseFloat(value);
    if (!Number.isFinite(parsed) || parsed < 0) return undefined;
    return parsed;
  }

  return (
    <section className="gl-panel p-5">
      <p className="text-xs font-medium tracking-widest text-[var(--gl-muted)] uppercase">Lumber & buy list</p>
      <p className="mt-1 text-sm text-[var(--gl-muted)]">
        Lineal feet and 1/16″ cuts first. Vehicle length comes from <strong className="text-[var(--gl-cream)]">max transport</strong> on
        the Project tab ({formatShopImperial(project.maxTransportLengthInches)}). Board-foot totals stay under{" "}
        <strong className="text-[var(--gl-cream-soft)]">Advanced yard estimate</strong> if you need them.
      </p>
      <p className="mt-1 text-xs text-[var(--gl-muted)]">
        Default max board face width is{" "}
        <strong className="text-[var(--gl-cream)]">{formatShopImperial(project.maxPurchasableBoardWidthInches)}</strong>;
        waste factor is <strong className="text-[var(--gl-cream)]">{project.wasteFactorPercent}%</strong>.
      </p>

      {groups.length === 0 ? (
        <p className="mt-4 text-sm text-[var(--gl-muted)]">Add parts to see dimensional lumber and cuts.</p>
      ) : (
        <div className="mt-4 space-y-6">
          <DimensionalLumberPurchaseTable rows={vehicleRows} vehicleMaxInches={project.maxTransportLengthInches} />
          <ProjectCutRollup parts={project.parts} />

          <details className="rounded-xl border border-[var(--gl-border)] bg-[var(--gl-surface-muted)] p-4">
            <summary className="cursor-pointer text-sm font-medium text-[var(--gl-cream-soft)]">
              Advanced yard estimate &amp; 2D solver
            </summary>
            <div className="mt-4 space-y-4">
          <div className="rounded-xl border border-[var(--gl-border)] bg-[var(--gl-surface-muted)] p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-xs font-medium tracking-widest text-[var(--gl-muted)] uppercase">Purchase plan</p>
              <label className="flex flex-wrap items-center gap-2 text-xs text-[var(--gl-muted)]">
                <span className="sr-only">Buy scenario</span>
                <select
                  className="input-wood min-w-[12rem] text-sm text-[var(--gl-cream)]"
                  value={scenario}
                  onChange={(e) => setScenario(e.target.value as PurchaseScenarioId)}
                  aria-label="Buy scenario"
                >
                  {SCENARIO_ORDER.map((id) => (
                    <option key={id} value={id}>
                      {PURCHASE_SCENARIO_META[id].title}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <p className="mt-2 text-sm text-[var(--gl-cream)]">{plan.headline}</p>
            <p className="mt-1 text-xs text-[var(--gl-muted)]">{plan.detail}</p>
            <p className="mt-2 text-xs text-[var(--gl-muted)]">
              Estimated total cost: <strong className="text-[var(--gl-cream)]">{formatMoney(plan.totalEstimatedCost)}</strong>{" "}
              (optional model from adjusted BF/LF rates below).
            </p>
            <div className="mt-4 rounded-lg border border-[var(--gl-border)] bg-[var(--gl-surface-inset)] p-3">
              <p className="text-xs font-medium tracking-widest text-[var(--gl-muted)] uppercase">
                2D board estimate (width + length)
              </p>
              <p className="mt-1 text-sm text-[var(--gl-cream-soft)]">{plan.twoDimensional.headline}</p>
              {plan.twoDimensional.detail ? (
                <p className="mt-1 text-xs text-[var(--gl-muted)]">{plan.twoDimensional.detail}</p>
              ) : null}
              <ul className="mt-2 list-inside list-disc text-xs text-[var(--gl-muted)]">
                {plan.twoDimensional.assumptions.map((line) => (
                  <li key={line}>{line}</li>
                ))}
              </ul>
            </div>
            <div className="mt-2 flex flex-wrap gap-2">
              {SCENARIO_ORDER.map((id) => {
                const scenarioPlan = planByScenario.get(id);
                if (!scenarioPlan) return null;
                const selected = id === scenario;
                return (
                  <button
                    key={id}
                    type="button"
                    className={`rounded-md border px-2 py-1 text-xs ${
                      selected
                        ? "border-[var(--gl-copper-bright)]/60 bg-[var(--gl-copper)]/20 text-[var(--gl-cream)]"
                        : "border-[var(--gl-border)] bg-[var(--gl-surface-muted)] text-[var(--gl-muted)] hover:text-[var(--gl-cream-soft)]"
                    }`}
                    onClick={() => setScenario(id)}
                  >
                    {PURCHASE_SCENARIO_META[id].title}: {formatMoney(scenarioPlan.totalEstimatedCost)}
                  </button>
                );
              })}
            </div>
          </div>
          <div className="flex flex-wrap gap-4 text-xs text-[var(--gl-muted)]">
            <span>
              Project subtotal BF: <strong className="text-[var(--gl-cream)]">{subtotal.toFixed(2)}</strong>
            </span>
            <span>
              With waste: <strong className="text-[var(--gl-cream)]">{adjusted.toFixed(2)}</strong>
            </span>
            <span>
              Lineal (decimal LF): <strong className="text-[var(--gl-cream)]">{subtotalLf.toFixed(2)}</strong>
              {" → "}
              <strong className="text-[var(--gl-cream)]">{adjustedLf.toFixed(2)}</strong> with waste
            </span>
          </div>
          <ul className="space-y-3">
            {groups.map((g) => {
              const twoDGroup = twoDGroupByKey.get(g.key);
              const stockWidthAssumed = twoDGroup?.stockWidthAssumedInches ?? project.maxPurchasableBoardWidthInches;
              const hasCustomStockWidth = typeof project.stockWidthByMaterialGroup?.[g.key] === "number";
              return (
                <li
                  key={g.key}
                  className="rounded-xl border border-[var(--gl-border)] bg-[var(--gl-surface-muted)] p-3 text-sm text-[var(--gl-cream)] sm:p-4"
                >
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <span className="font-medium">{g.materialLabel}</span>
                  <span className="text-xs text-[var(--gl-muted)]">{g.thicknessCategory}</span>
                </div>
                <div className="mt-2 rounded-lg border border-[var(--gl-border)] bg-[var(--gl-surface-inset)] p-3 text-xs text-[var(--gl-muted)]">
                  <p className="text-xs font-medium tracking-widest text-[var(--gl-muted)] uppercase">
                    2D estimate (decision)
                  </p>
                  <p className="mt-1 text-sm text-[var(--gl-cream-soft)]">
                    ~{twoDGroup?.estimatedBoards2d ?? 0} board(s) using width + length packing
                  </p>
                  <p className="mt-1">{twoDGroup?.detail}</p>
                </div>
                <div className="mt-2 rounded-lg border border-[var(--gl-border)] bg-[var(--gl-surface-muted)] p-3 text-xs text-[var(--gl-muted)]">
                  <p className="text-xs font-medium tracking-widest text-[var(--gl-muted)] uppercase">Assumptions</p>
                  <p className="mt-1">
                    Stock width assumed: {formatShopImperial(stockWidthAssumed)}{" "}
                    {hasCustomStockWidth ? "(group override)" : "(project default)"}
                  </p>
                  {(twoDGroup?.flags ?? []).map((f) => (
                    <p key={f} className="mt-1 text-[var(--gl-warning)]">
                      {f}
                    </p>
                  ))}
                  <div className="mt-2">
                    <p className="text-[var(--gl-cream-soft)]">Override 2D stock width (optional)</p>
                    <p className="mt-0.5 text-[var(--gl-muted)]">
                      Same nominal vocabulary as Project setup. Leave aligned with the project default unless this
                      material group is bought on different stock.
                    </p>
                    <div className="mt-2">
                      <NominalStockWidthSelect
                        valueInches={stockWidthAssumed}
                        onChangeInches={(n) => {
                          const def = project.maxPurchasableBoardWidthInches;
                          if (Math.abs(n - def) < 0.02) setMaterialGroupStockWidth(g.key, null);
                          else setMaterialGroupStockWidth(g.key, n);
                        }}
                        selectId={`buy-2d-stock-${g.key}`}
                        customInputId={`buy-2d-stock-custom-${g.key}`}
                      />
                    </div>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    <button
                      type="button"
                      className="rounded-md border border-[var(--gl-border)] bg-[var(--gl-surface-inset)] px-2 py-1.5 text-xs text-[var(--gl-cream-soft)] hover:text-[var(--gl-cream)]"
                      onClick={() => setMaterialGroupStockWidth(g.key, null)}
                    >
                      Use project default
                    </button>
                  </div>
                </div>
                <details className="mt-2 rounded-lg border border-[var(--gl-border)] bg-[var(--gl-surface-muted)] p-3 text-xs text-[var(--gl-muted)]">
                  <summary className="cursor-pointer font-medium text-[var(--gl-cream-soft)]">
                    Advanced diagnostics and costing
                  </summary>
                  <p className="mt-2">
                    Exact subtotal: {g.subtotalBoardFeet.toFixed(2)} BF and {g.subtotalLinearFeet.toFixed(2)} LF from rough sizes/qty.
                  </p>
                  <p className="mt-0.5">
                    Yard estimate with waste: <strong>{g.adjustedBoardFeet.toFixed(2)}</strong> BF and{" "}
                    <strong>{g.adjustedLinearFeet.toFixed(2)}</strong> LF.
                  </p>
                  <p className="mt-0.5">
                    Solver stock length cap: {formatShopImperial(project.maxTransportLengthInches)}.
                  </p>
                  <div className="mt-2 grid gap-2 sm:grid-cols-3">
                    <label className="text-xs text-[var(--gl-muted)]">
                      Cost / BF
                      <input
                        type="number"
                        step="0.01"
                        min={0}
                        inputMode="decimal"
                        className="input-wood mt-1 text-xs"
                        value={project.costRatesByGroup[g.key]?.perBoardFoot ?? ""}
                        placeholder="0.00"
                        onChange={(e) =>
                          setMaterialGroupCostRate(g.key, {
                            perBoardFoot: parseOptionalRate(e.target.value),
                            perLinearFoot: project.costRatesByGroup[g.key]?.perLinearFoot,
                          })
                        }
                      />
                    </label>
                    <label className="text-xs text-[var(--gl-muted)]">
                      Cost / LF
                      <input
                        type="number"
                        step="0.01"
                        min={0}
                        inputMode="decimal"
                        className="input-wood mt-1 text-xs"
                        value={project.costRatesByGroup[g.key]?.perLinearFoot ?? ""}
                        placeholder="0.00"
                        onChange={(e) =>
                          setMaterialGroupCostRate(g.key, {
                            perBoardFoot: project.costRatesByGroup[g.key]?.perBoardFoot,
                            perLinearFoot: parseOptionalRate(e.target.value),
                          })
                        }
                      />
                    </label>
                    <div className="rounded-lg border border-[var(--gl-border)] bg-[var(--gl-surface-muted)] px-2 py-1 text-xs text-[var(--gl-muted)]">
                      Estimated group cost:{" "}
                      <strong className="text-[var(--gl-cream)]">
                        {formatMoney(groupCostMap.get(g.key)?.totalCost ?? 0)}
                      </strong>
                    </div>
                  </div>
                  <ul className="mt-2 space-y-0.5 text-xs text-[var(--gl-muted)]">
                    {g.lines.map((ln) => (
                      <li key={ln.partId}>
                        {ln.partName} ×{ln.quantity} — {ln.boardFeetTotal.toFixed(2)} BF, {ln.linearFeetTotal.toFixed(2)} LF
                      </li>
                    ))}
                  </ul>
                </details>
                </li>
              );
            })}
          </ul>
            </div>
          </details>
        </div>
      )}
    </section>
  );
}
