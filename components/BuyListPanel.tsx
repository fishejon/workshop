"use client";

import { useMemo } from "react";
import { useProject } from "@/components/ProjectContext";
import { groupPartsByMaterial } from "@/lib/board-feet";
import { formatShopImperial } from "@/lib/imperial";
import { DresserMaterialsSummary } from "@/components/DresserMaterialsSummary";
import { useDresserMaterialsSnapshot } from "@/components/DresserMaterialsSnapshotContext";
import { buildLumberVehicleRows } from "@/lib/lumber-vehicle-summary";

export function BuyListPanel({ showDresserSummary = false }: { showDresserSummary?: boolean }) {
  const { project } = useProject();
  const dresserSnapshot = useDresserMaterialsSnapshot();
  const groups = useMemo(() => groupPartsByMaterial(project.parts, project.wasteFactorPercent), [project.parts, project.wasteFactorPercent]);
  const lumberRows = useMemo(
    () =>
      buildLumberVehicleRows(groups, project.parts, project.maxTransportLengthInches, {
        maxPurchasableBoardWidthInches: project.maxPurchasableBoardWidthInches,
        stockWidthByMaterialGroup: project.stockWidthByMaterialGroup,
      }),
    [
      groups,
      project.parts,
      project.maxTransportLengthInches,
      project.maxPurchasableBoardWidthInches,
      project.stockWidthByMaterialGroup,
    ]
  );

  return (
    <section className="gl-panel p-5">
      {showDresserSummary && dresserSnapshot ? (
        <div className="mb-5">
          <DresserMaterialsSummary snapshot={dresserSnapshot} />
        </div>
      ) : null}
      <p className="text-xs font-medium tracking-widest text-[var(--gl-muted)] uppercase">Buy list</p>
      <p className="mt-1 text-sm text-[var(--gl-muted)]">
        Simple shopping summary by lumber type. Quantities are derived from your configured cut list and transport-length
        packing.
      </p>

      {lumberRows.length === 0 ? (
        <p className="mt-4 text-sm text-[var(--gl-muted)]">Add parts in Plan to generate a buy list.</p>
      ) : (
        <div className="mt-4 overflow-x-auto rounded-xl border border-[var(--gl-border)]">
          <table className="gl-numeric w-full min-w-[580px] text-left text-sm text-[var(--gl-cream)]">
            <thead className="bg-[var(--gl-surface-inset)] text-xs tracking-wide text-[var(--gl-muted)] uppercase">
              <tr>
                <th className="px-3 py-2.5 font-medium">Lumber type</th>
                <th className="px-3 py-2.5 text-right font-medium">Qty boards</th>
                <th className="px-3 py-2.5 text-right font-medium">Each length</th>
                <th className="px-3 py-2.5 text-right font-medium">Total lineal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--gl-border)]">
              {lumberRows.map((row) => {
                const qty = row.packError ? "—" : String(row.packedBoards?.length ?? 0);
                return (
                  <tr key={row.key}>
                    <td className="px-3 py-2.5 font-medium text-[var(--gl-cream-soft)]">{row.yardLumberLabel}</td>
                    <td className="px-3 py-2.5 text-right tabular-nums" title={row.packError ?? undefined}>
                      {qty}
                    </td>
                    <td className="px-3 py-2.5 text-right tabular-nums">
                      {formatShopImperial(project.maxTransportLengthInches)}
                    </td>
                    <td className="px-3 py-2.5 text-right tabular-nums">{(row.adjustedLinearFeet).toFixed(2)} LF</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <p className="border-t border-[var(--gl-border)] px-3 py-2 text-xs text-[var(--gl-muted)]">
            Using max haul length <strong className="text-[var(--gl-cream)]">{formatShopImperial(project.maxTransportLengthInches)}</strong>
            {" · "}max board face width{" "}
            <strong className="text-[var(--gl-cream)]">{formatShopImperial(project.maxPurchasableBoardWidthInches)}</strong>
            {" · "}waste factor <strong className="text-[var(--gl-cream)]">{project.wasteFactorPercent}%</strong>.
          </p>
        </div>
      )}
    </section>
  );
}
