import { describe, expect, it } from "vitest";
import { createEmptyProject } from "@/lib/project-utils";
import { buyListService } from "@/lib/services/BuyListService";

describe("BuyListService", () => {
  it("builds grouped rows and scenarios from project data", () => {
    const project = createEmptyProject();
    project.parts.push({
      id: "p1",
      name: "Side",
      assembly: "Case",
      quantity: 2,
      finished: { t: 0.75, w: 12, l: 30 },
      rough: { t: 0.875, w: 12.5, l: 30.5, manual: false },
      material: { label: "Hard Maple", thicknessCategory: "4/4" },
      grainNote: "",
      status: "solid",
    });

    const groups = buyListService.buildGroups(project);
    const rows = buyListService.buildLumberRows(project);
    const scenarios = buyListService.buildPurchaseScenarios(project);

    expect(groups.length).toBeGreaterThan(0);
    expect(rows.length).toBeGreaterThan(0);
    expect(scenarios.length).toBeGreaterThan(0);
  });
});
