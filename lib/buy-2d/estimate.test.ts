import { describe, expect, it } from "vitest";
import type { Part } from "../project-types";
import { computeTwoDimensionalBoardEstimate } from "./estimate";

function sample(over: Partial<Part> & Pick<Part, "id" | "name">): Part {
  return {
    id: over.id,
    name: over.name,
    assembly: over.assembly ?? "Case",
    quantity: over.quantity ?? 1,
    finished: over.finished ?? { t: 0.75, w: 5.5, l: 48 },
    rough: over.rough ?? { t: 1, w: 6, l: 48, manual: false },
    material: over.material ?? { label: "White oak", thicknessCategory: "4/4" },
    grainNote: "",
    status: over.status ?? "solid",
  };
}

describe("computeTwoDimensionalBoardEstimate", () => {
  it("matches 1D stick count when a single solid fits stock width", () => {
    const parts = [
      sample({
        id: "a",
        name: "Rail",
        quantity: 2,
        rough: { t: 1, w: 6, l: 40, manual: false },
      }),
    ];
    const r = computeTwoDimensionalBoardEstimate({
      parts,
      wasteFactorPercent: 0,
      maxTransportLengthInches: 96,
      maxPurchasableBoardWidthInches: 20,
      kerfInches: 0.125,
      scenario: "fitTransport",
    });
    expect(r.groups).toHaveLength(1);
    const g = r.groups[0]!;
    expect(g.estimatedBoards2d).toBe(g.estimatedSticks1d);
  });

  it("increases 2D boards vs 1D when panel glue-up adds strips", () => {
    const parts = [
      sample({
        id: "top",
        name: "Wide top",
        status: "panel",
        quantity: 1,
        finished: { t: 0.75, w: 30, l: 36 },
        rough: { t: 1, w: 31, l: 37, manual: false },
      }),
    ];
    const r = computeTwoDimensionalBoardEstimate({
      parts,
      wasteFactorPercent: 0,
      maxTransportLengthInches: 96,
      maxPurchasableBoardWidthInches: 12,
      kerfInches: 0.125,
      scenario: "fitTransport",
    });
    const g = r.groups[0]!;
    expect(g.estimatedBoards2d).toBeGreaterThanOrEqual(g.estimatedSticks1d);
    expect(g.estimatedBoards2d).toBeGreaterThanOrEqual(2);
  });

  it("uses per-group stock width override", () => {
    const parts = [
      sample({
        id: "a",
        name: "A",
        rough: { t: 1, w: 8, l: 48, manual: false },
      }),
    ];
    const narrow = computeTwoDimensionalBoardEstimate({
      parts,
      wasteFactorPercent: 0,
      maxTransportLengthInches: 96,
      maxPurchasableBoardWidthInches: 20,
      stockWidthByMaterialGroup: { "White oak||4/4": 6 },
      kerfInches: 0.125,
      scenario: "fitTransport",
    });
    expect(narrow.groups[0]!.stockWidthAssumedInches).toBe(6);
    expect(narrow.groups[0]!.flags.length).toBeGreaterThan(0);
  });
});
