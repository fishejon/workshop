import { describe, expect, it } from "vitest";
import type { Part } from "./project-types";
import { evaluatePurchaseScenario } from "./purchase-scenarios";

function samplePart(over: Partial<Part> & Pick<Part, "id" | "name">): Part {
  return {
    id: over.id,
    name: over.name,
    assembly: over.assembly ?? "Case",
    quantity: over.quantity ?? 1,
    finished: over.finished ?? { t: 0.75, w: 5.5, l: 48 },
    rough: over.rough ?? { t: 1, w: 6, l: 48, manual: false },
    material: over.material ?? { label: "White oak", thicknessCategory: "4/4" },
    grainNote: over.grainNote ?? "",
    status: over.status ?? "solid",
  };
}

describe("evaluatePurchaseScenario", () => {
  it("fitTransport returns 2D estimate and engineering summary", () => {
    const parts: Part[] = [
      samplePart({
        id: "a",
        name: "A",
        quantity: 2,
        rough: { t: 1, w: 6, l: 40, manual: false },
      }),
    ];
    const r = evaluatePurchaseScenario("fitTransport", {
      parts,
      wasteFactorPercent: 0,
      maxTransportLengthInches: 96,
      kerfInches: 0.125,
    });
    expect(r.headline).toMatch(/Constraint set/i);
    expect(r.twoDimensional.totalEstimatedBoards2d).toBeGreaterThanOrEqual(1);
    expect(r.twoDimensional.groups).toHaveLength(1);
  });

  it("varies headline by optimization objective", () => {
    const parts: Part[] = [
      samplePart({
        id: "a",
        name: "A",
        quantity: 2,
        rough: { t: 1, w: 6, l: 40, manual: false },
      }),
    ];
    const r = evaluatePurchaseScenario("minBoardCount", {
      parts,
      wasteFactorPercent: 0,
      maxTransportLengthInches: 96,
      kerfInches: 0.125,
    });
    expect(r.headline).toMatch(/minimize board count/i);
  });

  it("reflects transport violations inside 2D group flags/detail", () => {
    const parts: Part[] = [
      samplePart({
        id: "long",
        name: "Long",
        quantity: 1,
        rough: { t: 1, w: 6, l: 100, manual: false },
      }),
    ];
    const r = evaluatePurchaseScenario("fitTransport", {
      parts,
      wasteFactorPercent: 0,
      maxTransportLengthInches: 96,
      kerfInches: 0.125,
    });
    expect(r.twoDimensional.groups[0]!.estimatedBoards2d).toBe(0);
    expect(r.detail).toMatch(/No demand rows|Total estimated boards/i);
  });

  it("flags width-lane expansion when part width exceeds stock width", () => {
    const parts: Part[] = [
      samplePart({
        id: "wide",
        name: "Wide rail",
        quantity: 1,
        status: "solid",
        rough: { t: 1, w: 24, l: 48, manual: false },
      }),
    ];
    const r = evaluatePurchaseScenario("fitTransport", {
      parts,
      wasteFactorPercent: 0,
      maxTransportLengthInches: 96,
      maxPurchasableBoardWidthInches: 20,
      kerfInches: 0.125,
    });
    expect(r.maxPurchasableBoardWidthInches).toBe(20);
    expect(r.twoDimensional.groups[0]!.flags.length).toBeGreaterThan(0);
    expect(r.twoDimensional.groups[0]!.estimatedBoards2d).toBeGreaterThanOrEqual(2);
  });

  it("expands panel demand via glue-up strips", () => {
    const parts: Part[] = [
      samplePart({
        id: "panel",
        name: "Back",
        quantity: 1,
        status: "panel",
        finished: { t: 0.25, w: 22, l: 30 },
        rough: { t: 0.25, w: 6, l: 30, manual: false },
      }),
    ];
    const r = evaluatePurchaseScenario("fitTransport", {
      parts,
      wasteFactorPercent: 0,
      maxTransportLengthInches: 96,
      maxPurchasableBoardWidthInches: 20,
    });
    expect(r.twoDimensional.groups[0]!.estimatedBoards2d).toBeGreaterThanOrEqual(1);
    expect(r.twoDimensional.assumptions.join(" ")).toMatch(/Panels are split into glue-up strips/i);
  });

  it("computes group and total costs from optional BF/LF rates", () => {
    const parts: Part[] = [
      samplePart({
        id: "oak-a",
        name: "Oak rail",
        quantity: 2,
        rough: { t: 1, w: 4, l: 60, manual: false },
        material: { label: "White oak", thicknessCategory: "4/4" },
      }),
      samplePart({
        id: "walnut-a",
        name: "Walnut stile",
        quantity: 1,
        rough: { t: 1, w: 5, l: 48, manual: false },
        material: { label: "Walnut", thicknessCategory: "4/4" },
      }),
    ];
    const r = evaluatePurchaseScenario("fitTransport", {
      parts,
      wasteFactorPercent: 10,
      maxTransportLengthInches: 96,
      costRatesByGroup: {
        "White oak||4/4": { perBoardFoot: 12, perLinearFoot: 0.5 },
        "Walnut||4/4": { perBoardFoot: 16 },
      },
    });

    const oak = r.groupCosts.find((g) => g.key === "White oak||4/4");
    const walnut = r.groupCosts.find((g) => g.key === "Walnut||4/4");
    expect(oak).toBeDefined();
    expect(walnut).toBeDefined();
    expect(oak!.boardFootCost).toBeCloseTo(44, 6);
    expect(oak!.linearFootCost).toBeCloseTo(5.5, 6);
    expect(oak!.totalCost).toBeCloseTo(49.5, 6);
    expect(walnut!.boardFootCost).toBeCloseTo(29.3333333333, 6);
    expect(walnut!.linearFootCost).toBe(0);
    expect(r.totalEstimatedCost).toBeCloseTo(78.8333333333, 6);
  });

  it("treats blank/invalid/negative rates as unset", () => {
    const parts: Part[] = [
      samplePart({
        id: "a",
        name: "A",
        quantity: 1,
      }),
    ];
    const r = evaluatePurchaseScenario("fitTransport", {
      parts,
      wasteFactorPercent: 0,
      maxTransportLengthInches: 96,
      costRatesByGroup: {
        "White oak||4/4": { perBoardFoot: Number.NaN, perLinearFoot: -2 },
      },
    });
    expect(r.groupCosts[0]!.perBoardFoot).toBeUndefined();
    expect(r.groupCosts[0]!.perLinearFoot).toBeUndefined();
    expect(r.groupCosts[0]!.totalCost).toBe(0);
    expect(r.totalEstimatedCost).toBe(0);
  });
});
