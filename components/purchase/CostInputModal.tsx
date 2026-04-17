"use client";

import { useMemo, useState } from "react";
import { costEstimationService } from "@/lib/services/CostEstimationService";
import type { PricingData } from "@/lib/types/purchase-strategy";

export function CostInputModal({
  species,
  initialPricing,
  onSave,
  onClose,
}: {
  species: string[];
  initialPricing: Map<string, PricingData>;
  onSave: (pricing: Map<string, PricingData>) => void;
  onClose: () => void;
}) {
  const [pricing, setPricing] = useState<Map<string, PricingData>>(new Map(initialPricing));

  const orderedSpecies = useMemo(() => [...new Set(species)].sort(), [species]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-2xl rounded-xl border border-[var(--gl-border)] bg-[var(--gl-surface)] p-4">
        <h2 className="font-display text-xl text-[var(--gl-cream)]">Pricing input</h2>
        <p className="mt-1 text-xs text-[var(--gl-muted)]">
          Cost estimates are planning guidance only. Confirm live pricing with your supplier.
        </p>
        <div className="mt-3 max-h-[55vh] space-y-2 overflow-y-auto">
          {orderedSpecies.map((sp) => {
            const range = costEstimationService.getTypicalPricing(sp);
            const value = pricing.get(sp)?.pricePerBoardFoot ?? "";
            return (
              <label key={sp} className="block rounded-lg border border-[var(--gl-border)] p-3">
                <div className="mb-1 flex items-center justify-between">
                  <span className="text-sm font-medium text-[var(--gl-cream-soft)]">{sp}</span>
                  <span className="text-xs text-[var(--gl-muted)]">
                    Typical: ${range.low}-${range.high}/{range.unit}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs text-[var(--gl-muted)]">
                  <span>$</span>
                  <input
                    type="number"
                    min={0}
                    step={0.25}
                    value={value}
                    onChange={(e) => {
                      const n = Number(e.target.value);
                      const next = new Map(pricing);
                      if (!Number.isFinite(n) || n < 0) {
                        next.delete(sp);
                      } else {
                        next.set(sp, {
                          species: sp,
                          pricePerBoardFoot: n,
                          grade: "S4S",
                          source: "User input",
                        });
                      }
                      setPricing(next);
                    }}
                    className="input-wood w-32"
                    placeholder={String(range.mid)}
                  />
                  <span>per board foot</span>
                </div>
              </label>
            );
          })}
        </div>
        <div className="mt-4 flex justify-end gap-2">
          <button type="button" className="rounded-md border border-[var(--gl-border)] px-3 py-1.5 text-xs" onClick={onClose}>
            Cancel
          </button>
          <button
            type="button"
            className="rounded-md border border-[var(--gl-copper)] px-3 py-1.5 text-xs text-[var(--gl-cream-soft)]"
            onClick={() => onSave(pricing)}
          >
            Apply pricing
          </button>
        </div>
      </div>
    </div>
  );
}
