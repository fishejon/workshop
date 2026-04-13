import { describe, expect, it } from "vitest";
import {
  boardFeetForPart,
  groupPartsByMaterial,
  linearFeetForPart,
  totalAdjustedBoardFeet,
  totalAdjustedLinearFeet,
  totalBoardFeet,
  totalLinearFeet,
} from "./board-feet";
import type { Part } from "./project-types";

function samplePart(over: Partial<Part> & Pick<Part, "id" | "name">): Part {
  return {
    id: over.id,
    name: over.name,
    assembly: over.assembly ?? "Case",
    quantity: over.quantity ?? 1,
    finished: over.finished ?? { t: 0.75, w: 5.5, l: 48 },
    rough: over.rough ?? { t: 1, w: 6, l: 48, manual: false },
    material: over.material ?? { label: "White oak", thicknessCategory: "4/4" },
    grainNote: over.grainNote ?? "",
    status: over.status ?? "solid",
  };
}

describe("boardFeetForPart", () => {
  it("computes BF from rough T×W×L / 144", () => {
    const p = samplePart({
      id: "a",
      name: "Side",
      rough: { t: 1, w: 6, l: 96, manual: false },
    });
    expect(boardFeetForPart(p)).toBeCloseTo((1 * 6 * 96) / 144, 5);
  });
});

describe("linearFeetForPart", () => {
  it("is rough L / 12", () => {
    const p = samplePart({ id: "b", name: "Rail", rough: { t: 1, w: 4, l: 36, manual: false } });
    expect(linearFeetForPart(p)).toBe(3);
  });
});

describe("groupPartsByMaterial", () => {
  it("aggregates BF and LF with waste on groups", () => {
    const parts: Part[] = [
      samplePart({
        id: "1",
        name: "A",
        quantity: 2,
        rough: { t: 1, w: 6, l: 12, manual: false },
        material: { label: "Oak", thicknessCategory: "4/4" },
      }),
      samplePart({
        id: "2",
        name: "B",
        quantity: 1,
        rough: { t: 1, w: 6, l: 24, manual: false },
        material: { label: "Oak", thicknessCategory: "4/4" },
      }),
    ];
    const groups = groupPartsByMaterial(parts, 10);
    expect(groups).toHaveLength(1);
    const g = groups[0]!;
    expect(g.subtotalLinearFeet).toBeCloseTo(2 * 1 + 2, 5);
    expect(g.adjustedLinearFeet).toBeCloseTo(g.subtotalLinearFeet * 1.1, 5);
    expect(totalBoardFeet(groups)).toBeCloseTo(g.subtotalBoardFeet, 5);
    expect(totalLinearFeet(groups)).toBeCloseTo(g.subtotalLinearFeet, 5);
    expect(totalAdjustedBoardFeet(groups)).toBeCloseTo(g.adjustedBoardFeet, 5);
    expect(totalAdjustedLinearFeet(groups)).toBeCloseTo(g.adjustedLinearFeet, 5);
    expect(g.lines[0]!.linearFeetTotal).toBeCloseTo(2, 5);
  });
});
