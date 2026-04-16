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

describe("template system performance", () => {
  it("generates parts within 100ms", () => {
    const config = getTemplateById("dresser-classic")!.defaultConfig;
    const start = performance.now();
    caseworkGenerationService.generateParts(config);
    expect(performance.now() - start).toBeLessThan(100);
  });

  it("loads 100 templates within 50ms", () => {
    localStorage.clear();
    const storage = new TemplateStorageService();
    const config = getTemplateById("dresser-classic")!.defaultConfig;
    for (let i = 0; i < 100; i++) {
      storage.saveTemplate({ ...config, id: `cfg-${i}`, name: `Template ${i}` });
    }
    const start = performance.now();
    const templates = storage.loadAllTemplates();
    const duration = performance.now() - start;
    expect(templates.length).toBe(100);
    expect(duration).toBeLessThan(50);
  });
});
