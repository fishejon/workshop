import { describe, expect, it } from "vitest";
import { stockConversionService } from "@/lib/services/StockConversionService";

describe("StockConversionService", () => {
  it("converts surfaced to rough dimensions", () => {
    expect(stockConversionService.convertToRoughStock(0.75, 0.125)).toBe(1);
  });

  it("rough board feet exceed surfaced board feet", () => {
    const rough = stockConversionService.calculateBoardFeet(0.75, 6, 8, "rough", 0.125);
    const surfaced = stockConversionService.calculateBoardFeet(0.75, 6, 8, "surfaced", 0.125);
    expect(rough).toBeGreaterThan(surfaced);
  });
});
