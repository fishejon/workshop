import type { AssemblyId, MaterialSpec } from "@/lib/project-types";

/** Assemblies used together for a full dresser handoff (case shell + drawers). */
export const DRESSER_ASSEMBLIES: AssemblyId[] = ["Case", "Base", "Back", "Drawers"];

/** Default case / drawer box material line used by dresser and console stubs. */
export const DRESSER_PRIMARY_HARDWOOD_4_4: MaterialSpec = {
  label: "Primary hardwood",
  thicknessCategory: "4/4",
};

export const DRESSER_SLIDE_PRESETS = {
  sideMount: { label: "Side-mount slides (rule of thumb)", w: 0.5, h: 0.25 },
  tight: { label: "Tighter side-mount", w: 0.375, h: 0.1875 },
  undermount: { label: "Undermount (placeholder — verify mfg.)", w: 0.125, h: 0.75 },
  custom: { label: "Custom clearances", w: 0.5, h: 0.25 },
} as const;

export type DresserSlidePresetKey = keyof typeof DRESSER_SLIDE_PRESETS;

export const DRESSER_DRAWER_JOINERY_PRESETS = {
  none: { label: "No extra joinery allowance", w: 0, h: 0 },
  lockingRabbet: { label: "Locking rabbet / butt + tuning", w: 0.0625, h: 0 },
  dovetailHandfit: { label: "Dovetail (hand-fit slack)", w: 0.125, h: 0.03125 },
  custom: { label: "Custom joinery allowance", w: 0, h: 0 },
} as const;

export type DresserDrawerJoineryPresetKey = keyof typeof DRESSER_DRAWER_JOINERY_PRESETS;

/** Default row-opening height strings for a 3-row dresser planner (inches). */
export const DRESSER_DEFAULT_ROW_OPENING_HEIGHTS = ["10", "10", "10.25"] as const;

/** Rows shown in UI by default before user edits. */
export const DRESSER_DEFAULT_ROW_COUNT = 3;
