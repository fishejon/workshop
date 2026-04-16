import { describe, expect, it } from "vitest";
import { balanceRowOpeningHeights } from "./dresser-row-balance";

describe("balanceRowOpeningHeights", () => {
  it("sets edited row and scales other unlocked rows to hit budget", () => {
    const out = balanceRowOpeningHeights({
      heightsInches: [8, 8, 8],
      budgetInches: 24,
      editedIndex: 0,
      newValueInches: 10,
      locked: [false, false, false],
    });
    expect(out[0]).toBeCloseTo(10, 5);
    expect(out.reduce((a, b) => a + b, 0)).toBeCloseTo(24, 4);
  });

  it("does not adjust locked rows", () => {
    const out = balanceRowOpeningHeights({
      heightsInches: [6, 8, 8],
      budgetInches: 22,
      editedIndex: 0,
      newValueInches: 6,
      locked: [false, true, false],
    });
    expect(out[1]).toBe(8);
    expect(out.reduce((a, b) => a + b, 0)).toBeCloseTo(22, 4);
  });
});
