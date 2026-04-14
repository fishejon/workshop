import { describe, expect, it } from "vitest";
import { planPanelGlueUp } from "./panel-glueup";

describe("planPanelGlueUp", () => {
  it("returns exact-fit strips when panel divides cleanly", () => {
    const result = planPanelGlueUp({
      targetPanelWidth: 30,
      maxBoardWidth: 10,
      widthPrecision: 1 / 64,
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.plan.stripCount).toBe(3);
    expect(result.plan.targetStripWidths).toEqual([10, 10, 10]);
    expect(result.plan.seamPositions).toEqual([10, 20]);
    expect(result.plan.roughOversizeRecommendation.roughGlueUpWidth).toBe(31);
  });

  it("balances strips for a near-fit panel instead of leaving a sliver", () => {
    const result = planPanelGlueUp({
      targetPanelWidth: 30.25,
      maxBoardWidth: 10,
      widthPrecision: 1 / 64,
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.plan.stripCount).toBe(4);
    expect(result.plan.targetStripWidths).toEqual([7.5625, 7.5625, 7.5625, 7.5625]);
    expect(result.plan.seamPositions).toEqual([7.5625, 15.125, 22.6875]);
  });

  it("handles uneven remainder with stable seams and matching total", () => {
    const result = planPanelGlueUp({
      targetPanelWidth: 31.3,
      maxBoardWidth: 10,
      widthPrecision: 1 / 64,
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.plan.stripCount).toBe(4);
    const total = result.plan.targetStripWidths.reduce((sum, width) => sum + width, 0);
    expect(total).toBeCloseTo(31.3, 4);
    expect(Math.max(...result.plan.targetStripWidths)).toBeLessThanOrEqual(10);
    expect(result.plan.seamPositions).toHaveLength(3);
    expect(result.plan.seamPositions[0]).toBeCloseTo(7.828125, 6);
    expect(result.plan.seamPositions[2]).toBeCloseTo(23.484375, 6);
  });
});
