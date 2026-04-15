/**
 * Keep drawer row opening heights summing to a fixed budget by scaling unlocked rows
 * after one row is edited.
 */

export type BalanceRowOpeningsInput = {
  /** Parsed positive heights (inches), length === rowCount */
  heightsInches: number[];
  /** Sum of openings must equal this (inches) */
  budgetInches: number;
  /** Index the user just edited */
  editedIndex: number;
  /** New value for editedIndex (inches) */
  newValueInches: number;
  /** Row indices that must not be auto-adjusted */
  locked: boolean[];
};

const EPS = 1e-6;

/**
 * Sets `heightsInches[editedIndex] = newValueInches`, then scales all other unlocked heights
 * proportionally so the total equals `budgetInches` (when possible).
 * Returns a new array; does not mutate input.
 */
export function balanceRowOpeningHeights(input: BalanceRowOpeningsInput): number[] {
  const n = input.heightsInches.length;
  if (n === 0) return [];
  const locked = input.locked.length === n ? input.locked : [...input.locked, ...Array(n).fill(false)].slice(0, n);

  const out = input.heightsInches.slice();
  if (input.editedIndex < 0 || input.editedIndex >= n) return out;

  out[input.editedIndex] = Math.max(1 / 32, input.newValueInches);

  const adjustable = [...Array(n).keys()].filter((j) => j !== input.editedIndex && !locked[j]);
  if (adjustable.length === 0) {
    return out;
  }

  const fixedOthersSum = out.reduce((s, v, j) => {
    if (j === input.editedIndex) return s;
    if (locked[j]) return s + v;
    return s;
  }, 0);

  const targetOthers = input.budgetInches - out[input.editedIndex] - fixedOthersSum;
  if (!(targetOthers > EPS)) {
    const each = Math.max(1 / 32, targetOthers / adjustable.length);
    for (const j of adjustable) out[j] = each;
    return out;
  }

  const currentAdjSum = adjustable.reduce((s, j) => s + out[j], 0);
  if (currentAdjSum <= EPS) {
    const each = targetOthers / adjustable.length;
    for (const j of adjustable) out[j] = Math.max(1 / 32, each);
    return out;
  }

  const scale = targetOthers / currentAdjSum;
  for (const j of adjustable) {
    out[j] = Math.max(1 / 32, out[j] * scale);
  }

  const sum = out.reduce((a, b) => a + b, 0);
  const drift = input.budgetInches - sum;
  if (Math.abs(drift) > 1 / 256) {
    const last = adjustable[adjustable.length - 1]!;
    out[last] = Math.max(1 / 32, out[last] + drift);
  }

  return out;
}
