import { describe, expect, it } from "vitest";
import { makeRoughInstanceLaneId } from "@/lib/rough-instance-id";
import type { Part, Project } from "@/lib/project-types";
import { expectedRoughInstanceLaneIdsForYardStickPart } from "@/lib/yard-cut-progress";

function minimalProject(parts: Part[]): Project {
  return {
    id: "p1",
    version: 1,
    name: "t",
    millingAllowanceInches: 0.5,
    maxTransportLengthInches: 96,
    maxPurchasableBoardWidthInches: 8,
    wasteFactorPercent: 0,
    costRatesByGroup: {},
    parts,
    joints: [],
    connections: [],
    checkpoints: { materialAssumptionsReviewed: true, joineryReviewed: true },
    workshop: { lumberProfile: "s4s_hardwood", offcutMode: "none" },
    cutProgressByRoughInstanceId: {},
  };
}

describe("expectedRoughInstanceLaneIdsForYardStickPart", () => {
  it("splits rips differently for drawer parts when axis is width vs height", () => {
    const part: Part = {
      id: "d1",
      name: "Drawer side",
      assembly: "Drawers",
      quantity: 1,
      finished: { t: 0.75, w: 12, l: 3 },
      rough: { t: 0.75, w: 12, l: 3, manual: false },
      material: { label: "Oak", thicknessCategory: "4/4" },
      grainNote: "",
      status: "solid",
    };
    const p = minimalProject([part]);
    const byWidth = expectedRoughInstanceLaneIdsForYardStickPart(part, p, "width");
    const byHeight = expectedRoughInstanceLaneIdsForYardStickPart(part, p, "height");
    // Height axis: lineal along L=3″, rip across W=12″ on 8″ stock → 2 lanes.
    expect(byHeight).toEqual([
      makeRoughInstanceLaneId(part.id, 1, 1),
      makeRoughInstanceLaneId(part.id, 1, 2),
    ]);
    // Width axis: lineal along W=12″, rip across L=3″ → 1 lane.
    expect(byWidth).toEqual([makeRoughInstanceLaneId(part.id, 1, 1)]);
  });
});
