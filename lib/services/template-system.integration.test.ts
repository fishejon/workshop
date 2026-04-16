import { describe, expect, it } from "vitest";
import { caseworkGenerationService } from "@/lib/services/CaseworkGenerationService";
import { TemplateStorageService } from "@/lib/services/TemplateStorageService";
import { getTemplateById } from "@/lib/templates/furniture-templates";

const memory = new Map<string, string>();
if (!("localStorage" in globalThis)) {
  Object.defineProperty(globalThis, "localStorage", {
    value: {
      getItem: (k: string) => memory.get(k) ?? null,
      setItem: (k: string, v: string) => memory.set(k, v),
      removeItem: (k: string) => memory.delete(k),
      clear: () => memory.clear(),
    },
    writable: true,
  });
}

describe("template system integration", () => {
  it("generates valid parts for dresser, console, and bookshelf", () => {
    const dresserParts = caseworkGenerationService.generateParts(getTemplateById("dresser-classic")!.defaultConfig);
    const consoleParts = caseworkGenerationService.generateParts(getTemplateById("console-table")!.defaultConfig);
    const bookshelfParts = caseworkGenerationService.generateParts(getTemplateById("bookshelf-adjustable")!.defaultConfig);

    expect(dresserParts.length).toBeGreaterThan(8);
    expect(consoleParts.length).toBeGreaterThan(4);
    expect(bookshelfParts.some((part) => part.name.includes("Shelf"))).toBe(true);
  });

  it("supports save/load/duplicate workflow", () => {
    localStorage.clear();
    const service = new TemplateStorageService();
    const saved = service.saveTemplate(getTemplateById("console-table")!.defaultConfig);
    const loaded = service.loadTemplate(saved.id);
    expect(loaded).toBeDefined();
    const duplicate = service.duplicateTemplate(saved.id);
    expect(duplicate?.config.name).toContain("(Copy)");
  });
});
