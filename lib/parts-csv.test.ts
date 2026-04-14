import { describe, expect, it } from "vitest";
import { partsToCsv } from "./parts-csv";
import type { Part, ProjectJoint } from "./project-types";

describe("partsToCsv", () => {
  it("exports normalized assumptions and provenance columns", () => {
    const panel: Part = {
      id: "panel-1",
      name: "Back panel",
      assembly: "Back",
      quantity: 1,
      finished: { t: 0.25, w: 24, l: 30 },
      rough: { t: 0.25, w: 24, l: 30, manual: false },
      material: { label: "White oak", thicknessCategory: "4/4" },
      grainNote: "",
      status: "panel",
    };
    const joints: ProjectJoint[] = [
      {
        id: "j1",
        ruleId: "groove_quarter_back",
        primaryPartId: "panel-1",
        params: { grooveDepth: 0.25, panelThickness: 0.25 },
        explanation: "fixture",
        finishedBefore: { t: 0.25, w: 24.5, l: 30.5 },
        finishedAfter: { t: 0.25, w: 24, l: 30 },
      },
    ];
    const csv = partsToCsv([panel], joints, {
      maxPurchasableBoardWidthInches: 20,
      stockWidthByMaterialGroup: { "White oak||4/4": 8 },
    });
    const [header, row] = csv.split("\n");
    expect(header).toContain("provenance_summary");
    expect(header).toContain("glue_up_board_width_source");
    expect(row).toContain("material_override");
    expect(row).toContain("Joinery-adjusted finished size");
    expect(row).toContain("Glue-up required assumption");
  });
});
