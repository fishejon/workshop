import { describe, expect, it } from "vitest";
import { makeRoughInstanceId } from "./rough-instance-id";
import { roughCutPiecesForPack, roughCutsFromParts } from "./rough-sticks";
import type { Part } from "./project-types";

function samplePart(over: Partial<Part> = {}): Part {
  return {
    id: "pid-1",
    name: "Rail",
    assembly: "Case",
    quantity: 2,
    finished: { t: 0.75, w: 3, l: 20 },
    rough: { t: 1, w: 3.5, l: 20.5, manual: false },
    material: { label: "Oak", thicknessCategory: "4/4" },
    grainNote: "",
    status: "solid",
    ...over,
  };
}

describe("roughCutsFromParts", () => {
  it("expands quantity with stable partId and instanceIndex", () => {
    const cuts = roughCutsFromParts([samplePart({ quantity: 2 })]);
    expect(cuts).toHaveLength(2);
    expect(cuts[0]).toMatchObject({ partId: "pid-1", instanceIndex: 1, lengthInches: 20.5 });
    expect(cuts[1]).toMatchObject({ partId: "pid-1", instanceIndex: 2, lengthInches: 20.5 });
  });
});

describe("roughCutPiecesForPack", () => {
  it("includes roughInstanceId on each cut piece", () => {
    const pcs = roughCutPiecesForPack([samplePart({ quantity: 2 })]);
    expect(pcs.map((p) => p.roughInstanceId)).toEqual([
      makeRoughInstanceId("pid-1", 1),
      makeRoughInstanceId("pid-1", 2),
    ]);
  });
});
