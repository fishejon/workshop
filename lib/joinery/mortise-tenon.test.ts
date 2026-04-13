import { describe, expect, it } from "vitest";
import { applyMortiseTenonRail, applyMortiseTenonStile } from "./mortise-tenon";

describe("applyMortiseTenonRail", () => {
  it("extends finished L by 2× tenon length", () => {
    const r = applyMortiseTenonRail({ tenonLengthPerEnd: 1 });
    expect(r.finishedDimensionDeltas).toEqual({ t: 0, w: 0, l: 2 });
  });
});

describe("applyMortiseTenonStile", () => {
  it("shortens finished L by 2× tenon length", () => {
    const r = applyMortiseTenonStile({ tenonLengthPerEnd: 0.75 });
    expect(r.finishedDimensionDeltas).toEqual({ t: 0, w: 0, l: -1.5 });
  });
});
