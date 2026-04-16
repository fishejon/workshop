import { describe, expect, it } from "vitest";
import {
  FURNITURE_TEMPLATES,
  getTemplateById,
  getTemplatesByType,
} from "@/lib/templates/furniture-templates";

describe("furniture templates", () => {
  it("registers core templates", () => {
    expect(FURNITURE_TEMPLATES.length).toBeGreaterThanOrEqual(3);
    expect(getTemplateById("dresser-classic")?.type).toBe("dresser");
    expect(getTemplateById("console-table")?.type).toBe("console");
    expect(getTemplateById("bookshelf-adjustable")?.type).toBe("bookshelf");
  });

  it("filters templates by type", () => {
    const consoleTemplates = getTemplatesByType("console");
    expect(consoleTemplates.length).toBeGreaterThan(0);
    expect(consoleTemplates.every((row) => row.type === "console")).toBe(true);
  });
});
