"use client";

import type { ReactNode } from "react";
import type { PurchaseScenario } from "@/lib/types/purchase-strategy";

function wasteTone(waste: number) {
  if (waste < 10) return "bg-green-900/30 text-green-200";
  if (waste < 20) return "bg-yellow-900/30 text-yellow-200";
  return "bg-red-900/30 text-red-200";
}

function transportLabel(value: PurchaseScenario["metrics"]["transportFeasibility"]) {
  if (value === "car") return "Car";
  if (value === "truck") return "Truck";
  return "Delivery";
}

export function ScenarioComparison({
  scenarios,
  selectedScenarioId,
  onSelectScenario,
}: {
  scenarios: PurchaseScenario[];
  selectedScenarioId?: string;
  onSelectScenario: (scenario: PurchaseScenario) => void;
}) {
  return (
    <div className="space-y-3">
      <div className="overflow-x-auto rounded-xl border border-[var(--gl-border)]">
        <table className="w-full min-w-[840px] text-left text-xs text-[var(--gl-cream-soft)]">
          <thead className="bg-[var(--gl-surface-inset)] text-[var(--gl-muted)] uppercase tracking-wider">
            <tr>
              <th className="px-3 py-2">Metric</th>
              {scenarios.map((scenario) => (
                <th key={scenario.id} className="px-3 py-2">
                  <p>{scenario.name}</p>
                  <p className="mt-1 normal-case tracking-normal text-[var(--gl-muted)]">{scenario.description}</p>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--gl-border)]">
            <Row label="Board count">{scenarios.map((s) => `${s.metrics.boardCount}`)}</Row>
            <Row label="Board feet">{scenarios.map((s) => `${s.metrics.totalBoardFeet.toFixed(1)} BF`)}</Row>
            <Row label="Waste">
              {scenarios.map((s) => (
                <span key={s.id} className={`inline-flex rounded px-2 py-1 ${wasteTone(s.metrics.wastePercentage)}`}>
                  {s.metrics.wastePercentage.toFixed(1)}%
                </span>
              ))}
            </Row>
            <Row label="Estimated cost">
              {scenarios.map((s) => (s.metrics.estimatedCost ? `$${s.metrics.estimatedCost.toFixed(2)}` : "—"))}
            </Row>
            <Row label="Transport">
              {scenarios.map((s) => `${transportLabel(s.metrics.transportFeasibility)} (${s.metrics.longestBoardFeet}ft)`)}
            </Row>
            <Row label="Complexity">{scenarios.map((s) => `${s.metrics.uniqueStockSizes} stock sizes`)}</Row>
            <tr>
              <td className="px-3 py-2" />
              {scenarios.map((scenario) => (
                <td key={scenario.id} className="px-3 py-2">
                  <button
                    type="button"
                    onClick={() => onSelectScenario(scenario)}
                    className={`w-full rounded-md border px-2 py-1 text-xs ${
                      selectedScenarioId === scenario.id
                        ? "border-[var(--gl-copper)] bg-[var(--gl-copper)]/20"
                        : "border-[var(--gl-border)]"
                    }`}
                  >
                    {selectedScenarioId === scenario.id ? "Selected" : "Use this scenario"}
                  </button>
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
      <div className="rounded-xl border border-[var(--gl-warning)]/40 bg-[var(--gl-warning-bg)] p-3 text-xs text-[var(--gl-warning)]">
        Cost and waste values are planning guidance only. Confirm pricing, stock lengths, and transport with your supplier.
      </div>
    </div>
  );
}

function Row({ label, children }: { label: string; children: ReactNode[] }) {
  return (
    <tr>
      <td className="px-3 py-2 font-medium text-[var(--gl-muted)]">{label}</td>
      {children.map((cell, idx) => (
        <td key={`${label}-${idx}`} className="px-3 py-2">
          {cell}
        </td>
      ))}
    </tr>
  );
}
