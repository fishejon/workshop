import { describe, expect, it } from "vitest";
import type { Part, ProjectJoint } from "./project-types";
import { derivePartAssumptions, derivePartAssumptionsDetailed } from "./part-assumptions";

describe("derivePartAssumptions", () => {
  it("reports joinery change history when a joint changed the part", () => {
    const part: Part = {
      id: "p-back",
      name: "Case back",
      assembly: "Back",
      quantity: 1,
      finished: { t: 0.25, w: 18, l: 24 },
      rough: { t: 0.25, w: 18, l: 24, manual: true },
      material: { label: "Baltic birch", thicknessCategory: "1/4 ply" },
      grainNote: "",
      status: "panel",
    };
    const joints: ProjectJoint[] = [
      {
        id: "j-1",
        ruleId: "groove_back_panel",
        primaryPartId: "p-back",
        params: { grooveDepth: 0.25, panelThickness: 0.25 },
        explanation: "Fixture joinery event",
        finishedBefore: { t: 0.25, w: 18.5, l: 24.5 },
        finishedAfter: { t: 0.25, w: 18, l: 24 },
      },
    ];

    const assumptions = derivePartAssumptions(part, joints, { maxPurchasableBoardWidthInches: 20 });
    expect(assumptions.joinery).toMatch(/Joinery-adjusted finished size/);
  });

  it("flags glue-up requirement for wide panels", () => {
    const part: Part = {
      id: "p-wide-panel",
      name: "Wide panel",
      assembly: "Back",
      quantity: 1,
      finished: { t: 0.75, w: 24, l: 30 },
      rough: { t: 0.75, w: 24, l: 30, manual: true },
      material: { label: "White oak", thicknessCategory: "4/4" },
      grainNote: "",
      status: "panel",
    };

    const assumptions = derivePartAssumptions(part, [], { maxPurchasableBoardWidthInches: 20 });
    expect(assumptions.glueUp).toMatch(/Glue-up required assumption/);
    expect(assumptions.glueUp).toMatch(/strips:/);
    expect(assumptions.glueUp).toMatch(/seams @/);
  });

  it("treats a wide panel as single-board when max purchasable width allows", () => {
    const part: Part = {
      id: "p-panel",
      name: "Panel",
      assembly: "Back",
      quantity: 1,
      finished: { t: 0.75, w: 24, l: 30 },
      rough: { t: 0.75, w: 24, l: 30, manual: true },
      material: { label: "White oak", thicknessCategory: "4/4" },
      grainNote: "",
      status: "panel",
    };
    const assumptions = derivePartAssumptions(part, [], { maxPurchasableBoardWidthInches: 30 });
    expect(assumptions.glueUp).toMatch(/Single-board panel assumption/);
  });

  it("uses material-group board width override for glue-up planning provenance", () => {
    const part: Part = {
      id: "p-panel-override",
      name: "Panel",
      assembly: "Back",
      quantity: 1,
      finished: { t: 0.75, w: 24, l: 30 },
      rough: { t: 0.75, w: 24, l: 30, manual: true },
      material: { label: "White oak", thicknessCategory: "4/4" },
      grainNote: "",
      status: "panel",
    };
    const detailed = derivePartAssumptionsDetailed(part, [], {
      maxPurchasableBoardWidthInches: 30,
      stockWidthByMaterialGroup: {
        "White oak||4/4": 8,
      },
    });
    expect(detailed.glueUpPlan.maxBoardWidthInches).toBe(8);
    expect(detailed.glueUpPlan.boardWidthSource).toBe("material_override");
    expect(detailed.glueUpPlan.stripCount).toBe(3);
    expect(detailed.assumptions.glueUp).toMatch(/source: material override/);
  });
});
