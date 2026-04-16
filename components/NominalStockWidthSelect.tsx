"use client";

import { useEffect, useState } from "react";
import {
  choiceById,
  choiceForActualWidthInches,
  CUSTOM_STOCK_WIDTH_ID,
  NOMINAL_STOCK_WIDTH_CHOICES,
  optionLabel,
} from "@/lib/nominal-lumber-stocks";

const WIDTH_TOL = 0.02;

type NominalStockWidthSelectProps = {
  valueInches: number;
  onChangeInches: (inches: number) => void;
  selectId: string;
  customInputId: string;
  /** Shown under the control */
  helperText?: string;
};

export function NominalStockWidthSelect({
  valueInches,
  onChangeInches,
  selectId,
  customInputId,
  helperText,
}: NominalStockWidthSelectProps) {
  const inferred = choiceForActualWidthInches(valueInches);
  const [preferCustom, setPreferCustom] = useState(() => inferred === null);
  /** Same dressed width can be 1× or 2×; remember which row the user picked so the menu does not jump. */
  const [pinnedNominalId, setPinnedNominalId] = useState<string | null>(null);

  const pinStillValid =
    pinnedNominalId !== null
      ? (() => {
          const pin = choiceById(pinnedNominalId);
          return pin !== undefined && Math.abs(pin.actualWidthInches - valueInches) < WIDTH_TOL;
        })()
      : false;

  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect -- sync UI mode when inches no longer match any nominal (e.g. import) */
    if (inferred === null) setPreferCustom(true);
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [inferred]);

  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect -- drop stale nominal pin when width diverges (e.g. Setup changed stock) */
    if (!pinStillValid) setPinnedNominalId(null);
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [pinStillValid, valueInches]);

  const matched = pinStillValid && pinnedNominalId ? choiceById(pinnedNominalId) ?? inferred : inferred;

  const selectValue = preferCustom ? CUSTOM_STOCK_WIDTH_ID : (matched?.id ?? CUSTOM_STOCK_WIDTH_ID);

  return (
    <div className="space-y-2">
      <select
        id={selectId}
        className="input-wood"
        value={selectValue}
        onChange={(e) => {
          const v = e.target.value;
          if (v === CUSTOM_STOCK_WIDTH_ID) {
            setPreferCustom(true);
            setPinnedNominalId(null);
            return;
          }
          setPreferCustom(false);
          const c = choiceById(v);
          if (c) {
            setPinnedNominalId(c.id);
            onChangeInches(c.actualWidthInches);
          }
        }}
      >
        {NOMINAL_STOCK_WIDTH_CHOICES.map((c) => (
          <option key={c.id} value={c.id}>
            {optionLabel(c)}
          </option>
        ))}
        <option value={CUSTOM_STOCK_WIDTH_ID}>Other / custom actual width (inches)…</option>
      </select>
      {selectValue === CUSTOM_STOCK_WIDTH_ID ? (
        <label className="block text-xs text-[var(--gl-muted)]" htmlFor={customInputId}>
          Actual widest board face you can buy (inches)
          <input
            id={customInputId}
            type="number"
            step="any"
            min={0.0001}
            inputMode="decimal"
            className="input-wood mt-1"
            value={Number.isFinite(valueInches) ? valueInches : ""}
            onChange={(e) => {
              const n = Number.parseFloat(e.target.value);
              if (!Number.isFinite(n) || n <= 0) return;
              onChangeInches(n);
            }}
          />
        </label>
      ) : matched ? (
        <p className="text-xs text-[var(--gl-muted)]">
          Using <strong className="text-[var(--gl-text)]">{formatWidthSummary(matched)}</strong> for glue-up /
          width checks.
        </p>
      ) : null}
      {helperText ? <p className="text-xs text-[var(--gl-muted)]">{helperText}</p> : null}
    </div>
  );
}

function formatWidthSummary(c: { nominal: string; note: string; actualWidthInches: number }): string {
  return `${c.nominal} (${c.note}; ${c.actualWidthInches}″ face width)`;
}
