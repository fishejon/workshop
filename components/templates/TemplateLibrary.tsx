"use client";

import { useMemo, useState } from "react";
import { templateStorageService, type SavedTemplate } from "@/lib/services/TemplateStorageService";
import type { FurnitureConfig, FurnitureType } from "@/lib/types/furniture-config";

export function TemplateLibrary({
  onSelectTemplate,
  onClose,
}: {
  onSelectTemplate: (config: FurnitureConfig) => void;
  onClose: () => void;
}) {
  const [templates, setTemplates] = useState<SavedTemplate[]>(() => templateStorageService.loadAllTemplates());
  const [filterType, setFilterType] = useState<"all" | FurnitureType>("all");
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    return templates.filter((template) => {
      if (filterType !== "all" && template.config.type !== filterType) return false;
      if (!query.trim()) return true;
      return template.config.name.toLowerCase().includes(query.trim().toLowerCase());
    });
  }, [templates, filterType, query]);

  function refresh() {
    setTemplates(templateStorageService.loadAllTemplates());
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="max-h-[85vh] w-full max-w-4xl overflow-hidden rounded-xl border border-[var(--gl-border)] bg-[var(--gl-surface)]">
        <div className="flex items-center justify-between border-b border-[var(--gl-border)] p-4">
          <h2 className="font-display text-xl text-[var(--gl-cream)]">Template library</h2>
          <div className="flex gap-2">
            <button type="button" className="rounded-md border border-[var(--gl-border)] px-3 py-1.5 text-xs text-[var(--gl-cream-soft)]" onClick={onClose}>
              Close
            </button>
          </div>
        </div>
        <div className="space-y-3 border-b border-[var(--gl-border)] p-4">
          <input
            className="input-wood w-full"
            placeholder="Search templates..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <div className="flex flex-wrap gap-2">
            {(["all", "dresser", "console", "sideboard", "bookshelf", "cabinet"] as const).map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => setFilterType(type)}
                className={`rounded-md px-2 py-1 text-xs ${
                  filterType === type
                    ? "bg-[var(--gl-copper)]/30 text-[var(--gl-cream)]"
                    : "border border-[var(--gl-border)] text-[var(--gl-muted)]"
                }`}
              >
                {type}
              </button>
            ))}
          </div>
        </div>
        <div className="max-h-[55vh] overflow-y-auto p-4">
          {filtered.length === 0 ? (
            <p className="text-sm text-[var(--gl-muted)]">No templates found.</p>
          ) : (
            <div className="grid gap-3 md:grid-cols-2">
              {filtered.map((template) => (
                <article key={template.id} className="rounded-lg border border-[var(--gl-border)] bg-[var(--gl-surface-muted)] p-3">
                  <p className="text-sm font-medium text-[var(--gl-cream-soft)]">{template.config.name}</p>
                  <p className="mt-1 text-xs text-[var(--gl-muted)]">
                    {template.config.type} · {template.config.dimensions.height} in H × {template.config.dimensions.width} in W ×{" "}
                    {template.config.dimensions.depth} in D
                  </p>
                  <div className="mt-3 flex gap-2">
                    <button
                      type="button"
                      className="rounded-md border border-[var(--gl-border)] px-2 py-1 text-xs text-[var(--gl-cream-soft)]"
                      onClick={() => {
                        onSelectTemplate(template.config);
                        onClose();
                      }}
                    >
                      Load
                    </button>
                    <button
                      type="button"
                      className="rounded-md border border-[var(--gl-border)] px-2 py-1 text-xs text-[var(--gl-muted)]"
                      onClick={() => {
                        templateStorageService.duplicateTemplate(template.id);
                        refresh();
                      }}
                    >
                      Duplicate
                    </button>
                    <button
                      type="button"
                      className="rounded-md border border-[var(--gl-danger)]/40 px-2 py-1 text-xs text-[var(--gl-danger)]"
                      onClick={() => {
                        templateStorageService.deleteTemplate(template.id);
                        refresh();
                      }}
                    >
                      Delete
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
