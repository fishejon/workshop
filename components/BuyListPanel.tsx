"use client";

import { useEffect, useMemo, useState } from "react";
import { useProject } from "@/components/ProjectContext";
import { formatShopImperial } from "@/lib/imperial";
import { DresserMaterialsSummary } from "@/components/DresserMaterialsSummary";
import { useDresserMaterialsSnapshot } from "@/components/DresserMaterialsSnapshotContext";
import { PURCHASE_SCENARIO_META } from "@/lib/purchase-scenarios";
import { buyListService } from "@/lib/services/BuyListService";
import { purchaseStrategyService } from "@/lib/services/PurchaseStrategyService";
import type { PricingData } from "@/lib/types/purchase-strategy";
import { StockTypeSelector } from "@/components/purchase/StockTypeSelector";
import { ScenarioComparison } from "@/components/purchase/ScenarioComparison";
import { CostInputModal } from "@/components/purchase/CostInputModal";
import { stockConversionService } from "@/lib/services/StockConversionService";

const PURCHASE_PRICING_KEY = "grainline-purchase-pricing-v1";

export function BuyListPanel({ showDresserSummary = false }: { showDresserSummary?: boolean }) {
  const { project } = useProject();
  const dresserSnapshot = useDresserMaterialsSnapshot();
  const [stockType, setStockType] = useState<"surfaced" | "rough">(
    project.workshop.lumberProfile === "rough_hardwood" ? "rough" : "surfaced"
  );
  const [showPricingModal, setShowPricingModal] = useState(false);
  const [pricingBySpecies, setPricingBySpecies] = useState<Map<string, PricingData>>(() => new Map());
  const [selectedScenarioId, setSelectedScenarioId] = useState<string | undefined>();

  useEffect(() => {
    const raw = window.localStorage.getItem(PURCHASE_PRICING_KEY);
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw) as PricingData[];
      /* eslint-disable-next-line react-hooks/set-state-in-effect -- restore pricing map after mount; empty Map matches SSR */
      setPricingBySpecies(new Map(parsed.map((row) => [row.species, row])));
    } catch {
      /* ignore */
    }
  }, []);
  const purchaseScenarios = useMemo(() => buyListService.buildPurchaseScenarios(project), [project]);
  const lumberRows = useMemo(() => buyListService.buildLumberRows(project), [project]);
  const purchaseIntelligenceScenarios = useMemo(() => {
    return purchaseStrategyService.generateScenarios(project.parts, {
      stockType,
      acceptableWaste: 15,
      maxBoardLengthFeet: project.maxTransportLengthInches / 12,
      maxBoardWidthInches: project.maxPurchasableBoardWidthInches,
      preferredLengthsFeet: [16, 14, 12, 10, 8],
      pricingBySpecies,
    });
  }, [
    pricingBySpecies,
    project.maxPurchasableBoardWidthInches,
    project.maxTransportLengthInches,
    project.parts,
    stockType,
  ]);

  const selectedScenario =
    purchaseIntelligenceScenarios.find((scenario) => scenario.id === selectedScenarioId) ??
    purchaseIntelligenceScenarios[0];

  const speciesInProject = useMemo(
    () => [...new Set(project.parts.map((part) => part.material.label).filter(Boolean))],
    [project.parts]
  );

  function savePricing(next: Map<string, PricingData>) {
    setPricingBySpecies(next);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(PURCHASE_PRICING_KEY, JSON.stringify(Array.from(next.values())));
    }
    setShowPricingModal(false);
  }

  return (
    <section className="gl-panel p-5">
      {showDresserSummary && dresserSnapshot ? (
        <div className="mb-5">
          <DresserMaterialsSummary snapshot={dresserSnapshot} />
        </div>
      ) : null}
      <p className="text-xs font-medium tracking-widest text-[var(--gl-muted)] uppercase">Buy list</p>
      <p className="mt-1 text-sm text-[var(--gl-muted)]">
        Simple shopping summary by lumber type. Quantities are derived from your configured cut list and transport-length
        packing.
      </p>

      {lumberRows.length === 0 ? (
        <p className="mt-4 text-sm text-[var(--gl-muted)]">Add parts in Plan to generate a buy list.</p>
      ) : (
        <div className="mt-4 overflow-x-auto rounded-xl border border-[var(--gl-border)]">
          <table className="gl-numeric w-full min-w-[580px] text-left text-sm text-[var(--gl-cream)]">
            <thead className="bg-[var(--gl-surface-inset)] text-xs tracking-wide text-[var(--gl-muted)] uppercase">
              <tr>
                <th className="px-3 py-2.5 font-medium">Lumber type</th>
                <th className="px-3 py-2.5 text-right font-medium">Qty boards</th>
                <th className="px-3 py-2.5 text-right font-medium">Each length</th>
                <th className="px-3 py-2.5 text-right font-medium">Total lineal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--gl-border)]">
              {lumberRows.map((row) => {
                const qty = row.packError ? "—" : String(row.packedBoards?.length ?? 0);
                return (
                  <tr key={row.key}>
                    <td className="px-3 py-2.5 font-medium text-[var(--gl-cream-soft)]">{row.yardLumberLabel}</td>
                    <td className="px-3 py-2.5 text-right tabular-nums" title={row.packError ?? undefined}>
                      {qty}
                    </td>
                    <td className="px-3 py-2.5 text-right tabular-nums">
                      {formatShopImperial(project.maxTransportLengthInches)}
                    </td>
                    <td className="px-3 py-2.5 text-right tabular-nums">{(row.adjustedLinearFeet).toFixed(2)} LF</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <p className="border-t border-[var(--gl-border)] px-3 py-2 text-xs text-[var(--gl-muted)]">
            Using max haul length <strong className="text-[var(--gl-cream)]">{formatShopImperial(project.maxTransportLengthInches)}</strong>
            {" · "}max board face width{" "}
            <strong className="text-[var(--gl-cream)]">{formatShopImperial(project.maxPurchasableBoardWidthInches)}</strong>
            {" · "}waste factor <strong className="text-[var(--gl-cream)]">{project.wasteFactorPercent}%</strong>.
          </p>
        </div>
      )}

      {project.parts.length > 0 ? (
        <details className="mt-5 rounded-xl border border-[var(--gl-border)] bg-[var(--gl-surface-muted)] p-4">
          <summary className="cursor-pointer text-sm font-medium text-[var(--gl-cream-soft)]">
            Purchase scenario lenses (estimate only)
          </summary>
          <p className="mt-2 text-xs text-[var(--gl-muted)]">
            The table above packs sticks using your transport cap. Below is how different procurement objectives would
            frame the same demand—yard verification still required.
          </p>
          <ul className="mt-3 space-y-3 text-xs text-[var(--gl-muted)]">
            {purchaseScenarios.map((s) => (
              <li key={s.scenario} className="rounded-lg border border-[var(--gl-border)] bg-[var(--gl-surface)] p-3">
                <p className="font-medium text-[var(--gl-cream-soft)]">{PURCHASE_SCENARIO_META[s.scenario].title}</p>
                <p className="mt-1">{PURCHASE_SCENARIO_META[s.scenario].shortHint}</p>
                <p className="mt-1 text-[var(--gl-muted)]">
                  ~{s.twoDimensional.totalEstimatedBoards2d} boards (2D estimate) · {s.detail.slice(0, 160)}
                  {s.detail.length > 160 ? "…" : ""}
                </p>
              </li>
            ))}
          </ul>
        </details>
      ) : null}

      {project.parts.length > 0 ? (
        <div className="mt-5 space-y-4 rounded-xl border border-[var(--gl-border)] bg-[var(--gl-surface-muted)] p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="text-xs font-medium tracking-widest text-[var(--gl-muted)] uppercase">
                Purchase intelligence
              </p>
              <p className="mt-1 text-xs text-[var(--gl-muted)]">
                Compare strategies by waste, board count, transport, and estimated cost.
              </p>
            </div>
            <button
              type="button"
              className="rounded-md border border-[var(--gl-border)] px-3 py-1.5 text-xs text-[var(--gl-cream-soft)]"
              onClick={() => setShowPricingModal(true)}
            >
              Add pricing
            </button>
          </div>

          <StockTypeSelector value={stockType} onChange={setStockType} />
          <ScenarioComparison
            scenarios={purchaseIntelligenceScenarios}
            selectedScenarioId={selectedScenario?.id}
            onSelectScenario={(scenario) => setSelectedScenarioId(scenario.id)}
          />

          {selectedScenario ? (
            <div className="rounded-lg border border-[var(--gl-border)] bg-[var(--gl-surface)] p-3">
              <p className="text-xs font-medium text-[var(--gl-cream-soft)]">Selected scenario assumptions</p>
              <ul className="mt-2 list-disc space-y-1 pl-4 text-xs text-[var(--gl-muted)]">
                {selectedScenario.assumptions.map((assumption) => (
                  <li key={assumption}>{assumption}</li>
                ))}
              </ul>
              <p className="mt-2 text-xs text-[var(--gl-muted)]">
                Stock guidance:{" "}
                {stockConversionService
                  .generateStockGuidance(stockType)
                  .slice(0, 1)
                  .join("")}
              </p>
            </div>
          ) : null}
        </div>
      ) : null}

      {showPricingModal ? (
        <CostInputModal
          species={speciesInProject}
          initialPricing={pricingBySpecies}
          onSave={savePricing}
          onClose={() => setShowPricingModal(false)}
        />
      ) : null}
    </section>
  );
}
