import { describe, expect, it } from "vitest";
import { purchaseStrategyService } from "@/lib/services/PurchaseStrategyService";
import { costEstimationService } from "@/lib/services/CostEstimationService";
import { stockConversionService } from "@/lib/services/StockConversionService";
import type { Part } from "@/lib/project-types";
import type { PricingData } from "@/lib/types/purchase-strategy";

const parts: Part[] = [
  {
    id: "p1",
    name: "Side",
    assembly: "Case",
    quantity: 2,
    finished: { t: 0.75, w: 18, l: 30 },
    rough: { t: 0.75, w: 18, l: 30, manual: false },
    material: { label: "White Oak", thicknessCategory: "4/4" },
    grainNote: "",
    status: "solid",
  },
  {
    id: "p2",
    name: "Top",
    assembly: "Case",
    quantity: 1,
    finished: { t: 0.75, w: 20, l: 36 },
    rough: { t: 0.75, w: 20, l: 36, manual: false },
    material: { label: "White Oak", thicknessCategory: "4/4" },
    grainNote: "",
    status: "solid",
  },
];

describe("purchase intelligence integration", () => {
  it("generates scenarios with metrics and optional costs", () => {
    const pricing = new Map<string, PricingData>([
      ["White Oak", { species: "White Oak", pricePerBoardFoot: 8 }],
    ]);
    const scenarios = purchaseStrategyService.generateScenarios(parts, {
      stockType: "surfaced",
      preferredLengthsFeet: [16, 12, 10, 8],
      maxBoardLengthFeet: 8,
      pricingBySpecies: pricing,
    });
    expect(scenarios).toHaveLength(4);
    expect(scenarios.every((s) => s.metrics.totalBoardFeet > 0)).toBe(true);
    expect(scenarios.some((s) => (s.metrics.estimatedCost ?? 0) > 0)).toBe(true);
  });

  it("cost + stock services remain consistent", () => {
    const scenarios = purchaseStrategyService.generateScenarios(parts, { stockType: "rough" });
    const first = scenarios[0]!;
    const cost = costEstimationService.estimateScenarioCost(
      first.boardList,
      new Map([["White Oak", { species: "White Oak", pricePerBoardFoot: 8 }]])
    );
    expect(cost.totalCost).toBeGreaterThan(0);
    expect(stockConversionService.convertToRoughStock(0.75)).toBeGreaterThan(0.75);
  });
});
