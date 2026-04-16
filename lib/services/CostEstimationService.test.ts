import { describe, expect, it } from "vitest";
import { costEstimationService } from "@/lib/services/CostEstimationService";
import type { BoardPurchase, PricingData } from "@/lib/types/purchase-strategy";

describe("CostEstimationService", () => {
  it("calculates board-foot pricing", () => {
    const boards: BoardPurchase[] = [
      {
        id: "b1",
        species: "White Oak",
        dimensions: { thicknessInches: 1, widthInches: 8, lengthFeet: 10 },
        quantity: 1,
        assignedParts: [],
        wastePercentage: 10,
      },
    ];
    const pricing = new Map<string, PricingData>([
      ["White Oak", { species: "White Oak", pricePerBoardFoot: 8 }],
    ]);
    const result = costEstimationService.estimateScenarioCost(boards, pricing);
    expect(result.totalCost).toBeCloseTo((1 * 8 * 10) / 12 * 8, 4);
    expect(result.warnings).toHaveLength(0);
  });

  it("returns warning for missing pricing", () => {
    const boards: BoardPurchase[] = [
      {
        id: "b1",
        species: "Cherry",
        dimensions: { thicknessInches: 1, widthInches: 6, lengthFeet: 8 },
        quantity: 1,
        assignedParts: [],
        wastePercentage: 0,
      },
    ];
    const result = costEstimationService.estimateScenarioCost(boards, new Map());
    expect(result.totalCost).toBe(0);
    expect(result.warnings.length).toBeGreaterThan(0);
  });
});
