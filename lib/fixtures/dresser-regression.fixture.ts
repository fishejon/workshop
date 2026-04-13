import type { DresserCarcassInput } from "../dresser-carcass";
import type { DresserEngineInput } from "../dresser-engine";
import { computeDrawerJoineryAllowances } from "../joinery/drawer-allowances";
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
  id: "fixture-dresser-regression",
  version: 1,
  name: "Canonical dresser regression fixture",
  millingAllowanceInches: 0.5,
  maxTransportLengthInches: 96,
  wasteFactorPercent: 15,
  costRatesByGroup: {},
  parts: DRESSER_REGRESSION_PARTS,
  joints: [],
  connections: [],
  checkpoints: {
    materialAssumptionsReviewed: false,
    joineryReviewed: false,
  },
  workshop: {
    lumberProfile: "s4s_hardwood",
    offcutMode: "none",
  },
};

export const DRESSER_REGRESSION_ENGINE_BASE: DresserEngineInput = {
  outerWidth: 72,
  outerHeight: 34,
  outerDepth: 20,
  materialThickness: 0.75,
  columnCount: 2,
  rowCount: 3,
  rowOpeningHeightsInches: [8.5, 8.5, 8.75],
  kickHeight: 4,
  topAssemblyHeight: 1.5,
  bottomPanelThickness: 0.75,
  railBetweenDrawers: 1,
  backThickness: 0.25,
  rearClearanceForBox: 0.5,
  slideLengthNominal: 22,
  slideWidthClearance: 0.5,
  slideHeightClearance: 0.25,
  drawerJoineryWidthAllowance: 0,
  drawerJoineryHeightAllowance: 0,
};

export const DRESSER_REGRESSION_ENGINE_VARIANTS = {
  fullOverlapDovetail: {
    ...DRESSER_REGRESSION_ENGINE_BASE,
    drawerJoineryWidthAllowance: computeDrawerJoineryAllowances({
      preset: "dovetail_full_overlap",
      materialThickness: 0.5,
    }).widthAllowance,
    drawerJoineryHeightAllowance: computeDrawerJoineryAllowances({
      preset: "dovetail_full_overlap",
      materialThickness: 0.5,
    }).heightAllowance,
  } satisfies DresserEngineInput,
  halfLapDovetail: {
    ...DRESSER_REGRESSION_ENGINE_BASE,
    drawerJoineryWidthAllowance: computeDrawerJoineryAllowances({
      preset: "dovetail_half_lap",
      materialThickness: 0.5,
      halfLapDepth: 0.25,
    }).widthAllowance,
    drawerJoineryHeightAllowance: computeDrawerJoineryAllowances({
      preset: "dovetail_half_lap",
      materialThickness: 0.5,
      halfLapDepth: 0.25,
    }).heightAllowance,
  } satisfies DresserEngineInput,
  multiColumnSupportThickness: {
    ...DRESSER_REGRESSION_ENGINE_BASE,
    materialThickness: 0.875,
    columnCount: 3,
  } satisfies DresserEngineInput,
} as const;
