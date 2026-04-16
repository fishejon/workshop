import { describe, expect, it } from "vitest";
import {
  buildPlannerGroupedShopLabels,
  buildRoughInstanceLabelMap,
  indexToGroupPrefix,
} from "./shop-labels";
import type { Part } from "./project-types";
import { makeRoughInstanceId } from "./rough-instance-id";

function part(p: Partial<Part> & Pick<Part, "id" | "name" | "assembly">): Part {
  return {
    quantity: 1,
    finished: { t: 1, w: 2, l: 10 },
    rough: { t: 1, w: 2, l: 10.5, manual: false },
    material: { label: "X", thicknessCategory: "4/4" },
    grainNote: "",
    status: "solid",
    ...p,
  };
}

describe("indexToGroupPrefix", () => {
  it("maps 0..25 to A..Z and 26 to AA", () => {
    expect(indexToGroupPrefix(0)).toBe("A");
    expect(indexToGroupPrefix(25)).toBe("Z");
    expect(indexToGroupPrefix(26)).toBe("AA");
  });
});

describe("buildRoughInstanceLabelMap", () => {
  it("orders by assembly id then name then part id and assigns grouped labels", () => {
    const parts: Part[] = [
      part({ id: "z", name: "Zed", assembly: "Other" }),
      part({ id: "a", name: "Alpha", assembly: "Case" }),
      part({ id: "b", name: "Beta", assembly: "Case" }),
    ];
    const m = buildRoughInstanceLabelMap(parts);
    expect(m.get(makeRoughInstanceId("a", 1))).toBe("A-1");
    expect(m.get(makeRoughInstanceId("b", 1))).toBe("B-1");
    expect(m.get(makeRoughInstanceId("z", 1))).toBe("C-1");
  });

  it("groups multiple rough pieces of the same part line under one letter", () => {
    const parts: Part[] = [part({ id: "p1", name: "Stile", assembly: "Case", quantity: 2 })];
    const m = buildRoughInstanceLabelMap(parts);
    expect(m.get(makeRoughInstanceId("p1", 1))).toBe("A-1");
    expect(m.get(makeRoughInstanceId("p1", 2))).toBe("A-2");
  });
});

describe("buildPlannerGroupedShopLabels", () => {
  it("labels planner row instances in qty order within one group", () => {
    const m = buildPlannerGroupedShopLabels([
      { rowId: "row-a", qty: 1 },
      { rowId: "row-b", qty: 2 },
    ]);
    expect(m.get(makeRoughInstanceId("row-a", 1))).toBe("A-1");
    expect(m.get(makeRoughInstanceId("row-b", 1))).toBe("B-1");
    expect(m.get(makeRoughInstanceId("row-b", 2))).toBe("B-2");
  });
});
