import { beforeEach, describe, expect, it } from "vitest";
import { TemplateStorageService } from "@/lib/services/TemplateStorageService";
import { getTemplateById } from "@/lib/templates/furniture-templates";

describe("TemplateStorageService", () => {
  let service: TemplateStorageService;
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

  beforeEach(() => {
    localStorage.clear();
    service = new TemplateStorageService();
  });

  it("saves and loads templates", () => {
    const config = getTemplateById("dresser-classic")!.defaultConfig;
    const saved = service.saveTemplate(config);
    const loaded = service.loadTemplate(saved.id);
    expect(loaded?.config.name).toBe(config.name);
  });

  it("duplicates with a new id", () => {
    const config = getTemplateById("console-table")!.defaultConfig;
    const saved = service.saveTemplate(config);
    const duplicate = service.duplicateTemplate(saved.id);
    expect(duplicate).toBeDefined();
    expect(duplicate?.id).not.toBe(saved.id);
  });

  it("imports and exports templates", () => {
    service.saveTemplate(getTemplateById("dresser-classic")!.defaultConfig);
    const exported = service.exportToFile();
    localStorage.clear();
    const count = service.importFromFile(exported);
    expect(count).toBe(1);
    expect(service.loadAllTemplates()).toHaveLength(1);
  });
});
