import { describe, expect, it } from "vitest";
import { createEmptyProject } from "@/lib/project-utils";
import { getPresetById } from "@/lib/presets/joinery-presets";
import { presetApplicationService } from "@/lib/services/PresetApplicationService";

describe("PresetApplicationService", () => {
  it("applies frame-and-panel preset when matching parts exist", () => {
    const project = createEmptyProject();
    project.parts.push(
      {
        id: "stile-1",
        name: "Left stile",
        assembly: "Case",
        quantity: 1,
        finished: { t: 0.75, w: 3, l: 30 },
        rough: { t: 0.875, w: 3.25, l: 30.25, manual: false },
        material: { label: "Oak", thicknessCategory: "4/4" },
        grainNote: "",
        status: "solid",
      },
      {
        id: "rail-1",
        name: "Top rail",
        assembly: "Case",
        quantity: 1,
        finished: { t: 0.75, w: 3, l: 18 },
        rough: { t: 0.875, w: 3.25, l: 18.25, manual: false },
        material: { label: "Oak", thicknessCategory: "4/4" },
        grainNote: "",
        status: "solid",
      },
      {
        id: "panel-1",
        name: "Center panel",
        assembly: "Back",
        quantity: 1,
        finished: { t: 0.25, w: 16, l: 24 },
        rough: { t: 0.25, w: 16, l: 24, manual: false },
        material: { label: "Plywood", thicknessCategory: "1/4 ply" },
        grainNote: "",
        status: "panel",
      }
    );
    const preset = getPresetById("frame-and-panel-carcass");
    expect(preset).toBeDefined();
    const result = presetApplicationService.applyPreset(project, preset!);
    expect(result.connections.length).toBeGreaterThan(0);
  });
});
