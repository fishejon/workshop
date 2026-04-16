import type {
  BoardPurchase,
  CostBreakdown,
  PricingData,
  PricingRange,
} from "@/lib/types/purchase-strategy";

export class CostEstimationService {
  estimateScenarioCost(
    boardList: BoardPurchase[],
    pricingData: Map<string, PricingData>
  ): { totalCost: number; breakdown: CostBreakdown[]; warnings: string[] } {
    let totalCost = 0;
    const breakdown: CostBreakdown[] = [];
    const warnings: string[] = [];

    for (const board of boardList) {
      const pricing = pricingData.get(board.species);
      if (!pricing) {
        warnings.push(`No pricing entered for ${board.species}; estimate is incomplete.`);
        continue;
      }
      const boardCost = this.calculateBoardCost(board, pricing);
      totalCost += boardCost;
      breakdown.push({
        species: board.species,
        dimensions: board.dimensions,
        quantity: board.quantity,
        unitCost: pricing.pricePerBoardFoot ?? pricing.pricePerLinearFoot ?? 0,
        totalCost: boardCost,
      });
    }

    return { totalCost, breakdown, warnings };
  }

  private calculateBoardCost(board: BoardPurchase, pricing: PricingData): number {
    if (pricing.pricePerBoardFoot) {
      const bf =
        (board.dimensions.thicknessInches * board.dimensions.widthInches * board.dimensions.lengthFeet) / 12;
      return bf * board.quantity * pricing.pricePerBoardFoot;
    }
    if (pricing.pricePerLinearFoot) {
      return board.dimensions.lengthFeet * board.quantity * pricing.pricePerLinearFoot;
    }
    return 0;
  }

  getTypicalPricing(species: string): PricingRange {
    const ranges: Record<string, PricingRange> = {
      "White Oak": { low: 6, mid: 8, high: 12, unit: "BF" },
      "Red Oak": { low: 4, mid: 6, high: 9, unit: "BF" },
      Maple: { low: 5, mid: 7, high: 10, unit: "BF" },
      Walnut: { low: 10, mid: 14, high: 20, unit: "BF" },
      Cherry: { low: 7, mid: 10, high: 15, unit: "BF" },
      Poplar: { low: 3, mid: 4, high: 6, unit: "BF" },
      Pine: { low: 2, mid: 3, high: 5, unit: "BF" },
      Plywood: { low: 1, mid: 1.5, high: 2.5, unit: "SF" },
      Ash: { low: 5, mid: 7, high: 10, unit: "BF" },
      Birch: { low: 4, mid: 6, high: 9, unit: "BF" },
    };
    return ranges[species] ?? { low: 0, mid: 0, high: 0, unit: "BF", note: "No typical range available." };
  }
}

export const costEstimationService = new CostEstimationService();
