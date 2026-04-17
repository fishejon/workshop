import { describe, expect, it } from "vitest";
import { partGenerationService } from "@/lib/services/PartGenerationService";

describe("PartGenerationService", () => {
  it("generates both case and drawer assemblies for a valid dresser config", () => {
    const parts = partGenerationService.generateDresserParts({
      outerWidth: 48,
      outerHeight: 34,
      outerDepth: 18,
      materialThickness: 0.75,
      dividerThickness: 0.75,
      topPanelThickness: 0.75,
      maxPurchasableBoardWidth: 10,
      columnCount: 2,
      rowCount: 3,
      rowOpeningHeightsInches: [10, 10, 10.25],
      kickHeight: 0,
      topAssemblyHeight: 1.5,
      bottomPanelThickness: 0.75,
      railBetweenDrawers: 0.75,
      backThickness: 0.25,
      rearClearanceForBox: 0.5,
      slideLengthNominal: 16,
      slideWidthClearance: 1,
      slideHeightClearance: 0.25,
      drawerJoineryWidthAllowance: 0,
      drawerJoineryHeightAllowance: 0,
    });

    const assemblies = new Set(parts.map((p) => p.assembly));
    expect(parts.length).toBeGreaterThan(0);
    expect(assemblies.has("Case")).toBe(true);
    expect(assemblies.has("Drawers")).toBe(true);
  });

  it("uses dovetail stock thickness on drawer sides when preset is dovetail", () => {
    const parts = partGenerationService.generateDresserParts({
      outerWidth: 48,
      outerHeight: 34,
      outerDepth: 18,
      materialThickness: 0.75,
      dividerThickness: 0.75,
      topPanelThickness: 0.75,
      maxPurchasableBoardWidth: 10,
      columnCount: 2,
      rowCount: 3,
      rowOpeningHeightsInches: [10, 10, 10.25],
      kickHeight: 0,
      topAssemblyHeight: 1.5,
      bottomPanelThickness: 0.75,
      railBetweenDrawers: 0.75,
      backThickness: 0.25,
      rearClearanceForBox: 0.5,
      slideLengthNominal: 16,
      slideWidthClearance: 1,
      slideHeightClearance: 0.25,
      drawerJoineryWidthAllowance: 0,
      drawerJoineryHeightAllowance: 0,
      drawerJoineryPreset: "dovetail_full_overlap",
    });
    const side = parts.find((p) => p.name.startsWith("Drawer side"));
    expect(side?.finished.t).toBe(0.75);
  });
});
