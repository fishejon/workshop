import { describe, expect, it } from "vitest";
import { hardwareService } from "@/lib/services/HardwareService";
import { createEmptyProject } from "@/lib/project-utils";

describe("HardwareService", () => {
  it("generates drawer hardware schedule when drawer rows exist", () => {
    const project = createEmptyProject();
    project.parts.push({
      id: "drawer-1",
      name: "Drawer box (A1)",
      assembly: "Drawers",
      quantity: 2,
      finished: { t: 0.5, w: 12, l: 18 },
      rough: { t: 0.5, w: 12, l: 18, manual: false },
      material: { label: "Maple", thicknessCategory: "4/4" },
      grainNote: "",
      status: "solid",
    });
    const schedule = hardwareService.generateSchedule(project);
    expect(schedule.some((item) => item.type === "drawer-slide")).toBe(true);
  });
});
