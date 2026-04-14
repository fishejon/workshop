import { describe, expect, it } from "vitest";
import {
  DEFAULT_FALLBACK_STOCK_THICKNESS_IN,
  recommendedDadoDepthIn,
  recommendedJoinerySummaryLine,
  recommendedParamsForRule,
  recommendedTenonLengthPerEndIn,
  resolveStockThicknessIn,
} from "./recommended-params";

describe("resolveStockThicknessIn", () => {
  it("uses primary T when positive", () => {
    expect(resolveStockThicknessIn(1.125)).toBe(1.125);
  });
  it("falls back when null, undefined, non-finite, or non-positive", () => {
    expect(resolveStockThicknessIn(null)).toBe(DEFAULT_FALLBACK_STOCK_THICKNESS_IN);
    expect(resolveStockThicknessIn(undefined)).toBe(DEFAULT_FALLBACK_STOCK_THICKNESS_IN);
    expect(resolveStockThicknessIn(0)).toBe(DEFAULT_FALLBACK_STOCK_THICKNESS_IN);
    expect(resolveStockThicknessIn(-1)).toBe(DEFAULT_FALLBACK_STOCK_THICKNESS_IN);
  });
});

describe("recommendedDadoDepthIn", () => {
  it("is min(1/4, t/3)", () => {
    expect(recommendedDadoDepthIn(0.75)).toBe(0.25);
    expect(recommendedDadoDepthIn(0.5)).toBeCloseTo(0.166667, 5);
    expect(recommendedDadoDepthIn(3)).toBe(0.25);
  });
});

describe("recommendedTenonLengthPerEndIn", () => {
  it("is min(1/2 * t, 1)", () => {
    expect(recommendedTenonLengthPerEndIn(0.75)).toBe(0.375);
    expect(recommendedTenonLengthPerEndIn(2)).toBe(1);
    expect(recommendedTenonLengthPerEndIn(0.5)).toBe(0.25);
  });
});

describe("recommendedParamsForRule", () => {
  it("returns fixed quarter-back groove and panel thickness", () => {
    const r = recommendedParamsForRule("groove_quarter_back", 2);
    expect(r).toEqual({
      ruleId: "groove_quarter_back",
      grooveDepth: 0.25,
      panelThickness: 0.25,
    });
  });
  it("returns dado depth from stock", () => {
    expect(recommendedParamsForRule("dado_shelf_width", 0.75)).toEqual({
      ruleId: "dado_shelf_width",
      dadoDepth: 0.25,
    });
  });
  it("returns tenon length from stock", () => {
    expect(recommendedParamsForRule("mortise_tenon_rail", 0.75)).toEqual({
      ruleId: "mortise_tenon_rail",
      tenonLengthPerEnd: 0.375,
    });
  });
});

describe("recommendedJoinerySummaryLine", () => {
  it("is deterministic for the same inputs", () => {
    const a = recommendedJoinerySummaryLine("dado_shelf_width", 0.5, { hasSelectedPart: true, partLabel: "Shelf" });
    const b = recommendedJoinerySummaryLine("dado_shelf_width", 0.5, { hasSelectedPart: true, partLabel: "Shelf" });
    expect(a).toBe(b);
    expect(a.length).toBeGreaterThan(10);
  });
});
