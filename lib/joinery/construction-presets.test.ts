import { describe, expect, it } from "vitest";
import { buildConstructionPresetPlan } from "@/lib/joinery/construction-presets";
import type { Part } from "@/lib/project-types";

function makePart(id: string, name: string, assembly: Part["assembly"], status: Part["status"] = "solid"): Part {
  return {
    id,
    name,
    assembly,
    quantity: 1,
    finished: { t: 0.75, w: 2, l: 24 },
    rough: { t: 1.25, w: 2.5, l: 24.5, manual: false },
    material: { label: "Poplar", thicknessCategory: "4/4" },
    grainNote: "",
    status,
  };
}

describe("buildConstructionPresetPlan", () => {
  const parts: Part[] = [
    makePart("rail-1", "Top rail", "Doors"),
    makePart("stile-1", "Left stile", "Doors"),
    makePart("panel-1", "Center panel", "Doors", "panel"),
    makePart("drawer-side", "Drawer side left", "Drawers"),
    makePart("drawer-front", "Drawer front", "Drawers"),
    makePart("drawer-bottom", "Drawer bottom", "Drawers", "panel"),
    makePart("back-1", "Case back", "Back", "panel"),
    makePart("shelf-1", "Fixed shelf", "Case"),
  ];

  it("builds frame-and-panel plan with three rule applications", () => {
    const plan = buildConstructionPresetPlan(parts, "frame_and_panel");
    expect(plan.applications).toHaveLength(3);
    expect(plan.applications[0]?.ruleId).toBe("mortise_tenon_rail");
    expect(plan.applications[0]?.partIds).toContain("rail-1");
    expect(plan.applications[1]?.ruleId).toBe("mortise_tenon_stile");
    expect(plan.applications[1]?.partIds).toContain("stile-1");
    expect(plan.applications[2]?.ruleId).toBe("groove_quarter_back");
    expect(plan.applications[2]?.partIds).toContain("back-1");
  });

  it("builds dovetailed drawer box plan for drawer parts", () => {
    const plan = buildConstructionPresetPlan(parts, "dovetailed_drawer_box");
    expect(plan.applications).toHaveLength(2);
    expect(plan.applications[0]?.ruleId).toBe("groove_quarter_back");
    expect(plan.applications[0]?.partIds).toContain("drawer-bottom");
    expect(plan.applications[1]?.ruleId).toBe("dado_shelf_width");
    expect(plan.applications[1]?.partIds).toContain("drawer-side");
    expect(plan.applications[1]?.partIds).toContain("drawer-front");
  });

  it("builds grooved back case plan for back panels and shelves", () => {
    const plan = buildConstructionPresetPlan(parts, "grooved_back_case");
    expect(plan.applications).toHaveLength(2);
    expect(plan.applications[0]?.partIds).toContain("back-1");
    expect(plan.applications[1]?.partIds).toContain("shelf-1");
  });
});
