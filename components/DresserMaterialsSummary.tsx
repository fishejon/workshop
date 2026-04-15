"use client";

import { formatShopImperial } from "@/lib/imperial";
import type { DresserMaterialsSnapshot } from "@/components/DresserMaterialsSnapshotContext";

export function DresserMaterialsSummary({ snapshot }: { snapshot: DresserMaterialsSnapshot }) {
  const fmt = (n: number | null) => (n !== null && Number.isFinite(n) ? formatShopImperial(n) : "—");

  return (
    <section className="gl-panel border border-[var(--gl-border)] p-4">
      <p className="text-xs font-medium tracking-widest text-[var(--gl-muted)] uppercase">Dresser math</p>
      <p className="mt-1 text-xs text-[var(--gl-muted)]">
        From your Plan inputs (live). Full part tables stay in Source parts below.
      </p>
      <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
        <div className="flex justify-between gap-3 rounded-lg bg-[var(--gl-surface-muted)] px-3 py-2">
          <dt className="text-[var(--gl-muted)]">Column opening W</dt>
          <dd className="font-mono tabular-nums text-[var(--gl-cream)]">{fmt(snapshot.columnInnerWidth)}</dd>
        </div>
        <div className="flex justify-between gap-3 rounded-lg bg-[var(--gl-surface-muted)] px-3 py-2">
          <dt className="text-[var(--gl-muted)]">Drawer zone H</dt>
          <dd className="font-mono tabular-nums text-[var(--gl-cream)]">{fmt(snapshot.drawerZoneHeight)}</dd>
        </div>
        <div className="flex justify-between gap-3 rounded-lg bg-[var(--gl-surface-muted)] px-3 py-2">
          <dt className="text-[var(--gl-muted)]">Opening budget</dt>
          <dd className="font-mono tabular-nums text-[var(--gl-cream)]">{fmt(snapshot.openingBudget)}</dd>
        </div>
        <div className="flex justify-between gap-3 rounded-lg bg-[var(--gl-surface-muted)] px-3 py-2">
          <dt className="text-[var(--gl-muted)]">Opening sum</dt>
          <dd className="font-mono tabular-nums text-[var(--gl-cream)]">{fmt(snapshot.openingsSum)}</dd>
        </div>
        <div className="flex justify-between gap-3 rounded-lg bg-[var(--gl-surface-muted)] px-3 py-2">
          <dt className="text-[var(--gl-muted)]">Usable depth</dt>
          <dd className="font-mono tabular-nums text-[var(--gl-cream)]">{fmt(snapshot.depthAvailableForBox)}</dd>
        </div>
        <div className="flex justify-between gap-3 rounded-lg bg-[var(--gl-surface-muted)] px-3 py-2">
          <dt className="text-[var(--gl-muted)]">Box depth (min)</dt>
          <dd className="font-mono tabular-nums text-[var(--gl-cream)]">{fmt(snapshot.resolvedBoxDepth)}</dd>
        </div>
      </dl>
      <details className="mt-3 rounded-lg border border-[var(--gl-border)] bg-[var(--gl-surface-inset)] px-3 py-2 text-xs text-[var(--gl-muted)]">
        <summary className="cursor-pointer font-medium text-[var(--gl-cream-soft)]">Slide + joinery deductions</summary>
        <p className="mt-2">
          Width deduction (slide + joinery): <strong className="text-[var(--gl-cream)]">{fmt(snapshot.totalWidthDeduction)}</strong>
        </p>
        <p>
          Height deduction (slide + joinery): <strong className="text-[var(--gl-cream)]">{fmt(snapshot.totalHeightDeduction)}</strong>
        </p>
      </details>
    </section>
  );
}
