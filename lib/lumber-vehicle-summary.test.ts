import { describe, expect, it } from "vitest";
import { groupPartsByMaterial } from "./board-feet";
import { boardsNeededByVehicleLength, buildLumberVehicleRows, partsInMaterialGroup } from "./lumber-vehicle-summary";
import type { Part } from "./project-types";

describe("lumber-vehicle-summary", () => {
  it("boardsNeededByVehicleLength ceil-divides total inches by vehicle cap", () => {
    expect(boardsNeededByVehicleLength(0, 96)).toBe(0);
    expect(boardsNeededByVehicleLength(96, 96)).toBe(1);
    expect(boardsNeededByVehicleLength(96.01, 96)).toBe(2);
    expect(boardsNeededByVehicleLength(10 * 12, 96)).toBe(2);
  });

  it("buildLumberVehicleRows packs each material group", () => {
    const parts: Part[] = [
      {
        id: "a",
        name: "Side A",
        assembly: "Case",
        quantity: 2,
        finished: { t: 1, w: 6, l: 48 },
        rough: { t: 1, w: 6, l: 48, manual: false },
        material: { label: "Oak", thicknessCategory: "4/4" },
        grainNote: "",
        status: "solid",
      },
    ];
    const groups = groupPartsByMaterial(parts, 0);
    const rows = buildLumberVehicleRows(groups, parts, 96, 0.125);
    expect(rows).toHaveLength(1);
    expect(rows[0]?.boardsByVehicleLength).toBe(1);
    // Two 48″ cuts do not both fit on one 96″ stick with kerf — pack uses two boards.
    expect(rows[0]?.packedBoards?.length).toBe(2);
    expect(partsInMaterialGroup(parts, rows[0]!.key)).toHaveLength(1);
  });
});
