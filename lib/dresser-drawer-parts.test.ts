import { describe, expect, it } from "vitest";
import {
  buildDresserDrawerBoxParts,
  dresserDrawerCellLabelFromPartName,
  drawerSideStockThickness,
} from "@/lib/dresser-drawer-parts";
import type { DrawerCellResult } from "@/lib/dresser-engine";

describe("dresserDrawerCellLabelFromPartName", () => {
  it("parses cell tag from drawer component names", () => {
    expect(dresserDrawerCellLabelFromPartName(`Drawer front (Col 2 · Row 3)`)).toBe("Col 2 · Row 3");
    expect(dresserDrawerCellLabelFromPartName("Drawer side (Col 1 · Row 1)")).toBe("Col 1 · Row 1");
    expect(dresserDrawerCellLabelFromPartName("Case side (left)")).toBeNull();
  });
});

describe("drawerSideStockThickness", () => {
  it("uses ½″ secondary for butt and rabbet", () => {
    expect(drawerSideStockThickness("butt", 0.75)).toBe(0.5);
    expect(drawerSideStockThickness("rabbet", 0.875)).toBe(0.5);
  });

  it("uses primary joinery thickness for dovetail presets", () => {
    expect(drawerSideStockThickness("dovetail_full_overlap", 0.75)).toBe(0.75);
    expect(drawerSideStockThickness("dovetail_half_lap", 0.625)).toBe(0.625);
  });
});

describe("buildDresserDrawerBoxParts", () => {
  const cell: DrawerCellResult = {
    columnIndex: 0,
    rowIndex: 0,
    label: "Col 1 · Row 1",
    openingWidth: 20,
    openingHeight: 8,
    boxWidth: 18.5,
    boxHeight: 7.25,
    boxDepth: 16,
  };

  const buttOpts = { joineryPreset: "butt" as const, joineryMaterialThickness: 0.75 };

  it("emits front, paired sides, back, and bottom with stable ids", () => {
    const parts = buildDresserDrawerBoxParts(cell, 0.75, "test note", buttOpts);
    expect(parts.map((p) => p.id)).toEqual([
      "dresser-dr-c0-r0-front",
      "dresser-dr-c0-r0-side",
      "dresser-dr-c0-r0-back",
      "dresser-dr-c0-r0-bottom",
    ]);
    expect(parts.find((p) => p.name.includes("side"))?.quantity).toBe(2);
    expect(parts.every((p) => p.finished.t > 0 && p.finished.w > 0 && p.finished.l > 0)).toBe(true);
  });

  it("sizes back and bottom to box interior width for butt joinery", () => {
    const parts = buildDresserDrawerBoxParts(cell, 0.75, "test", buttOpts);
    const sideT = 0.5;
    const back = parts.find((p) => p.name.includes("back"))!;
    const bottom = parts.find((p) => p.name.includes("bottom"))!;
    expect(back.finished.l).toBeCloseTo(cell.boxWidth - 2 * sideT, 5);
    expect(bottom.finished.l).toBeCloseTo(cell.boxWidth - 2 * sideT, 5);
  });

  it("uses thicker sides for dovetail stock rule", () => {
    const dovetailOpts = { joineryPreset: "dovetail_full_overlap" as const, joineryMaterialThickness: 0.75 };
    const parts = buildDresserDrawerBoxParts(cell, 0.75, "test", dovetailOpts);
    const side = parts.find((p) => p.name.includes("side"))!;
    expect(side.finished.t).toBe(0.75);
    const back = parts.find((p) => p.name.includes("back"))!;
    expect(back.finished.l).toBeCloseTo(cell.boxWidth - 2 * 0.75, 5);
  });
});
