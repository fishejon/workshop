"use client";

import { useMemo, useState } from "react";
import { PackedStickCutBoardList } from "@/components/PackedStickCutStrip";
import { useProject } from "@/components/ProjectContext";
import { formatShopImperial, parseInches } from "@/lib/imperial";
import { packUniformStock, totalWaste } from "@/lib/optimize-cuts";
import { roughCutPiecesForPack } from "@/lib/rough-sticks";
import { buildRoughInstanceLabelMap } from "@/lib/shop-labels";

export function RoughStickLayout() {
  const { project, toggleCutProgress, clearCutProgress } = useProject();
  const [kerf, setKerf] = useState("0.125");
  const [stockLength, setStockLength] = useState(() => String(project.maxTransportLengthInches));

  const pieces = useMemo(() => roughCutPiecesForPack(project.parts), [project.parts]);
  const shopLabelByRoughInstanceId = useMemo(
    () => buildRoughInstanceLabelMap(project.parts),
    [project.parts]
  );
  const hasCutMarks = useMemo(
    () => Object.keys(project.cutProgressByRoughInstanceId ?? {}).length > 0,
    [project.cutProgressByRoughInstanceId]
  );

  const parsed = useMemo(() => {
    const kerfN = parseInches(kerf);
    const stockN = parseInches(stockLength);
    if (kerfN === null || kerfN < 0) return { ok: false as const, reason: "Kerf must be a valid non-negative length." };
    if (stockN === null || stockN <= 0) {
      return { ok: false as const, reason: "Stock length must be a positive length." };
    }
    if (pieces.length === 0) {
      return { ok: false as const, reason: "No packable rough lengths yet—set quantity ≥ 1 and rough L > 0 on your parts." };
    }
    return { ok: true as const, kerfN, stockN, pieces };
  }, [kerf, stockLength, pieces]);

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
      <section className="gl-panel p-5">
        <h2 className="text-sm font-semibold text-[var(--gl-cream)]">Rough stick layout (from parts list)</h2>
        <p className="mt-3 text-sm text-[var(--gl-muted)]">Add parts to see a 1D pack of rough lengths (L axis).</p>
      </section>
    );
  }

  const showError =
    pieces.length > 0
      ? parsed.ok && result && "error" in result
        ? result.error
        : !parsed.ok
          ? parsed.reason
          : null
      : null;

  return (
    <section className="gl-panel p-5">
      <h2 className="text-sm font-semibold text-[var(--gl-cream)]">Rough stick layout (from parts list)</h2>
      <p className="mt-1 text-xs text-[var(--gl-muted)]">
        Each part instance uses <strong className="text-[var(--gl-cream-soft)]">rough L</strong> as the stick length;
        labels match the parts list (name + index). <strong className="text-[var(--gl-cream-soft)]">GL-</strong> codes
        are stable per piece—write them on the board; marks follow the part if the pack changes.
      </p>

      {pieces.length === 0 ? (
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
                Default from max transport ({formatShopImperial(project.maxTransportLengthInches)})
              </span>
            </label>
          </div>

          {showError ? (
            <p
              className="mt-4 rounded-xl border border-[color-mix(in_srgb,var(--gl-danger)_30%,var(--gl-border))] bg-[var(--gl-danger-bg)] px-4 py-3 text-sm text-[var(--gl-danger)]"
              role="alert"
            >
              {showError}
            </p>
          ) : null}

          {packed && parsed.ok ? (
            <div className="mt-5 space-y-4">
              <div className="flex flex-wrap items-baseline justify-between gap-2 gap-y-2">
                <div>
                  <h3 className="text-xs font-medium tracking-widest text-[var(--gl-muted)] uppercase">Cut layout</h3>
                  <p className="mt-1 max-w-xl text-xs text-[var(--gl-muted)]">
                    Tap a segment when that rough length is off the saw (green = cut). Progress is stored per part
                    instance, not per position on the stick.
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <p className="text-sm text-[var(--gl-muted)]">
                    {packed.boards.length} board{packed.boards.length === 1 ? "" : "s"} ×{" "}
                    {formatShopImperial(parsed.stockN)} — combined waste ≈ {formatShopImperial(packed.waste)} (after
                    kerf)
                  </p>
                  {hasCutMarks ? (
                    <button
                      type="button"
                      className="text-xs font-medium text-[var(--gl-copper)] underline decoration-[var(--gl-copper)]/30 underline-offset-2 hover:decoration-[var(--gl-copper)]"
                      onClick={() => clearCutProgress()}
                    >
                      Reset cut marks
                    </button>
                  ) : null}
                </div>
              </div>

              <PackedStickCutBoardList
                boards={packed.boards}
                skin="rough"
                shopLabelByRoughInstanceId={shopLabelByRoughInstanceId}
                showPartLabel={false}
                cutProgressByRoughInstanceId={project.cutProgressByRoughInstanceId}
                onToggleCut={toggleCutProgress}
              />
            </div>
          ) : null}
        </>
      )}
    </section>
  );
}
