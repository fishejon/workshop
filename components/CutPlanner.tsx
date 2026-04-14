"use client";

/* eslint-disable react-hooks/preserve-manual-memoization -- manual memo deps are intentional; React Compiler rule misfires here */
import { useMemo, useState } from "react";
import { formatShopImperial, parseInches } from "@/lib/imperial";
import { packUniformStock, totalWaste, type CutPiece } from "@/lib/optimize-cuts";

type PartRow = { id: string; label: string; length: string; qty: string };

let idCounter = 0;
function nextId() {
  return `p-${++idCounter}`;
}

export function CutPlanner() {
  const [kerf, setKerf] = useState("0.125");
  const [stockLength, setStockLength] = useState("96");
  const [maxCarry, setMaxCarry] = useState("96");
  const [parts, setParts] = useState<PartRow[]>([
    { id: nextId(), label: "Side panel", length: "30", qty: "2" },
    { id: nextId(), label: "Stretcher", length: "24", qty: "4" },
  ]);
  const [submitted, setSubmitted] = useState(false);

  const parsed = useMemo(() => {
    const kerfN = parseInches(kerf);
    const stockN = parseInches(stockLength);
    const carryN = parseInches(maxCarry);
    if (kerfN === null || kerfN < 0) return { ok: false as const, reason: "Kerf must be a valid non-negative length." };
    if (stockN === null || stockN <= 0) return { ok: false as const, reason: "Stock length must be a positive length." };
    if (carryN === null || carryN <= 0) {
      return { ok: false as const, reason: "Max carry length must be a positive length." };
    }
    if (stockN > carryN + 1e-6) {
      return {
        ok: false as const,
        reason: `Stock board (${formatShopImperial(stockN)}) is longer than max carry (${formatShopImperial(carryN)}).`,
      };
    }

    const pieces: CutPiece[] = [];
    for (const row of parts) {
      const len = parseInches(row.length);
      const q = Number.parseInt(row.qty, 10);
      if (row.length.trim() && len === null) {
        return { ok: false as const, reason: `Invalid length for “${row.label || "part"}”.` };
      }
      if (row.length.trim() && (Number.isNaN(q) || q < 1)) {
        return { ok: false as const, reason: `Invalid quantity for “${row.label || "part"}”.` };
      }
      if (len !== null && len > 0 && !Number.isNaN(q) && q >= 1) {
        for (let i = 0; i < q; i++) {
          pieces.push({
            lengthInches: len,
            label: row.label.trim() || undefined,
          });
        }
      }
    }
    if (pieces.length === 0) {
      return { ok: false as const, reason: "Add at least one part with length and quantity." };
    }
    return { ok: true as const, kerfN, stockN, carryN, pieces };
  }, [kerf, stockLength, maxCarry, parts]);

  const result = useMemo(() => {
    if (!parsed.ok) return null;
    try {
      const boards = packUniformStock(parsed.pieces, parsed.stockN, parsed.kerfN);
      return { boards, waste: totalWaste(boards) };
    } catch (e) {
      return {
        error: e instanceof Error ? e.message : "Could not pack cuts.",
      };
    }
  }, [parsed]);

  function runPlan() {
    setSubmitted(true);
  }

  const showError = submitted
    ? !parsed.ok
      ? parsed.reason
      : result && "error" in result
        ? result.error
        : null
    : null;
  const showResult = submitted && parsed.ok && result && !("error" in result);

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-10">
      <header className="space-y-3">
        <p className="text-xs font-semibold tracking-[0.2em] text-[var(--gl-copper-bright)] uppercase">
          Board cut list
        </p>
        <h2 className="font-display text-3xl tracking-tight text-[var(--gl-cream)] sm:text-4xl">1D hardwood pack</h2>
        <p className="max-w-2xl text-base leading-relaxed text-[var(--gl-muted)]">
          Parts, kerf, and the stick length you buy (often capped by your vehicle). Output rounds to the nearest
          1/4&quot;.
        </p>
      </header>

      <section className="rounded-2xl border border-[var(--gl-border)] bg-[var(--gl-surface)] p-6">
        <h3 className="text-sm font-semibold text-[var(--gl-cream)]">Shop setup</h3>
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium text-[var(--gl-cream-soft)]">Kerf (blade)</span>
            <input className="input-wood" value={kerf} onChange={(e) => setKerf(e.target.value)} inputMode="decimal" />
            <span className="text-xs text-[var(--gl-muted)]">Table saw ~1/8&quot; typical</span>
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium text-[var(--gl-cream-soft)]">Board length you buy</span>
            <input
              className="input-wood"
              value={stockLength}
              onChange={(e) => setStockLength(e.target.value)}
              inputMode="decimal"
            />
            <span className="text-xs text-[var(--gl-muted)]">e.g. 96 for 8&apos; hardwood</span>
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium text-[var(--gl-cream-soft)]">Max that fits in your vehicle</span>
            <input className="input-wood" value={maxCarry} onChange={(e) => setMaxCarry(e.target.value)} inputMode="decimal" />
            <span className="text-xs text-[var(--gl-muted)]">Stock length ≤ this</span>
          </label>
        </div>
      </section>

      <section className="rounded-2xl border border-[var(--gl-border)] bg-[var(--gl-surface)] p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h3 className="text-sm font-semibold text-[var(--gl-cream)]">Parts</h3>
          <button
            type="button"
            className="inline-flex items-center justify-center rounded-xl border border-[var(--gl-border-strong)] bg-[var(--gl-surface-muted)] px-3 py-2 text-sm font-medium text-[var(--gl-cream)] transition hover:bg-[var(--gl-surface-muted)]"
            onClick={() => setParts((rows) => [...rows, { id: nextId(), label: "", length: "", qty: "1" }])}
          >
            Add part
          </button>
        </div>

        <div className="mt-4 space-y-3">
          <div className="grid grid-cols-[1fr_5.5rem_4rem_2.5rem] gap-2 text-xs font-medium text-[var(--gl-muted)] sm:grid-cols-[1.5fr_6rem_4rem_2.5rem]">
            <span>Label</span>
            <span>Length (&quot;)</span>
            <span>Qty</span>
            <span className="text-center"> </span>
          </div>
          {parts.map((row) => (
            <div
              key={row.id}
              className="grid grid-cols-[1fr_5.5rem_4rem_2.5rem] items-center gap-2 sm:grid-cols-[1.5fr_6rem_4rem_2.5rem]"
            >
              <input
                className="input-wood py-2 text-sm"
                placeholder="Drawer front"
                value={row.label}
                onChange={(e) =>
                  setParts((rows) => rows.map((r) => (r.id === row.id ? { ...r, label: e.target.value } : r)))
                }
              />
              <input
                className="input-wood py-2 text-sm"
                placeholder="24 1/2"
                value={row.length}
                onChange={(e) =>
                  setParts((rows) => rows.map((r) => (r.id === row.id ? { ...r, length: e.target.value } : r)))
                }
                inputMode="decimal"
              />
              <input
                className="input-wood py-2 text-sm"
                value={row.qty}
                onChange={(e) =>
                  setParts((rows) => rows.map((r) => (r.id === row.id ? { ...r, qty: e.target.value } : r)))
                }
                inputMode="numeric"
              />
              <button
                type="button"
                className="rounded-lg p-2 text-sm text-[var(--gl-muted)] transition hover:bg-[var(--gl-surface-muted)] hover:text-[var(--gl-cream)]"
                aria-label="Remove part"
                onClick={() => setParts((rows) => rows.filter((r) => r.id !== row.id))}
              >
                ✕
              </button>
            </div>
          ))}
        </div>

        <div className="mt-6">
          <button
            type="button"
            className="rounded-xl bg-[var(--gl-copper)] px-5 py-3 text-sm font-semibold text-[var(--gl-on-accent)] shadow-md shadow-[0_8px_24px_rgba(0,0,0,0.08)] transition hover:bg-[var(--gl-copper-bright)]"
            onClick={runPlan}
          >
            Layout cuts
          </button>
        </div>
      </section>

      {showError ? (
        <p
          className="rounded-xl border border-[color-mix(in_srgb,var(--gl-danger)_30%,var(--gl-border))] bg-[var(--gl-danger-bg)] px-4 py-3 text-sm text-[var(--gl-danger)]"
          role="alert"
        >
          {showError}
        </p>
      ) : null}

      {parsed.ok && result && "error" in result ? (
        <p
          className="rounded-xl border border-[color-mix(in_srgb,var(--gl-danger)_30%,var(--gl-border))] bg-[var(--gl-danger-bg)] px-4 py-3 text-sm text-[var(--gl-danger)]"
          role="alert"
        >
          {result.error}
        </p>
      ) : null}

      {showResult && result && "boards" in result ? (
        <section className="space-y-4">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h3 className="text-sm font-semibold text-[var(--gl-cream)]">Cut layout</h3>
            <p className="text-sm text-[var(--gl-muted)]">
              {result.boards.length} board{result.boards.length === 1 ? "" : "s"} ×{" "}
              {formatShopImperial(parsed.stockN)} — combined waste ≈ {formatShopImperial(result.waste)} (after kerf)
            </p>
          </div>

          <ul className="space-y-5">
            {result.boards.map((board) => (
              <li
                key={board.index}
                className="rounded-2xl border border-[var(--gl-border)] bg-[var(--gl-surface)] p-5"
              >
                <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-[var(--gl-muted)]">
                  <span className="font-medium text-[var(--gl-cream)]">Board {board.index}</span>
                  <span>
                    Waste ~ <span className="text-[var(--gl-cream)]">{formatShopImperial(board.wasteInches)}</span>
                  </span>
                </div>

                <div className="mt-4 flex h-14 w-full overflow-hidden rounded-lg bg-[var(--gl-surface-inset)] ring-1 ring-[var(--gl-border)]">
                  {board.cuts.map((cut, i) => {
                    const pct = Math.max(4, (cut.lengthInches / board.stockLengthInches) * 100);
                    return (
                      <div
                        key={`${board.index}-${i}-${cut.lengthInches}`}
                        className="flex min-w-[2.5rem] flex-col justify-center border-r border-[var(--gl-copper)]/20 bg-gradient-to-b from-[var(--gl-copper)]/35 to-[var(--gl-copper)]/15 px-1 text-center last:border-r-0"
                        style={{ width: `${pct}%` }}
                        title={cut.label ?? formatShopImperial(cut.lengthInches)}
                      >
                        <span className="text-xs font-medium leading-tight text-[var(--gl-cream)]">
                          {formatShopImperial(cut.lengthInches)}
                        </span>
                        {cut.label ? (
                          <span className="hidden truncate text-xs leading-tight text-[var(--gl-muted)] sm:block">
                            {cut.label}
                          </span>
                        ) : null}
                      </div>
                    );
                  })}
                </div>
                <ol className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-[var(--gl-muted)]">
                  {board.cuts.map((cut, i) => (
                    <li key={`${board.index}-list-${i}`}>
                      {i + 1}. {formatShopImperial(cut.lengthInches)}
                      {cut.label ? ` — ${cut.label}` : ""}
                    </li>
                  ))}
                </ol>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <footer className="border-t border-[var(--gl-border)] pt-8 text-xs leading-relaxed text-[var(--gl-muted)]">
        <p>
          Sheet-good nesting and joinery allowances are still manual. Export from dresser cells into parts here when
          you want a stick layout.
        </p>
      </footer>
    </div>
  );
}
