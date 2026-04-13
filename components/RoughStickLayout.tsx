"use client";

import { useMemo, useState } from "react";
import { useProject } from "@/components/ProjectContext";
import { formatImperial, parseInches } from "@/lib/imperial";
import { packUniformStock, totalWaste, type CutPiece } from "@/lib/optimize-cuts";
import { roughCutsFromParts } from "@/lib/rough-sticks";

export function RoughStickLayout() {
  const { project } = useProject();
  const [kerf, setKerf] = useState("0.125");
  const [stockLength, setStockLength] = useState(() => String(project.maxTransportLengthInches));

  const cuts = useMemo(() => roughCutsFromParts(project.parts), [project.parts]);

  const parsed = useMemo(() => {
    const kerfN = parseInches(kerf);
    const stockN = parseInches(stockLength);
    if (kerfN === null || kerfN < 0) return { ok: false as const, reason: "Kerf must be a valid non-negative length." };
    if (stockN === null || stockN <= 0) {
      return { ok: false as const, reason: "Stock length must be a positive length." };
    }
    const pieces: CutPiece[] = cuts.map((c) => ({ lengthInches: c.lengthInches, label: c.label }));
    return { ok: true as const, kerfN, stockN, pieces };
  }, [kerf, stockLength, cuts]);

  const result = useMemo(() => {
    if (!parsed.ok || parsed.pieces.length === 0) return null;
    try {
      const boards = packUniformStock(parsed.pieces, parsed.stockN, parsed.kerfN);
      return { boards, waste: totalWaste(boards) };
    } catch (e) {
      return { error: e instanceof Error ? e.message : "Could not pack cuts." };
    }
  }, [parsed]);

  const packed = useMemo(() => {
    if (!result || "error" in result) return null;
    return result;
  }, [result]);

  if (project.parts.length === 0) {
    return (
      <section className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 backdrop-blur-md">
        <h2 className="text-sm font-semibold text-[var(--gl-cream)]">Rough stick layout (from parts list)</h2>
        <p className="mt-3 text-sm text-[var(--gl-muted)]">Add parts to see a 1D pack of rough lengths (L axis).</p>
      </section>
    );
  }

  const showError =
    cuts.length > 0
      ? parsed.ok && result && "error" in result
        ? result.error
        : !parsed.ok
          ? parsed.reason
          : null
      : null;

  return (
    <section className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 backdrop-blur-md">
      <h2 className="text-sm font-semibold text-[var(--gl-cream)]">Rough stick layout (from parts list)</h2>
      <p className="mt-1 text-xs text-[var(--gl-muted)]">
        Each part instance uses <strong className="text-[var(--gl-cream-soft)]">rough L</strong> as the stick length;
        labels match the parts list (name + index).
      </p>

      {cuts.length === 0 ? (
        <p className="mt-4 text-sm text-[var(--gl-muted)]">
          No packable rough lengths yet—set quantity ≥ 1 and rough L &gt; 0 on your parts.
        </p>
      ) : (
        <>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <label className="flex flex-col gap-1 text-sm">
              <span className="font-medium text-[var(--gl-cream-soft)]">Kerf (blade)</span>
              <input className="input-wood" value={kerf} onChange={(e) => setKerf(e.target.value)} inputMode="decimal" />
              <span className="text-xs text-[var(--gl-muted)]">Default 1/8&quot;</span>
            </label>
            <label className="flex flex-col gap-1 text-sm">
              <span className="font-medium text-[var(--gl-cream-soft)]">Stock / stick length</span>
              <input
                className="input-wood"
                value={stockLength}
                onChange={(e) => setStockLength(e.target.value)}
                inputMode="decimal"
              />
              <span className="text-xs text-[var(--gl-muted)]">
                Default from max transport ({formatImperial(project.maxTransportLengthInches)})
              </span>
            </label>
          </div>

          {showError ? (
            <p className="mt-4 rounded-xl border border-red-400/30 bg-red-950/40 px-4 py-3 text-sm text-red-200" role="alert">
              {showError}
            </p>
          ) : null}

          {packed && parsed.ok ? (
            <div className="mt-5 space-y-4">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h3 className="text-xs font-medium tracking-widest text-[var(--gl-muted)] uppercase">Cut layout</h3>
                <p className="text-sm text-[var(--gl-muted)]">
                  {packed.boards.length} board{packed.boards.length === 1 ? "" : "s"} ×{" "}
                  {formatImperial(parsed.stockN)} — combined waste ≈ {formatImperial(packed.waste)} (after kerf)
                </p>
              </div>

              <ul className="space-y-4">
                {packed.boards.map((board) => (
                  <li
                    key={board.index}
                    className="rounded-xl border border-white/10 bg-black/20 p-4 backdrop-blur-sm"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-[var(--gl-muted)]">
                      <span className="font-medium text-[var(--gl-cream)]">Board {board.index}</span>
                      <span>
                        Waste ~ <span className="text-[var(--gl-cream)]">{formatImperial(board.wasteInches)}</span>
                      </span>
                    </div>

                    <div className="mt-3 flex h-12 w-full overflow-hidden rounded-lg bg-black/40 ring-1 ring-white/10">
                      {board.cuts.map((cut, i) => {
                        const pct = Math.max(4, (cut.lengthInches / board.stockLengthInches) * 100);
                        return (
                          <div
                            key={`${board.index}-${i}-${cut.lengthInches}-${cut.label ?? ""}`}
                            className="flex min-w-[2.5rem] flex-col justify-center border-r border-[var(--gl-copper)]/20 bg-gradient-to-b from-[var(--gl-copper)]/35 to-[var(--gl-copper)]/15 px-1 text-center last:border-r-0"
                            style={{ width: `${pct}%` }}
                            title={cut.label ?? formatImperial(cut.lengthInches)}
                          >
                            <span className="text-[10px] font-medium leading-tight text-[var(--gl-cream)] sm:text-xs">
                              {formatImperial(cut.lengthInches)}
                            </span>
                            {cut.label ? (
                              <span className="hidden truncate text-[9px] text-[var(--gl-muted)] sm:block">{cut.label}</span>
                            ) : null}
                          </div>
                        );
                      })}
                    </div>
                    <ol className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-[var(--gl-muted)]">
                      {board.cuts.map((cut, i) => (
                        <li key={`${board.index}-list-${i}`}>
                          {i + 1}. {formatImperial(cut.lengthInches)}
                          {cut.label ? ` — ${cut.label}` : ""}
                        </li>
                      ))}
                    </ol>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </>
      )}
    </section>
  );
}
