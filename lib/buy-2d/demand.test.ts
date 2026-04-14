import { describe, expect, it } from "vitest";
import type { Part } from "../project-types";
import { demandPiecesForPart, demandPiecesForParts } from "./demand";

function part(over: Partial<Part> & Pick<Part, "id" | "name">): Part {
  return {
    id: over.id,
    name: over.name,
    assembly: over.assembly ?? "Case",
    quantity: over.quantity ?? 1,
    finished: over.finished ?? { t: 0.75, w: 5.5, l: 48 },
    rough: over.rough ?? { t: 1, w: 6, l: 48, manual: false },
    material: over.material ?? { label: "Oak", thicknessCategory: "4/4" },
    grainNote: "",
    status: over.status ?? "solid",
  };
}

describe("demandPiecesForPart", () => {
  it("expands solid quantity into one row with rough W×L", () => {
    const rows = demandPiecesForPart(
      part({ id: "a", name: "Stile", quantity: 3, rough: { t: 1, w: 4, l: 36, manual: false } }),
      20
    );
    expect(rows).toHaveLength(1);
    expect(rows[0]!.widthInches).toBe(4);
    expect(rows[0]!.lengthInches).toBe(36);
    expect(rows[0]!.quantity).toBe(3);
    expect(rows[0]!.source).toBe("solid");
  });

  it("skips invalid rough dimensions", () => {
    expect(demandPiecesForPart(part({ id: "b", name: "Bad", rough: { t: 1, w: 0, l: 10, manual: false } }), 20)).toEqual(
      []
    );
  });

  it("splits panel into glue-up strips using finished width", () => {
    const rows = demandPiecesForPart(
      part({
        id: "p",
        name: "Top",
        status: "panel",
        quantity: 1,
        finished: { t: 0.75, w: 24, l: 48 },
        rough: { t: 1, w: 25, l: 49, manual: false },
      }),
      10
    );
    expect(rows.length).toBeGreaterThan(1);
    expect(rows.every((r) => r.source === "panel_strip")).toBe(true);
    expect(rows.every((r) => r.lengthInches === 49)).toBe(true);
    expect(rows.reduce((s, r) => s + r.widthInches, 0)).toBeCloseTo(24, 1);
  });
});

describe("demandPiecesForParts", () => {
  it("aggregates multiple parts", () => {
    const rows = demandPiecesForParts(
      [
        part({ id: "1", name: "A", material: { label: "Oak", thicknessCategory: "4/4" } }),
        part({
          id: "2",
          name: "B",
          material: { label: "Walnut", thicknessCategory: "4/4" },
          rough: { t: 1, w: 3, l: 12, manual: false },
        }),
      ],
      20
    );
    expect(rows.length).toBeGreaterThanOrEqual(2);
  });
});
