"use client";

import { useMemo, useState } from "react";
import type { Part } from "@/lib/project-types";
import type { PartConnection } from "@/lib/types/joinery-connection";
import { formatShopImperial } from "@/lib/imperial";

function fmt(value: number): string {
  return formatShopImperial(value);
}

export function JoineryImpactPreview({
  parts,
  beforeParts,
  connections,
}: {
  parts: Part[];
  beforeParts: Part[];
  connections: PartConnection[];
}) {
  const [selectedConnectionId, setSelectedConnectionId] = useState<string | null>(null);

  const affectedRows = useMemo(() => {
    if (!selectedConnectionId) return [];
    const connection = connections.find((row) => row.id === selectedConnectionId);
    if (!connection) return [];
    return connection.adjustments.map((adjustment) => {
      const before = beforeParts.find((part) => part.id === adjustment.partId);
      const after = parts.find((part) => part.id === adjustment.partId);
      return { adjustment, before, after };
    });
  }, [selectedConnectionId, connections, beforeParts, parts]);

  const affectedPartCount = useMemo(() => {
    const partIds = new Set<string>();
    for (const connection of connections) {
      for (const adjustment of connection.adjustments) partIds.add(adjustment.partId);
    }
    return partIds.size;
  }, [connections]);

  return (
    <div className="space-y-3 rounded-xl border border-[var(--gl-border)] bg-[var(--gl-surface-muted)] p-3">
      <p className="text-xs font-medium tracking-widest text-[var(--gl-muted)] uppercase">Joinery impact preview</p>
      <p className="text-xs text-[var(--gl-muted)]">Select a connection to inspect before/after dimension changes.</p>

      <ul className="space-y-1">
        {connections.map((connection) => (
          <li key={connection.id}>
            <button
              type="button"
              onClick={() => setSelectedConnectionId(connection.id)}
              className={`w-full rounded-lg border px-2 py-1.5 text-left text-xs ${
                selectedConnectionId === connection.id
                  ? "border-[var(--gl-copper-bright)] bg-[var(--gl-copper)]/10 text-[var(--gl-cream-soft)]"
                  : "border-[var(--gl-border)] bg-[var(--gl-surface-inset)] text-[var(--gl-muted)]"
              }`}
            >
              <p>{connection.label ?? connection.id}</p>
              <p className="mt-0.5 text-[10px] uppercase tracking-wide">{connection.joineryMethod}</p>
            </button>
          </li>
        ))}
      </ul>

      {affectedRows.length > 0 ? (
        <div className="space-y-2 rounded-lg border border-[var(--gl-border)] bg-[var(--gl-surface-inset)] p-2">
          {affectedRows.map(({ adjustment, before, after }) => (
            <div key={`${adjustment.partId}-${adjustment.dimension}`} className="text-xs text-[var(--gl-muted)]">
              <p className="text-[var(--gl-cream-soft)]">{after?.name ?? adjustment.partId}</p>
              <p>{adjustment.reason}</p>
              <p>
                {adjustment.dimension}: {before ? fmt(valueForDimension(before, adjustment.dimension)) : "—"} →{" "}
                {after ? fmt(valueForDimension(after, adjustment.dimension)) : "—"} ({adjustment.delta >= 0 ? "+" : ""}
                {fmt(adjustment.delta)})
              </p>
            </div>
          ))}
        </div>
      ) : null}

      <div className="grid grid-cols-3 gap-2 text-center text-xs">
        <Stat label="Connections" value={connections.length} />
        <Stat label="Parts affected" value={affectedPartCount} />
        <Stat label="Adjustments" value={connections.flatMap((row) => row.adjustments).length} />
      </div>
    </div>
  );
}

function valueForDimension(part: Part, dimension: "length" | "width" | "thickness"): number {
  if (dimension === "length") return part.finished.l;
  if (dimension === "width") return part.finished.w;
  return part.finished.t;
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-[var(--gl-border)] bg-[var(--gl-surface-inset)] p-2">
      <p className="text-lg font-semibold text-[var(--gl-cream-soft)]">{value}</p>
      <p className="text-[10px] uppercase tracking-wide text-[var(--gl-muted)]">{label}</p>
    </div>
  );
}
