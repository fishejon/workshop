import { describe, expect, it } from "vitest";
import { choiceById, choiceForActualWidthInches, NOMINAL_STOCK_WIDTH_CHOICES } from "./nominal-lumber-stocks";

describe("nominal-lumber-stocks", () => {
  it("maps 2x4 to 3.5in actual width", () => {
    const c = choiceById("2x4");
    expect(c?.actualWidthInches).toBe(3.5);
    expect(c?.actualThicknessInches).toBe(1.5);
  });

  it("matches actual width with small float tolerance", () => {
    expect(choiceForActualWidthInches(3.5)?.id).toBe("2x4");
    expect(choiceForActualWidthInches(3.50001)?.id).toBe("2x4");
    expect(choiceForActualWidthInches(20)).toBeNull();
  });

  it("is sorted ascending by actual width", () => {
    const widths = NOMINAL_STOCK_WIDTH_CHOICES.map((c) => c.actualWidthInches);
    const sorted = [...widths].sort((a, b) => a - b);
    expect(widths).toEqual(sorted);
  });
});
