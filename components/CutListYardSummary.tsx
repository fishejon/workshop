"use client";

import { useMemo } from "react";
import { useProject } from "@/components/ProjectContext";
import { groupPartsByMaterial } from "@/lib/board-feet";
import { formatLinearFeetShop, formatShopImperial } from "@/lib/imperial";
import { buildLumberVehicleRows, type LumberVehicleRow } from "@/lib/lumber-vehicle-summary";

function boardsToBuyForRow(row: LumberVehicleRow): { display: string; title?: string } {
  if (row.totalLinealInches <= 0) {
    return { display: "0" };
  }
  if (row.packError) {
    return { display: "—", title: row.packError };
  }
  if (row.packedBoards) {
    return { display: String(row.packedBoards.length) };
  }
  return { display: "0" };
}

function BoardCutStrip({
  stockLengthInches,
  boardIndex,
  cuts,
}: {
  stockLengthInches: number;
  boardIndex: number;
  cuts: { lengthInches: number; label?: string }[];
}) {
  return (
    <li className="rounded-lg border border-[var(--gl-border)] bg-[var(--gl-surface-inset)] p-3">
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-[var(--gl-muted)]">
        <span className="font-medium text-[var(--gl-cream)]">Board {boardIndex}</span>
        <span>
          Stock {formatShopImperial(stockLengthInches)} — cuts {cuts.length}
        </span>
      </div>
      <div className="mt-2 flex h-10 w-full overflow-hidden rounded-md bg-[var(--gl-surface-muted)] ring-1 ring-[var(--gl-border)]">
        {cuts.map((cut, i) => {
          const pct = Math.max(5, (cut.lengthInches / stockLengthInches) * 100);
          return (
            <div
              key={`${boardIndex}-${i}-${cut.lengthInches}-${cut.label ?? ""}`}
              className="flex min-w-[2rem] flex-col justify-center border-r border-[var(--gl-copper)]/25 bg-gradient-to-b from-[var(--gl-copper)]/35 to-[var(--gl-copper)]/12 px-0.5 text-center last:border-r-0"
              style={{ width: `${pct}%` }}
              title={cut.label ?? formatShopImperial(cut.lengthInches)}
            >
              <span className="text-xs font-medium leading-tight text-[var(--gl-cream)]">
                {formatShopImperial(cut.lengthInches)}
              </span>
            </div>
          );
        })}
      </div>
      <ol className="mt-2 flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-[var(--gl-muted)]">
        {cuts.map((cut, i) => (
          <li key={`${boardIndex}-li-${i}`}>
            {i + 1}. {formatShopImperial(cut.lengthInches)}
            {cut.label ? ` — ${cut.label}` : ""}
          </li>
        ))}
      </ol>
    </li>
  );
}

/**
 * Read-only yard shopping strip: nominal lumber line, total lineal, board count, stick length, cut layout.
 */
export function CutListYardSummary() {
  const { project } = useProject();

  const groups = useMemo(
    () => groupPartsByMaterial(project.parts, project.wasteFactorPercent),
    [project.parts, project.wasteFactorPercent]
  );

  const rows = useMemo(
    () =>
      buildLumberVehicleRows(
        groups,
        project.parts,
        project.maxTransportLengthInches,
        {
          maxPurchasableBoardWidthInches: project.maxPurchasableBoardWidthInches,
          stockWidthByMaterialGroup: project.stockWidthByMaterialGroup,
        }
      ),
    [
      groups,
      project.parts,
      project.maxTransportLengthInches,
      project.maxPurchasableBoardWidthInches,
      project.stockWidthByMaterialGroup,
    ]
  );

  const vehicleMaxInches = project.maxTransportLengthInches;

  if (rows.length === 0) {
    return (
      <div className="rounded-xl border border-[var(--gl-border)] bg-[var(--gl-surface-muted)] p-4 text-sm text-[var(--gl-muted)]">
        Add parts on the Plan tab to see what dimensional sticks to buy.
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-[var(--gl-border)] bg-[var(--gl-surface-muted)]">
      <div className="border-b border-[var(--gl-border)] px-4 py-3">
        <h2 className="text-xs font-medium tracking-widest text-[var(--gl-muted)] uppercase">Yard list</h2>
        <p className="mt-1 text-xs text-[var(--gl-muted)]">
          One row per rack call (nominal 1× / 2× from your max board face width and thickness category). Board count
          packs each part&apos;s <strong className="text-[var(--gl-cream-soft)]">rough length</strong> along the stick
          at your max haul length of{" "}
          <strong className="text-[var(--gl-cream-soft)]">{formatShopImperial(vehicleMaxInches)}</strong> with{" "}
          <strong className="text-[var(--gl-cream-soft)]">⅛″ kerf</strong> between cuts on the same stick.
        </p>
      </div>
      <table className="gl-numeric w-full text-left text-sm text-[var(--gl-cream)]">
        <thead className="bg-[var(--gl-surface-inset)] text-xs text-[var(--gl-muted)] uppercase tracking-wide">
          <tr>
            <th className="px-4 py-2.5 font-medium">Lumber type</th>
            <th className="px-4 py-2.5 text-right font-medium">Total lineal</th>
            <th className="px-4 py-2.5 text-right font-medium">Boards</th>
            <th className="px-4 py-2.5 text-right font-medium">Each board length</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[var(--gl-border)]">
          {rows.map((row) => {
            const { display, title } = boardsToBuyForRow(row);
            return (
              <tr key={row.key}>
                <td className="px-4 py-3 font-medium text-[var(--gl-cream-soft)]">{row.yardLumberLabel}</td>
                <td className="px-4 py-3 text-right tabular-nums text-[var(--gl-cream)]">
                  {formatLinearFeetShop(row.adjustedLinearFeet)}
                </td>
                <td
                  className="px-4 py-3 text-right text-lg font-semibold tabular-nums tracking-tight text-[var(--gl-cream)]"
                  title={title}
                >
                  {display}
                </td>
                <td className="px-4 py-3 text-right tabular-nums text-[var(--gl-cream-soft)]">
                  {formatShopImperial(vehicleMaxInches)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      <div className="border-t border-[var(--gl-border)] px-4 py-3">
        <h3 className="text-xs font-medium tracking-widest text-[var(--gl-muted)] uppercase">Cut layout</h3>
        <p className="mt-1 text-xs text-[var(--gl-muted)]">
          How cuts nest on each stick (same lengths as the table). Width and thickness are not re-ripped here; optional
          board-foot math lives under <strong className="text-[var(--gl-cream-soft)]">Lumber &amp; buy list</strong>.
        </p>
      </div>
      <div className="space-y-4 p-4 pt-0">
        {rows.map((row) => (
          <div key={`vis-${row.key}`} className="space-y-2">
            <p className="text-sm font-medium text-[var(--gl-cream)]">{row.yardLumberLabel}</p>
            {row.packError ? (
              <p className="text-xs text-[var(--gl-warning)]">{row.packError}</p>
            ) : row.packedBoards && row.packedBoards.length > 0 ? (
              <ul className="space-y-2">
                {row.packedBoards.map((board) => (
                  <BoardCutStrip
                    key={board.index}
                    boardIndex={board.index}
                    stockLengthInches={board.stockLengthInches}
                    cuts={board.cuts}
                  />
                ))}
              </ul>
            ) : (
              <p className="text-xs text-[var(--gl-muted)]">No rough lengths to pack for this type.</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
