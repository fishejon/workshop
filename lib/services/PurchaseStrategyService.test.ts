import { describe, expect, it } from "vitest";
import { purchaseStrategyService } from "@/lib/services/PurchaseStrategyService";
import type { Part } from "@/lib/project-types";

const testParts: Part[] = [
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

describe("PurchaseStrategyService", () => {
  it("generates four scenarios", () => {
    const scenarios = purchaseStrategyService.generateScenarios(testParts, {
      stockType: "surfaced",
      preferredLengthsFeet: [16, 14, 12, 10, 8],
      maxBoardLengthFeet: 8,
      acceptableWaste: 15,
    });
    expect(scenarios).toHaveLength(4);
    expect(scenarios.map((row) => row.strategy)).toEqual([
      "minimize-waste",
      "minimize-board-count",
      "fit-transport",
      "simple-trip",
    ]);
  });

  it("fit transport respects max board length", () => {
    const fitTransport = purchaseStrategyService
      .generateScenarios(testParts, {
        stockType: "surfaced",
        maxBoardLengthFeet: 8,
        preferredLengthsFeet: [16, 12, 10, 8],
      })
      .find((row) => row.strategy === "fit-transport");
    expect(fitTransport).toBeDefined();
    expect(fitTransport!.metrics.longestBoardFeet).toBeLessThanOrEqual(8);
    expect(fitTransport!.metrics.transportFeasibility).toBe("car");
  });

  it("simple trip uses only 8 or 10 foot lengths", () => {
    const simple = purchaseStrategyService
      .generateScenarios(testParts, { stockType: "surfaced" })
      .find((row) => row.strategy === "simple-trip");
    expect(simple).toBeDefined();
    expect(simple!.boardList.every((board) => [8, 10].includes(board.dimensions.lengthFeet))).toBe(true);
  });
});
