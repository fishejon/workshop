import type { Part } from "@/lib/project-types";
import { newPartId } from "@/lib/project-utils";
import type {
  BoardPurchase,
  BuyStrategy,
  PartAssignment,
  PurchaseScenario,
  ScenarioMetrics,
  StrategyConfig,
} from "@/lib/types/purchase-strategy";
import { costEstimationService } from "@/lib/services/CostEstimationService";
import { stockConversionService } from "@/lib/services/StockConversionService";

type DemandPart = {
  id: string;
  name: string;
  species: string;
  thicknessInches: number;
  widthInches: number;
  lengthFeet: number;
  quantity: number;
};

type PackedBin = {
  lengthFeet: number;
  parts: DemandPart[];
  usedLengthFeet: number;
};

const DEFAULT_LENGTHS = [16, 14, 12, 10, 8];

export class PurchaseStrategyService {
  generateScenarios(parts: Part[], config: StrategyConfig): PurchaseScenario[] {
    return [
      this.generateMinimizeWaste(parts, config),
      this.generateMinimizeBoardCount(parts, config),
      this.generateFitTransport(parts, config),
      this.generateSimpleTrip(parts, config),
    ];
  }

  private expandDemand(parts: Part[], config: StrategyConfig): DemandPart[] {
    const expanded: DemandPart[] = [];
    const factor = config.roughToSurfacedFactor ?? 0.125;
    for (const part of parts) {
      for (let i = 0; i < part.quantity; i++) {
        const rough = config.stockType === "rough";
        const thicknessInches = rough
          ? stockConversionService.convertToRoughStock(part.rough.t, factor)
          : part.rough.t;
        const widthInches = rough
          ? stockConversionService.convertToRoughStock(part.rough.w, factor)
          : part.rough.w;
        expanded.push({
          id: `${part.id}:${i}`,
          name: part.name,
          species: part.material.label,
          thicknessInches,
          widthInches,
          lengthFeet: part.rough.l / 12,
          quantity: 1,
        });
      }
    }
    return expanded.filter((row) => row.lengthFeet > 0 && row.widthInches > 0 && row.thicknessInches > 0);
  }

  private groupDemand(demand: DemandPart[]) {
    const groups = new Map<string, DemandPart[]>();
    for (const item of demand) {
      const key = `${item.species}::${item.thicknessInches.toFixed(3)}`;
      const existing = groups.get(key) ?? [];
      existing.push(item);
      groups.set(key, existing);
    }
    return groups;
  }

  private binsToBoards(
    bins: PackedBin[],
    species: string,
    thicknessInches: number,
    config: StrategyConfig
  ): BoardPurchase[] {
    return bins.map((bin) => {
      const assignedParts: PartAssignment[] = bin.parts.map((part) => ({
        partId: part.id,
        partName: part.name,
        dimensions: {
          lengthInches: part.lengthFeet * 12,
          widthInches: part.widthInches,
          thicknessInches: part.thicknessInches,
        },
        quantity: 1,
      }));
      const width = this.recommendBoardWidth(bin.parts, config);
      const wastePercentage = ((bin.lengthFeet - bin.usedLengthFeet) / bin.lengthFeet) * 100;
      return {
        id: newPartId(),
        species,
        dimensions: {
          thicknessInches,
          widthInches: width,
          lengthFeet: bin.lengthFeet,
        },
        quantity: 1,
        grade: config.stockType === "rough" ? "Rough" : "S4S",
        assignedParts,
        wastePercentage: Number.isFinite(wastePercentage) ? wastePercentage : 0,
      };
    });
  }

  private generateScenarioBase(
    strategy: BuyStrategy,
    name: string,
    description: string,
    boardList: BoardPurchase[],
    assumptions: string[],
    config: StrategyConfig
  ): PurchaseScenario {
    const metrics = this.calculateMetrics(boardList, config);
    if (config.pricingBySpecies && config.pricingBySpecies.size > 0) {
      const cost = costEstimationService.estimateScenarioCost(boardList, config.pricingBySpecies);
      metrics.estimatedCost = cost.totalCost;
      metrics.costPerBoardFoot = metrics.totalBoardFeet > 0 ? cost.totalCost / metrics.totalBoardFeet : 0;
    }
    return {
      id: `scenario-${strategy}`,
      name,
      description,
      strategy,
      boardList,
      metrics,
      generatedAt: new Date().toISOString(),
      assumptions,
    };
  }

  private generateMinimizeWaste(parts: Part[], config: StrategyConfig): PurchaseScenario {
    const demand = this.expandDemand(parts, config).sort((a, b) => b.lengthFeet - a.lengthFeet);
    const groups = this.groupDemand(demand);
    const lengths = (config.preferredLengthsFeet?.length ? config.preferredLengthsFeet : DEFAULT_LENGTHS).slice();
    const boardList: BoardPurchase[] = [];
    for (const [key, grouped] of groups) {
      const [species, thicknessRaw] = key.split("::");
      const bins = this.binPackParts(grouped, lengths.sort((a, b) => b - a));
      boardList.push(...this.binsToBoards(bins, species, Number(thicknessRaw), config));
    }
    return this.generateScenarioBase(
      "minimize-waste",
      "Minimize Waste",
      "Prioritizes material efficiency through tighter packing.",
      boardList,
      [
        `Waste target: <${config.acceptableWaste ?? 15}%`,
        "Longer boards preferred when they reduce trim loss.",
      ],
      config
    );
  }

  private generateMinimizeBoardCount(parts: Part[], config: StrategyConfig): PurchaseScenario {
    const demand = this.expandDemand(parts, config).sort((a, b) => b.lengthFeet - a.lengthFeet);
    const groups = this.groupDemand(demand);
    const maxLength = Math.max(...(config.preferredLengthsFeet?.length ? config.preferredLengthsFeet : DEFAULT_LENGTHS));
    const boardList: BoardPurchase[] = [];
    for (const [key, grouped] of groups) {
      const [species, thicknessRaw] = key.split("::");
      const bins = this.packGreedy(grouped, maxLength);
      boardList.push(...this.binsToBoards(bins, species, Number(thicknessRaw), config));
    }
    return this.generateScenarioBase(
      "minimize-board-count",
      "Minimize Board Count",
      "Reduces number of boards, typically trading off extra waste.",
      boardList,
      [`Uses maximum preferred length (${maxLength}ft).`, "Optimized for fewer boards and faster yard handling."],
      config
    );
  }

  private generateFitTransport(parts: Part[], config: StrategyConfig): PurchaseScenario {
    const maxLength = config.maxBoardLengthFeet ?? 8;
    const lengths = (config.preferredLengthsFeet?.length ? config.preferredLengthsFeet : DEFAULT_LENGTHS)
      .filter((len) => len <= maxLength)
      .sort((a, b) => b - a);
    const demand = this.expandDemand(parts, config).sort((a, b) => b.lengthFeet - a.lengthFeet);
    const groups = this.groupDemand(demand);
    const boardList: BoardPurchase[] = [];
    for (const [key, grouped] of groups) {
      const [species, thicknessRaw] = key.split("::");
      const bins = this.binPackParts(grouped, lengths.length > 0 ? lengths : [maxLength]);
      boardList.push(...this.binsToBoards(bins, species, Number(thicknessRaw), config));
    }
    return this.generateScenarioBase(
      "fit-transport",
      "Fit Transport",
      `Constrains board lengths to ${maxLength}ft for self-haul feasibility.`,
      boardList,
      [`Max board length ${maxLength}ft.`, "Avoids delivery-required boards when possible."],
      config
    );
  }

  private generateSimpleTrip(parts: Part[], config: StrategyConfig): PurchaseScenario {
    const demand = this.expandDemand(parts, config).sort((a, b) => b.lengthFeet - a.lengthFeet);
    const groups = this.groupDemand(demand);
    const lengths = [10, 8];
    const boardList: BoardPurchase[] = [];
    for (const [key, grouped] of groups) {
      const [species, thicknessRaw] = key.split("::");
      const bins = this.binPackParts(grouped, lengths);
      boardList.push(...this.binsToBoards(bins, species, Number(thicknessRaw), config));
    }
    return this.generateScenarioBase(
      "simple-trip",
      "Simple Trip",
      "Uses common 8ft/10ft stock for quick yard purchasing.",
      boardList,
      ["Uses only 8ft and 10ft boards.", "Higher waste is acceptable for convenience."],
      config
    );
  }

  private binPackParts(parts: DemandPart[], lengthsFeet: number[]): PackedBin[] {
    const bins: PackedBin[] = [];
    for (const part of parts) {
      let placed = false;
      for (const bin of bins) {
        if (bin.usedLengthFeet + part.lengthFeet <= bin.lengthFeet) {
          bin.parts.push(part);
          bin.usedLengthFeet += part.lengthFeet;
          placed = true;
          break;
        }
      }
      if (!placed) {
        const selected = lengthsFeet.find((len) => len >= part.lengthFeet) ?? Math.max(...lengthsFeet);
        bins.push({ lengthFeet: selected, parts: [part], usedLengthFeet: part.lengthFeet });
      }
    }
    return bins;
  }

  private packGreedy(parts: DemandPart[], boardLengthFeet: number): PackedBin[] {
    const remaining = [...parts];
    const bins: PackedBin[] = [];
    while (remaining.length > 0) {
      let used = 0;
      const packed: DemandPart[] = [];
      for (let i = 0; i < remaining.length; i++) {
        const part = remaining[i]!;
        if (used + part.lengthFeet <= boardLengthFeet) {
          used += part.lengthFeet;
          packed.push(part);
          remaining.splice(i, 1);
          i -= 1;
        }
      }
      bins.push({ lengthFeet: boardLengthFeet, parts: packed, usedLengthFeet: used });
    }
    return bins;
  }

  private recommendBoardWidth(parts: DemandPart[], config: StrategyConfig): number {
    const widest = Math.max(...parts.map((part) => part.widthInches));
    const maxAllowed = config.maxBoardWidthInches ?? 24;
    const standard = [4, 6, 8, 10, 12, 14, 16, 18, 20, 24];
    const selected = standard.find((w) => w >= widest) ?? widest;
    return Math.min(selected, maxAllowed);
  }

  private calculateMetrics(boardList: BoardPurchase[], config: StrategyConfig): ScenarioMetrics {
    const totalBoardFeet = boardList.reduce((sum, board) => {
      const bf =
        (board.dimensions.thicknessInches * board.dimensions.widthInches * board.dimensions.lengthFeet) / 12;
      return sum + bf * board.quantity;
    }, 0);
    const totalWasteBF = boardList.reduce((sum, board) => {
      const bf =
        (board.dimensions.thicknessInches * board.dimensions.widthInches * board.dimensions.lengthFeet) / 12;
      return sum + (bf * board.wastePercentage) / 100;
    }, 0);
    const longestBoardFeet = boardList.length > 0 ? Math.max(...boardList.map((row) => row.dimensions.lengthFeet)) : 0;
    const transportFeasibility =
      longestBoardFeet <= 8 ? "car" : longestBoardFeet <= 12 ? "truck" : "delivery-required";
    const uniqueStockSizes = new Set(
      boardList.map(
        (board) =>
          `${board.species}:${board.dimensions.thicknessInches}x${board.dimensions.widthInches}x${board.dimensions.lengthFeet}`
      )
    ).size;
    return {
      totalBoardFeet,
      totalLinearFeet: boardList.reduce((sum, board) => sum + board.dimensions.lengthFeet * board.quantity, 0),
      boardCount: boardList.reduce((sum, board) => sum + board.quantity, 0),
      totalWasteBF,
      wastePercentage: totalBoardFeet > 0 ? (totalWasteBF / totalBoardFeet) * 100 : 0,
      longestBoardFeet,
      transportFeasibility,
      uniqueStockSizes,
      tripCount: config.stockType === "rough" ? 2 : 1,
    };
  }
}

export const purchaseStrategyService = new PurchaseStrategyService();
