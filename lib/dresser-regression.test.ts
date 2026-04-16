import { describe, expect, it } from "vitest";
import { groupPartsByMaterial } from "./board-feet";
import { buildDresserCarcassParts } from "./dresser-carcass";
import { computeDresser } from "./dresser-engine";
import {
  DRESSER_REGRESSION_CARCASS_INPUT,
  DRESSER_REGRESSION_ENGINE_VARIANTS,
  DRESSER_REGRESSION_PROJECT,
} from "./fixtures/dresser-regression.fixture";
import { applyDadoShelfWidth } from "./joinery/dado-shelf";
import { applyGrooveForQuarterBackPanel } from "./joinery/groove-back";
import { derivePartAssumptionsDetailed } from "./part-assumptions";

describe("dresser regression fixture", () => {
  it("keeps dresser carcass core outputs stable", () => {
    const result = buildDresserCarcassParts(DRESSER_REGRESSION_CARCASS_INPUT);
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.drawerZoneHeight).toBeCloseTo(27.75, 5);
    expect(result.parts).toHaveLength(7);

    expect(result.parts.find((part) => part.name === "Case top")?.finished).toEqual({
      t: 0.75,
      w: 20,
      l: 72,
    });
    expect(result.parts.find((part) => part.name === "Case bottom")?.finished).toEqual({
      t: 0.75,
      w: 20,
      l: 72,
    });
    expect(result.parts.find((part) => part.name === "Case back")?.finished).toEqual({
      t: 0.25,
      w: 27.75,
      l: 70.5,
    });
    expect(result.parts.filter((part) => part.name.startsWith("Case divider"))).toHaveLength(1);
  });

  it("applies joinery dimensional deltas predictably on fixture dimensions", () => {
    const back = DRESSER_REGRESSION_PROJECT.parts.find((part) => part.id === "case-back");
    expect(back).toBeDefined();
    if (!back) return;

    const groove = applyGrooveForQuarterBackPanel({
      grooveDepth: 0.25,
      panelThickness: back.finished.t,
    });
    expect(groove.finishedDimensionDeltas).toEqual({ t: 0, w: -0.5, l: -0.5 });
    expect({
      t: back.finished.t + groove.finishedDimensionDeltas.t,
      w: back.finished.w + groove.finishedDimensionDeltas.w,
      l: back.finished.l + groove.finishedDimensionDeltas.l,
    }).toEqual({ t: 0.25, w: 70, l: 27.25 });

    const dado = applyDadoShelfWidth({ dadoDepth: 0.375 });
    expect(dado.finishedDimensionDeltas).toEqual({ t: 0, w: -0.75, l: 0 });
    const shelfOpeningWidth = 34.5;
    expect(shelfOpeningWidth + dado.finishedDimensionDeltas.w).toBeCloseTo(33.75, 5);
  });

  it("keeps grouped board-feet and lineal-feet totals stable from fixture parts", () => {
    const groups = groupPartsByMaterial(
      DRESSER_REGRESSION_PROJECT.parts,
      DRESSER_REGRESSION_PROJECT.wasteFactorPercent
    );
    expect(groups).toHaveLength(2);

    const oak = groups.find((group) => group.materialLabel === "White oak");
    expect(oak).toBeDefined();
    if (oak) {
      expect(oak.subtotalBoardFeet).toBeCloseTo(19.444444, 5);
      expect(oak.adjustedBoardFeet).toBeCloseTo(22.361111, 5);
      expect(oak.subtotalLinearFeet).toBeCloseTo(7.333333, 5);
      expect(oak.adjustedLinearFeet).toBeCloseTo(8.433333, 5);
    }

    const birch = groups.find((group) => group.materialLabel === "Baltic birch");
    expect(birch).toBeDefined();
    if (birch) {
      expect(birch.subtotalBoardFeet).toBeCloseTo(3.396484, 5);
      expect(birch.adjustedBoardFeet).toBeCloseTo(3.905957, 5);
      expect(birch.subtotalLinearFeet).toBeCloseTo(2.3125, 5);
      expect(birch.adjustedLinearFeet).toBeCloseTo(2.659375, 5);
    }
  });

  it("keeps drawer allowance variants stable for full-overlap and half-lap dovetails", () => {
    const fullOverlap = computeDresser(DRESSER_REGRESSION_ENGINE_VARIANTS.fullOverlapDovetail);
    const halfLap = computeDresser(DRESSER_REGRESSION_ENGINE_VARIANTS.halfLapDovetail);
    expect(fullOverlap.ok).toBe(true);
    expect(halfLap.ok).toBe(true);
    if (!fullOverlap.ok || !halfLap.ok) return;

    expect(fullOverlap.cells[0]?.boxWidth).toBeCloseTo(33.375, 5);
    expect(halfLap.cells[0]?.boxWidth).toBeCloseTo(33.875, 5);
    expect(halfLap.cells[0]?.boxWidth).toBeCloseTo((fullOverlap.cells[0]?.boxWidth ?? 0) + 0.5, 5);
    expect(fullOverlap.cells[0]?.boxHeight).toBeCloseTo(8.25, 5);
    expect(halfLap.cells[0]?.boxHeight).toBeCloseTo(8.25, 5);
    expect(fullOverlap.drawerJoineryApplied.formulaId).toBe("width=2*t");
    expect(halfLap.drawerJoineryApplied.formulaId).toBe("width=2*half_lap_depth");
    expect(halfLap.drawerJoineryApplied.provenance).toMatch(/halfLapDepthSide=0.250in/);
  });

  it("keeps multi-column support thickness behavior stable", () => {
    const multiColumn = computeDresser(DRESSER_REGRESSION_ENGINE_VARIANTS.multiColumnSupportThickness);
    expect(multiColumn.ok).toBe(true);
    if (!multiColumn.ok) return;

    expect(multiColumn.columnInnerWidth).toBeCloseTo(22.833333, 5);
    expect(multiColumn.cells).toHaveLength(9);
    expect(multiColumn.cells[0]?.openingWidth).toBeCloseTo(22.833333, 5);
  });

  it("marks glue-up-required assumption for wide panel fixture parts", () => {
    const back = DRESSER_REGRESSION_PROJECT.parts.find((part) => part.id === "case-back");
    expect(back).toBeDefined();
    if (!back) return;

    const assumptions = derivePartAssumptionsDetailed(
      back,
      DRESSER_REGRESSION_PROJECT.joints,
      DRESSER_REGRESSION_PROJECT
    );
    expect(assumptions.assumptions.glueUp).toMatch(/Glue-up required assumption/);
    expect(assumptions.assumptions.glueUp).toMatch(/70\.500"/);
    expect(assumptions.assumptions.glueUp).toMatch(/max board width/);
    expect(assumptions.provenanceSummary).toMatch(/Rough source/);
    expect(assumptions.glueUpPlan.required).toBe(true);
    expect(assumptions.glueUpPlan.boardWidthSource).toBe("project_setting");
  });
});
