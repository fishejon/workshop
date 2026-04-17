export class StockConversionService {
  convertToRoughStock(finishedDimensionInches: number, roughToSurfacedFactor = 0.125): number {
    return finishedDimensionInches + 2 * roughToSurfacedFactor;
  }

  calculateBoardFeet(
    thicknessInches: number,
    widthInches: number,
    lengthFeet: number,
    stockType: "surfaced" | "rough",
    roughFactor = 0.125
  ): number {
    const thickness = stockType === "rough" ? thicknessInches + 2 * roughFactor : thicknessInches;
    const width = stockType === "rough" ? widthInches + 2 * roughFactor : widthInches;
    return (thickness * width * lengthFeet) / 12;
  }

  generateStockGuidance(stockType: "surfaced" | "rough"): string[] {
    if (stockType === "surfaced") {
      return [
        "Dimensions assume surfaced S4S stock.",
        "Buy near finished thickness and width.",
        "Lower milling labor, usually higher per-BF price.",
      ];
    }
    return [
      "Dimensions include surfacing allowance for rough stock.",
      "Typical allowance is about 1/8 inch per face.",
      "Requires jointer/planer workflow before final cuts.",
    ];
  }
}

export const stockConversionService = new StockConversionService();
