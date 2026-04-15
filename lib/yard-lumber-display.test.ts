import { describe, expect, it } from "vitest";
import { formatYardLumberLine, nominalBoardForPurchasableFaceWidth } from "./yard-lumber-display";
import { choiceById } from "./nominal-lumber-stocks";

describe("yard-lumber-display", () => {
  it("maps ~7.5in face on 4/4 to 1x8 (nominal rack call)", () => {
    const c = nominalBoardForPurchasableFaceWidth(7.5, "4/4");
    expect(c?.id).toBe("1x8");
  });

  it("maps 8in face on 4/4 to 1x10 (dressed 1x8 too narrow)", () => {
    const c = nominalBoardForPurchasableFaceWidth(8, "4/4");
    expect(c?.id).toBe("1x10");
  });

  it("maps 8/4 thickness to 2x stock family", () => {
    const c = nominalBoardForPurchasableFaceWidth(6, "8/4");
    expect(c?.actualThicknessInches).toBe(1.5);
    expect(c?.id.startsWith("2x")).toBe(true);
  });

  it("formatYardLumberLine includes species and thickness", () => {
    const n = choiceById("1x6")!;
    expect(formatYardLumberLine(n, "White oak", "4/4")).toMatch(/1×6 White oak — 4\/4/);
  });
});
