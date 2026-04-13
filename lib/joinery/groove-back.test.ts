import { describe, expect, it } from "vitest";
import { applyGrooveForQuarterBackPanel } from "./groove-back";

describe("applyGrooveForQuarterBackPanel", () => {
  it("subtracts 2× groove depth from W and L", () => {
    const r = applyGrooveForQuarterBackPanel({ grooveDepth: 0.25, panelThickness: 0.25 });
    expect(r.finishedDimensionDeltas).toEqual({ t: 0, w: -0.5, l: -0.5 });
    expect(r.explanation).toContain("0.250");
  });
});
