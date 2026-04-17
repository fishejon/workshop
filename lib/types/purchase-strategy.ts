export type BuyStrategy =
  | "minimize-waste"
  | "minimize-board-count"
  | "fit-transport"
  | "simple-trip";

export type PartAssignment = {
  partId: string;
  partName: string;
  dimensions: {
    lengthInches: number;
    widthInches: number;
    thicknessInches: number;
  };
  quantity: number;
};

export type BoardPurchase = {
  id: string;
  species: string;
  dimensions: {
    thicknessInches: number;
    widthInches: number;
    lengthFeet: number;
  };
  quantity: number;
  grade?: string;
  assignedParts: PartAssignment[];
  wastePercentage: number;
  unitCost?: number;
  totalCost?: number;
};

export type ScenarioMetrics = {
  totalBoardFeet: number;
  totalLinearFeet: number;
  boardCount: number;
  totalWasteBF: number;
  wastePercentage: number;
  estimatedCost?: number;
  costPerBoardFoot?: number;
  longestBoardFeet: number;
  transportFeasibility: "car" | "truck" | "delivery-required";
  uniqueStockSizes: number;
  tripCount?: number;
};

export type PurchaseScenario = {
  id: string;
  name: string;
  description: string;
  strategy: BuyStrategy;
  boardList: BoardPurchase[];
  metrics: ScenarioMetrics;
  generatedAt: string;
  assumptions: string[];
};

export type PricingData = {
  species: string;
  pricePerBoardFoot?: number;
  pricePerLinearFoot?: number;
  grade?: string;
  source?: string;
};

export type StrategyConfig = {
  maxBoardLengthFeet?: number;
  maxBoardWidthInches?: number;
  preferredLengthsFeet?: number[];
  acceptableWaste?: number;
  stockType: "surfaced" | "rough";
  roughToSurfacedFactor?: number;
  pricingBySpecies?: Map<string, PricingData>;
};

export type CostBreakdown = {
  species: string;
  dimensions: { thicknessInches: number; widthInches: number; lengthFeet: number };
  quantity: number;
  unitCost: number;
  totalCost: number;
};

export type PricingRange = {
  low: number;
  mid: number;
  high: number;
  unit: "BF" | "LF" | "SF";
  note?: string;
};
