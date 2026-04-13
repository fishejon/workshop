import { describe, expect, it } from "vitest";
import type { Part, ProjectJoint } from "./project-types";
import { derivePartAssumptions } from "./part-assumptions";

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

    const assumptions = derivePartAssumptions(part, joints);
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

    const assumptions = derivePartAssumptions(part, []);
    expect(assumptions.glueUp).toMatch(/Glue-up required assumption/);
  });
});
