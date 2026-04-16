import { describe, expect, it } from "vitest";
import { packUniformStock } from "./optimize-cuts";
import { makeRoughInstanceId } from "./rough-instance-id";

describe("packUniformStock", () => {
  it("preserves roughInstanceId on each cut after reordering", () => {
    const pieces = [
      { lengthInches: 12, roughInstanceId: makeRoughInstanceId("a", 1), label: "A" },
      { lengthInches: 48, roughInstanceId: makeRoughInstanceId("b", 1), label: "B" },
      { lengthInches: 24, roughInstanceId: makeRoughInstanceId("c", 1), label: "C" },
    ];
    const boards = packUniformStock(pieces, 96, 0.125);
    const allIds = boards.flatMap((b) => b.cuts.map((c) => c.roughInstanceId).filter(Boolean));
    expect(new Set(allIds).size).toBe(3);
    expect(allIds).toContain(makeRoughInstanceId("a", 1));
    expect(allIds).toContain(makeRoughInstanceId("b", 1));
    expect(allIds).toContain(makeRoughInstanceId("c", 1));
  });
});
