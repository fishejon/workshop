import { describe, expect, it } from "vitest";
import { buildDresserCaseworkCarcass } from "@/lib/archetypes/casework";
import { DRESSER_PRIMARY_HARDWOOD_4_4 } from "@/lib/archetypes/assemblies";
import { DRESSER_REGRESSION_CARCASS_INPUT, DRESSER_REGRESSION_PROJECT } from "@/lib/fixtures/dresser-regression.fixture";
import { buildCaseOutlineFromProject } from "@/lib/geometry/case-outline-from-project";
import { inferDresserCaseOutlineFromParts } from "@/lib/geometry/infer-dresser-outline";
import type { Part } from "@/lib/project-types";

function carcassPartsToProjectParts(): Part[] {
  const carcass = buildDresserCaseworkCarcass(DRESSER_REGRESSION_CARCASS_INPUT);
  if (carcass.ok !== true) throw new Error("expected carcass ok");
  return carcass.parts.map((p, i) => ({
    id: `car-${i}`,
    name: p.name,
    assembly: p.assembly,
    quantity: p.quantity,
    finished: p.finished,
    rough: { t: 0, w: 0, l: 0, manual: false },
    material: DRESSER_PRIMARY_HARDWOOD_4_4,
    grainNote: p.grainNote ?? "",
    status: p.status,
  }));
}

function drawerBoxParts(columnCount: number, rowCount: number): Part[] {
  const out: Part[] = [];
  let id = 0;
  for (let c = 1; c <= columnCount; c += 1) {
    for (let r = 1; r <= rowCount; r += 1) {
      out.push({
        id: `dr-${id++}`,
        name: `Drawer box (Col ${c} · Row ${r})`,
        assembly: "Drawers",
        quantity: 1,
        finished: { t: 0.5, w: 10, l: 8 },
        rough: { t: 0, w: 0, l: 0, manual: false },
        material: DRESSER_PRIMARY_HARDWOOD_4_4,
        grainNote: "",
        status: "needs_milling",
      });
    }
  }
  return out;
}

describe("inferDresserCaseOutlineFromParts", () => {
  it("returns null when dresser stack metadata is missing", () => {
    expect(inferDresserCaseOutlineFromParts(DRESSER_REGRESSION_PROJECT.parts)).toBeNull();
  });

  it("returns null without dresser carcass", () => {
    expect(inferDresserCaseOutlineFromParts([])).toBeNull();
  });

  it("infers outline from generated carcass + drawer labels", () => {
    const parts = [...carcassPartsToProjectParts(), ...drawerBoxParts(2, 3)];
    const outline = inferDresserCaseOutlineFromParts(parts);
    expect(outline).not.toBeNull();
    expect(outline!.outerW).toBe(72);
    expect(outline!.outerH).toBe(34);
    expect(outline!.outerD).toBe(20);
    expect(outline!.columnCount).toBe(2);
    expect(outline!.rowCount).toBe(3);
    expect(outline!.kickH).toBe(4);
    expect(outline!.bottomBand).toBe(0.75);
    expect(outline!.rail).toBe(1);
    expect(outline!.topBand).toBeCloseTo(1.5, 5);
    expect(outline!.rowOpeningHeightsInches).toHaveLength(3);
    const sumOpenings =
      outline!.rowOpeningHeightsInches.reduce((a, b) => a + b, 0) + 2 * outline!.rail;
    expect(sumOpenings).toBeCloseTo(27.75, 5);
  });
});

describe("buildCaseOutlineFromProject", () => {
  it("delegates to parts inference", () => {
    const parts = [...carcassPartsToProjectParts(), ...drawerBoxParts(2, 3)];
    const outline = buildCaseOutlineFromProject({
      ...DRESSER_REGRESSION_PROJECT,
      parts,
    });
    expect(outline?.outerW).toBe(72);
  });
});
