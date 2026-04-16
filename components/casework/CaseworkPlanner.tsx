"use client";

import { useEffect, useMemo, useState } from "react";
import type {
  ConfigurableField,
  FurnitureConfig,
  FurnitureTemplate,
} from "@/lib/types/furniture-config";
import { useCaseworkGeneration } from "@/lib/hooks/useCaseworkGeneration";

function getAtPath(obj: unknown, path: string): unknown {
  return path.split(".").reduce<unknown>((acc, part) => {
    if (acc && typeof acc === "object" && part in acc) return (acc as Record<string, unknown>)[part];
    return undefined;
  }, obj);
}

function updateAtPath<T extends Record<string, unknown>>(obj: T, path: string, value: unknown): T {
  const parts = path.split(".");
  const next: Record<string, unknown> = { ...obj };
  let cur: Record<string, unknown> = next;
  for (let i = 0; i < parts.length - 1; i++) {
    const key = parts[i]!;
    const existing = cur[key];
    const copy = existing && typeof existing === "object" ? { ...(existing as Record<string, unknown>) } : {};
    cur[key] = copy;
    cur = copy;
  }
  const leaf = parts[parts.length - 1]!;
  cur[leaf] = value;
  return next as T;
}

export function CaseworkPlanner({
  template,
  initialConfig,
  onConfigChange,
}: {
  template: FurnitureTemplate;
  initialConfig?: FurnitureConfig;
  onConfigChange: (config: FurnitureConfig) => void;
}) {
  const [config, setConfig] = useState<FurnitureConfig>(initialConfig ?? template.defaultConfig);
  const { parts, openings, validation } = useCaseworkGeneration(config);

  function change(path: string, value: unknown) {
    const updated = updateAtPath(config as unknown as Record<string, unknown>, path, value) as unknown as FurnitureConfig;
    setConfig(updated);
  }

  useEffect(() => {
    onConfigChange(config);
  }, [config, onConfigChange]);

  const summary = useMemo(
    () => `${parts.length} parts · ${openings.length} openings · ${validation.errors.length} validation issue(s)`,
    [parts.length, openings.length, validation.errors.length]
  );

  return (
    <div className="space-y-4 rounded-xl border border-[var(--gl-border)] bg-[var(--gl-surface)] p-4">
      <div>
        <p className="text-xs font-medium tracking-widest text-[var(--gl-muted)] uppercase">{template.type} template</p>
        <h3 className="font-display text-lg text-[var(--gl-cream)]">{template.name}</h3>
        <p className="text-sm text-[var(--gl-muted)]">{template.description}</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {template.configurableFields.map((field) => (
          <ConfigurableFieldInput
            key={field.path}
            field={field}
            value={getAtPath(config, field.path)}
            onChange={(value) => change(field.path, value)}
          />
        ))}
      </div>

      {!validation.isValid ? (
        <div className="rounded-lg border border-[var(--gl-warning)]/40 bg-[var(--gl-warning-bg)] p-3">
          <p className="text-xs font-medium text-[var(--gl-warning)]">Configuration issues</p>
          <ul className="mt-1 list-disc space-y-1 pl-4 text-xs text-[var(--gl-warning)]">
            {validation.errors.map((error) => (
              <li key={error}>{error}</li>
            ))}
          </ul>
        </div>
      ) : null}

      <p className="text-xs text-[var(--gl-muted)]">{summary}</p>
    </div>
  );
}

function ConfigurableFieldInput({
  field,
  value,
  onChange,
}: {
  field: ConfigurableField;
  value: unknown;
  onChange: (value: unknown) => void;
}) {
  if (field.type === "number") {
    return (
      <label className="block text-xs text-[var(--gl-muted)]">
        {field.label}
        <input
          type="number"
          min={field.min}
          max={field.max}
          step={field.step}
          value={typeof value === "number" ? value : Number(field.defaultValue)}
          onChange={(e) => onChange(Number(e.target.value))}
          className="input-wood mt-1 w-full"
        />
      </label>
    );
  }
  if (field.type === "select") {
    return (
      <label className="block text-xs text-[var(--gl-muted)]">
        {field.label}
        <select
          value={String(value ?? field.defaultValue)}
          onChange={(e) => onChange(e.target.value)}
          className="input-wood mt-1 w-full"
        >
          {(field.options ?? []).map((opt) => (
            <option key={String(opt.value)} value={String(opt.value)}>
              {opt.label}
            </option>
          ))}
        </select>
      </label>
    );
  }
  if (field.type === "boolean") {
    return (
      <label className="flex items-center gap-2 text-xs text-[var(--gl-muted)]">
        <input
          type="checkbox"
          checked={Boolean(value)}
          onChange={(e) => onChange(e.target.checked)}
        />
        {field.label}
      </label>
    );
  }
  return (
    <label className="block text-xs text-[var(--gl-muted)]">
      {field.label}
      <input
        type="text"
        value={String(value ?? "")}
        onChange={(e) => onChange(e.target.value)}
        className="input-wood mt-1 w-full"
      />
    </label>
  );
}
