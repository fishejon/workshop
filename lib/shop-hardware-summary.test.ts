import { describe, expect, it } from "vitest";
import { summarizeDrawerHardwareFromParts } from "@/lib/shop-hardware-summary";
import type { Part } from "@/lib/project-types";

function drawer(name: string, qty: number, id: string): Part {
  return {
    id,
    name,
    assembly: "Drawers",
    quantity: qty,
    finished: { t: 0.5, w: 10, l: 8 },
    rough: { t: 0, w: 0, l: 0, manual: false },
    material: { label: "Oak", thicknessCategory: "4/4" },
    grainNote: "",
    status: "needs_milling",
  };
}

describe("summarizeDrawerHardwareFromParts", () => {
  it("counts drawer box rows and quantities", () => {
    const parts: Part[] = [
      drawer("Drawer box (Col 1 · Row 1)", 1, "1"),
      drawer("Drawer box (Col 2 · Row 1)", 2, "2"),
      {
        id: "3",
        name: "Case top",
        assembly: "Case",
        quantity: 1,
        finished: { t: 0.75, w: 48, l: 18 },
        rough: { t: 0, w: 0, l: 0, manual: false },
        material: { label: "Oak", thicknessCategory: "4/4" },
        grainNote: "",
        status: "solid",
      },
    ];
    const s = summarizeDrawerHardwareFromParts(parts);
    expect(s.drawerBoxLineCount).toBe(2);
    expect(s.drawerBoxPartCount).toBe(3);
  });

  it("returns zeros when no drawer boxes", () => {
    expect(summarizeDrawerHardwareFromParts([]).drawerBoxLineCount).toBe(0);
  });
});
