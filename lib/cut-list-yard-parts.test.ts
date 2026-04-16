import { describe, expect, it } from "vitest";
import { partsForHardwoodYardCutList } from "@/lib/cut-list-yard-parts";
import type { Part, Project } from "@/lib/project-types";

function minimalProject(parts: Part[], omit?: boolean): Project {
  return {
    id: "p1",
    version: 1,
    name: "t",
    millingAllowanceInches: 0.5,
    maxTransportLengthInches: 96,
    maxPurchasableBoardWidthInches: 12,
    wasteFactorPercent: 0,
    costRatesByGroup: {},
    parts,
    joints: [],
    connections: [],
    checkpoints: { materialAssumptionsReviewed: true, joineryReviewed: true },
    workshop: { lumberProfile: "s4s_hardwood", offcutMode: "none" },
    ...(omit ? { omitDresserCaseBackFromHardwoodCutList: true } : {}),
  };
}

const caseBack: Part = {
  id: "back-1",
  name: "Case back",
  assembly: "Back",
  quantity: 1,
  finished: { t: 0.25, w: 10, l: 20 },
  rough: { t: 0.25, w: 10, l: 20, manual: false },
  material: { label: "Ply", thicknessCategory: "1/4 ply" },
  grainNote: "",
  status: "panel",
};

describe("partsForHardwoodYardCutList", () => {
  it("returns all parts by default", () => {
    const p = minimalProject([caseBack]);
    expect(partsForHardwoodYardCutList(p)).toHaveLength(1);
  });

  it("drops dresser case back when flag is set", () => {
    const p = minimalProject([caseBack], true);
    expect(partsForHardwoodYardCutList(p)).toHaveLength(0);
  });

  it("keeps other back assembly parts", () => {
    const other: Part = { ...caseBack, id: "b2", name: "Bookcase back" };
    const p = minimalProject([caseBack, other], true);
    expect(partsForHardwoodYardCutList(p)).toEqual([other]);
  });
});
