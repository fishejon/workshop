"use client";

import { useMemo } from "react";
import { ASSEMBLY_IDS, type AssemblyId, type Part } from "@/lib/project-types";
import { formatLinearFeetShop, formatShopImperial } from "@/lib/imperial";
import { linearFeetForPart } from "@/lib/board-feet";
import type { LumberVehicleRow } from "@/lib/lumber-vehicle-summary";

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

export function DimensionalLumberPurchaseTable({
  rows,
  vehicleMaxInches,
}: {
  rows: LumberVehicleRow[];
  vehicleMaxInches: number;
}) {
  if (rows.length === 0) return null;

  return (
    <div className="rounded-xl border border-[var(--gl-border)] bg-[var(--gl-surface-muted)]">
      <div className="border-b border-[var(--gl-border)] px-4 py-3">
        <h3 className="text-xs font-medium tracking-widest text-[var(--gl-muted)] uppercase">Boards to buy</h3>
        <p className="mt-1 text-xs text-[var(--gl-muted)]">
          Read-only from your cut list: one row per lumber type, count = sticks needed at{" "}
          <strong className="text-[var(--gl-cream-soft)]">{formatShopImperial(vehicleMaxInches)}</strong> with{" "}
          <strong className="text-[var(--gl-cream-soft)]">⅛″ kerf</strong> between cuts. Nothing here is editable.
        </p>
      </div>
      <table className="gl-numeric w-full text-left text-sm text-[var(--gl-cream)]">
        <thead className="bg-[var(--gl-surface-inset)] text-xs text-[var(--gl-muted)] uppercase tracking-wide">
          <tr>
            <th className="px-4 py-2.5 font-medium">Lumber type</th>
            <th className="px-4 py-2.5 text-right font-medium">Boards</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[var(--gl-border)]">
          {rows.map((row) => {
            const { display, title } = boardsToBuyForRow(row);
            return (
              <tr key={row.key}>
                <td className="px-4 py-3 font-medium text-[var(--gl-cream-soft)]">{row.lumberTypeLabel}</td>
                <td
                  className="px-4 py-3 text-right text-lg font-semibold tabular-nums tracking-tight text-[var(--gl-cream)]"
                  title={title}
                >
                  {display}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      <details className="group border-t border-[var(--gl-border)]">
        <summary className="cursor-pointer list-none px-4 py-3 text-sm font-medium text-[var(--gl-copper-bright)] marker:content-none [&::-webkit-details-marker]:hidden hover:underline">
          Show cut layout (how each board is used)
        </summary>
        <div className="space-y-4 border-t border-[var(--gl-border)] border-dashed p-4 pt-4">
          {rows.map((row) => (
            <div key={`vis-${row.key}`} className="space-y-2">
              <p className="text-sm font-medium text-[var(--gl-cream)]">{row.lumberTypeLabel}</p>
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
      </details>
    </div>
  );
}

function assemblyRank(a: AssemblyId): number {
  const i = ASSEMBLY_IDS.indexOf(a);
  return i === -1 ? 999 : i;
}

export function ProjectCutRollup({ parts }: { parts: Part[] }) {
  const sorted = useMemo(() => {
    return [...parts].sort((a, b) => {
      const ra = assemblyRank(a.assembly);
      const rb = assemblyRank(b.assembly);
      if (ra !== rb) return ra - rb;
      return a.name.localeCompare(b.name);
    });
  }, [parts]);

  if (sorted.length === 0) {
    return (
      <div className="rounded-xl border border-[var(--gl-border)] bg-[var(--gl-surface-muted)] p-4 text-sm text-[var(--gl-muted)]">
        Add parts to see cuts mapped to each component.
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-[var(--gl-border)] bg-[var(--gl-surface-muted)] p-4">
      <h3 className="text-xs font-medium tracking-widest text-[var(--gl-muted)] uppercase">Cuts by project component</h3>
      <p className="mt-1 text-xs text-[var(--gl-muted)]">
        Each row is one part line from your plan: rough length per piece (nearest 1/16″) and lineal feet (length axis
        only, not board feet).
      </p>
      <div className="mt-3 overflow-x-auto rounded-lg border border-[var(--gl-border)]">
        <table className="gl-numeric w-full min-w-[640px] text-left text-xs">
          <thead className="bg-[var(--gl-surface-inset)] text-[var(--gl-muted)] uppercase tracking-wide">
            <tr>
              <th className="px-2 py-2 font-medium">Assembly</th>
              <th className="px-2 py-2 font-medium">Component</th>
              <th className="px-2 py-2 font-medium">Qty</th>
              <th className="px-2 py-2 font-medium">Rough each (T×W×L)</th>
              <th className="px-2 py-2 font-medium">Lineal each</th>
              <th className="px-2 py-2 font-medium">Lineal total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--gl-border)] text-[var(--gl-cream)]">
            {sorted.map((p) => {
              const lfEach = linearFeetForPart(p);
              const lfTotal = lfEach * Math.max(1, p.quantity);
              return (
                <tr key={p.id}>
                  <td className="px-2 py-2 text-[var(--gl-cream-soft)]">{p.assembly}</td>
                  <td className="px-2 py-2 font-medium">{p.name}</td>
                  <td className="px-2 py-2 tabular-nums">{p.quantity}</td>
                  <td className="px-2 py-2 font-mono text-xs">
                    {formatShopImperial(p.rough.t)} × {formatShopImperial(p.rough.w)} × {formatShopImperial(p.rough.l)}
                  </td>
                  <td className="px-2 py-2">{formatLinearFeetShop(lfEach)}</td>
                  <td className="px-2 py-2">{formatLinearFeetShop(lfTotal)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
