import { describe, expect, it } from "vitest";
import { caseworkGenerationService } from "@/lib/services/CaseworkGenerationService";
import {
  getTemplateById,
} from "@/lib/templates/furniture-templates";

describe("CaseworkGenerationService", () => {
  it("generates dresser parts with drawers", () => {
    const config = getTemplateById("dresser-classic")!.defaultConfig;
    const parts = caseworkGenerationService.generateParts(config);
    expect(parts.some((part) => part.assembly === "Case")).toBe(true);
    expect(parts.some((part) => part.assembly === "Drawers")).toBe(true);
  });

  it("generates console parts with face frame", () => {
    const config = getTemplateById("console-table")!.defaultConfig;
    const parts = caseworkGenerationService.generateParts(config);
    expect(parts.some((part) => part.name.includes("Face frame"))).toBe(true);
  });

  it("calculates openings for bookshelf", () => {
    const config = getTemplateById("bookshelf-adjustable")!.defaultConfig;
    const openings = caseworkGenerationService.calculateOpenings(config);
    expect(openings.length).toBeGreaterThan(0);
    expect(openings.some((opening) => opening.type === "shelf")).toBe(true);
  });
});
