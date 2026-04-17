"use client";

import { useState } from "react";

export function StockTypeSelector({
  value,
  onChange,
}: {
  value: "surfaced" | "rough";
  onChange: (type: "surfaced" | "rough") => void;
}) {
  const [showInfo, setShowInfo] = useState(false);

  return (
    <div className="rounded-xl border border-[var(--gl-border)] bg-[var(--gl-surface-muted)] p-3">
      <div className="mb-2 flex items-center justify-between">
        <p className="text-xs font-medium tracking-widest text-[var(--gl-muted)] uppercase">Stock type</p>
        <button
          type="button"
          onClick={() => setShowInfo((prev) => !prev)}
          className="text-xs text-[var(--gl-copper-bright)]"
        >
          {showInfo ? "Hide details" : "Show details"}
        </button>
      </div>
      <div className="grid gap-2 sm:grid-cols-2">
        {(["surfaced", "rough"] as const).map((type) => (
          <button
            key={type}
            type="button"
            className={`rounded-lg border px-3 py-2 text-left text-xs ${
              value === type
                ? "border-[var(--gl-copper)] bg-[var(--gl-copper)]/15 text-[var(--gl-cream-soft)]"
                : "border-[var(--gl-border)] text-[var(--gl-muted)]"
            }`}
            onClick={() => onChange(type)}
          >
            <p className="font-medium">{type === "surfaced" ? "Surfaced (S4S)" : "Rough sawn"}</p>
            <p className="mt-1">
              {type === "surfaced"
                ? "Ready to use, less milling, usually higher price."
                : "Needs milling, often lower price per board foot."}
            </p>
          </button>
        ))}
      </div>
      {showInfo ? (
        <ul className="mt-2 list-disc space-y-1 pl-4 text-xs text-[var(--gl-muted)]">
          {value === "surfaced" ? (
            <>
              <li>Assumes final thickness/width at purchase.</li>
              <li>Lower milling time, easier first build.</li>
            </>
          ) : (
            <>
              <li>Adds surfacing allowance for planning quantities.</li>
              <li>Requires jointer/planer workflow.</li>
            </>
          )}
        </ul>
      ) : null}
    </div>
  );
}
