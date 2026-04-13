import type { DresserCarcassInput } from "../dresser-carcass";
import type { Part, Project } from "../project-types";

export const DRESSER_REGRESSION_CARCASS_INPUT: DresserCarcassInput = {
  outerWidth: 72,
  outerHeight: 34,
  outerDepth: 20,
  materialThickness: 0.75,
  columnCount: 2,
  kickHeight: 4,
  topAssemblyHeight: 1.5,
  bottomPanelThickness: 0.75,
  rowCount: 3,
  railBetweenDrawers: 1,
  backThickness: 0.25,
};

export const DRESSER_REGRESSION_PARTS: Part[] = [
  {
    id: "case-side",
    name: "Case side",
    assembly: "Case",
    quantity: 2,
    finished: { t: 0.75, w: 20, l: 34 },
    rough: { t: 1, w: 20, l: 34, manual: true },
    material: { label: "White oak", thicknessCategory: "4/4" },
    grainNote: "Grain vertical",
    status: "solid",
  },
  {
    id: "case-top",
    name: "Case top",
    assembly: "Case",
    quantity: 1,
    finished: { t: 0.75, w: 72, l: 20 },
    rough: { t: 1, w: 72, l: 20, manual: true },
    material: { label: "White oak", thicknessCategory: "4/4" },
    grainNote: "Grain along width",
    status: "solid",
  },
  {
    id: "case-back",
    name: "Case back",
    assembly: "Back",
    quantity: 1,
    finished: { t: 0.25, w: 70.5, l: 27.75 },
    rough: { t: 0.25, w: 70.5, l: 27.75, manual: true },
    material: { label: "Baltic birch", thicknessCategory: "1/4 ply" },
    grainNote: "Panel grain vertical",
    status: "panel",
  },
];

export const DRESSER_REGRESSION_PROJECT: Project = {
  version: 1,
  name: "Canonical dresser regression fixture",
  millingAllowanceInches: 0.5,
  maxTransportLengthInches: 96,
  wasteFactorPercent: 15,
  parts: DRESSER_REGRESSION_PARTS,
  joints: [],
};
