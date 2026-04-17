import { DRESSER_PRIMARY_HARDWOOD_4_4 } from "@/lib/archetypes/assemblies";
import type { DrawerCellResult } from "@/lib/dresser-engine";
import {
  DRAWER_JOINERY_PRESET_META,
  type DrawerJoineryPresetId,
} from "@/lib/joinery/drawer-allowances";
import type { MaterialSpec, Part, PartStatus } from "@/lib/project-types";

/** Typical ½″ secondary for butt- or rabbeted four-corner boxes. */
const SECONDARY_BOX_THICKNESS = 0.5;
const BOTTOM_THICKNESS = 0.25;
/** Leave a little run-out behind the drawer box for slide stops / variance. */
const BOTTOM_DEPTH_CLEARANCE_IN = 0.25;

const DRAWER_BOTTOM_MATERIAL: MaterialSpec = {
  label: "Drawer bottom (ply / hardboard)",
  thicknessCategory: "1/4 ply",
};

/**
 * Matches dresser drawer component names from `buildDresserDrawerBoxParts`.
 * Captures the stable cell tag, e.g. `Col 2 · Row 3`.
 */
export const DRESSER_DRAWER_CELL_IN_NAME_RE = /^Drawer \w+ \((Col \d+ · Row \d+)\)\s*$/;

export function dresserDrawerCellLabelFromPartName(name: string): string | null {
  const m = name.match(DRESSER_DRAWER_CELL_IN_NAME_RE);
  return m ? m[1] : null;
}

export type DresserDrawerBoxPartOptions = {
  /** Same preset passed to `computeDresser` joinery allowances — drives side/back stock thickness. */
  joineryPreset: DrawerJoineryPresetId;
  /** Thickness used for dovetail math in the engine (usually case side thickness). */
  joineryMaterialThickness: number;
};

/**
 * Side/back net thickness: dovetails use primary joinery stock; butt/rabbet use ½″ secondary.
 */
export function drawerSideStockThickness(
  preset: DrawerJoineryPresetId,
  joineryMaterialThickness: number
): number {
  const t = Number.isFinite(joineryMaterialThickness) ? Math.max(0.125, joineryMaterialThickness) : SECONDARY_BOX_THICKNESS;
  if (preset === "dovetail_full_overlap" || preset === "dovetail_half_lap") {
    return Math.min(t, 1.25);
  }
  return SECONDARY_BOX_THICKNESS;
}

/**
 * Five-piece drawer box line items. Interior sizes use **box** W/H/D from the engine; false front uses
 * **opening** W/H. Side/back stock thickness follows the same joinery preset as opening→box allowances.
 */
export function buildDresserDrawerBoxParts(
  cell: DrawerCellResult,
  materialThickness: number,
  drawerNote: string,
  options: DresserDrawerBoxPartOptions
): Array<Omit<Part, "id"> & { id: string }> {
  const ow = cell.openingWidth;
  const oh = cell.openingHeight;
  const bw = cell.boxWidth;
  const bh = cell.boxHeight;
  const bd = cell.boxDepth;
  const st = drawerSideStockThickness(options.joineryPreset, options.joineryMaterialThickness);
  const ft = materialThickness;
  const tag = cell.label;
  const base = `dresser-dr-c${cell.columnIndex}-r${cell.rowIndex}`;
  const presetNote = DRAWER_JOINERY_PRESET_META[options.joineryPreset].label;
  const grainHead =
    `${drawerNote} Opening ${ow.toFixed(3)}" × ${oh.toFixed(3)}"; box interior ${bw.toFixed(3)}" × ${bh.toFixed(3)}"; depth (slide run) ${bd.toFixed(3)}". Part stock: sides/back at ${st.toFixed(3)}" (${presetNote}).`;

  const sideH = Math.max(0.125, bh);
  const backL = Math.max(0.125, bw - 2 * st);
  const bottomW = Math.max(0.125, bd - BOTTOM_DEPTH_CLEARANCE_IN);
  const bottomL = backL;

  const solid: PartStatus = "needs_milling";
  const bottomStatus: PartStatus = "panel";

  return [
    {
      id: `${base}-front`,
      name: `Drawer front (${tag})`,
      assembly: "Drawers",
      quantity: 1,
      finished: { t: ft, w: oh, l: ow },
      rough: { t: 0, w: 0, l: 0, manual: false },
      material: DRESSER_PRIMARY_HARDWOOD_4_4,
      grainNote: `False front / show face. ${grainHead}`,
      status: solid,
    },
    {
      id: `${base}-side`,
      name: `Drawer side (${tag})`,
      assembly: "Drawers",
      quantity: 2,
      finished: { t: st, w: sideH, l: bd },
      rough: { t: 0, w: 0, l: 0, manual: false },
      material: DRESSER_PRIMARY_HARDWOOD_4_4,
      grainNote: `Pair — grain runs along depth. ${grainHead}`,
      status: solid,
    },
    {
      id: `${base}-back`,
      name: `Drawer back (${tag})`,
      assembly: "Drawers",
      quantity: 1,
      finished: { t: st, w: sideH, l: backL },
      rough: { t: 0, w: 0, l: 0, manual: false },
      material: DRESSER_PRIMARY_HARDWOOD_4_4,
      grainNote: `Between sides. ${grainHead}`,
      status: solid,
    },
    {
      id: `${base}-bottom`,
      name: `Drawer bottom (${tag})`,
      assembly: "Drawers",
      quantity: 1,
      finished: { t: BOTTOM_THICKNESS, w: bottomW, l: bottomL },
      rough: { t: 0, w: 0, l: 0, manual: false },
      material: DRAWER_BOTTOM_MATERIAL,
      grainNote: `Ply or hardboard — verify groove / bottom mount. ${grainHead}`,
      status: bottomStatus,
    },
  ];
}
