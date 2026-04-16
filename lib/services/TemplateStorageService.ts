import type { FurnitureConfig } from "@/lib/types/furniture-config";

export type SavedTemplate = {
  id: string;
  config: FurnitureConfig;
  createdAt: string;
  updatedAt: string;
  thumbnail?: string;
  tags?: string[];
};

const STORAGE_KEY = "grainline-templates";

function newId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `tpl-${Math.random().toString(36).slice(2)}`;
}

export class TemplateStorageService {
  private storage(): Storage | null {
    if (typeof globalThis !== "undefined" && "localStorage" in globalThis && globalThis.localStorage) {
      return globalThis.localStorage;
    }
    return null;
  }

  saveTemplate(config: FurnitureConfig): SavedTemplate {
    const now = new Date().toISOString();
    const template: SavedTemplate = {
      id: newId(),
      config,
      createdAt: now,
      updatedAt: now,
    };
    const all = this.loadAllTemplates();
    all.push(template);
    this.persist(all);
    return template;
  }

  loadAllTemplates(): SavedTemplate[] {
    const storage = this.storage();
    if (!storage) return [];
    const raw = storage.getItem(STORAGE_KEY);
    if (!raw) return [];
    try {
      const parsed = JSON.parse(raw) as SavedTemplate[];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  loadTemplate(id: string): SavedTemplate | undefined {
    return this.loadAllTemplates().find((template) => template.id === id);
  }

  updateTemplate(id: string, config: FurnitureConfig): void {
    const all = this.loadAllTemplates().map((template) =>
      template.id === id ? { ...template, config, updatedAt: new Date().toISOString() } : template
    );
    this.persist(all);
  }

  duplicateTemplate(id: string): SavedTemplate | undefined {
    const original = this.loadTemplate(id);
    if (!original) return undefined;
    const now = new Date().toISOString();
    const duplicated: SavedTemplate = {
      ...original,
      id: newId(),
      config: { ...original.config, id: newId(), name: `${original.config.name} (Copy)` },
      createdAt: now,
      updatedAt: now,
    };
    const all = this.loadAllTemplates();
    all.push(duplicated);
    this.persist(all);
    return duplicated;
  }

  deleteTemplate(id: string): void {
    this.persist(this.loadAllTemplates().filter((template) => template.id !== id));
  }

  exportToFile(templateIds?: string[]): string {
    const all = this.loadAllTemplates();
    const selected = templateIds ? all.filter((template) => templateIds.includes(template.id)) : all;
    return JSON.stringify(selected, null, 2);
  }

  importFromFile(json: string): number {
    try {
      const parsed = JSON.parse(json) as SavedTemplate[];
      if (!Array.isArray(parsed)) return 0;
      const all = this.loadAllTemplates();
      const now = new Date().toISOString();
      for (const row of parsed) {
        all.push({
          ...row,
          id: newId(),
          config: { ...row.config, id: newId() },
          createdAt: now,
          updatedAt: now,
        });
      }
      this.persist(all);
      return parsed.length;
    } catch {
      return 0;
    }
  }

  private persist(templates: SavedTemplate[]) {
    const storage = this.storage();
    if (!storage) return;
    storage.setItem(STORAGE_KEY, JSON.stringify(templates));
  }
}

export const templateStorageService = new TemplateStorageService();
