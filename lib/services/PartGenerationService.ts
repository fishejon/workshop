import { buildDresserCaseworkCarcass, computeDresserCaseworkEngine } from "@/lib/archetypes/casework";
import { DRESSER_PRIMARY_HARDWOOD_4_4 } from "@/lib/archetypes/assemblies";
import { buildDresserDrawerBoxParts } from "@/lib/dresser-drawer-parts";
import type { DrawerJoineryPresetId } from "@/lib/joinery/drawer-allowances";
import type { Part } from "@/lib/project-types";

export type DresserPartGenerationConfig = {
  outerWidth: number;
  outerHeight: number;
  outerDepth: number;
  materialThickness: number;
  dividerThickness: number;
  topPanelThickness: number;
  maxPurchasableBoardWidth: number;
  columnCount: 1 | 2 | 3;
  rowCount: number;
  rowOpeningHeightsInches: number[];
  kickHeight: number;
  topAssemblyHeight: number;
  bottomPanelThickness: number;
  railBetweenDrawers: number;
  backThickness: number;
  rearClearanceForBox: number;
  slideLengthNominal: number;
  slideWidthClearance: number;
  slideHeightClearance: number;
  drawerJoineryWidthAllowance: number;
  drawerJoineryHeightAllowance: number;
  /** Defaults to butt — must match `DresserPlanner` / `computeDresser` joinery preset. */
  drawerJoineryPreset?: DrawerJoineryPresetId;
};

export class PartGenerationService {
  generateDresserParts(config: DresserPartGenerationConfig): Omit<Part, "id">[] {
    const carcass = buildDresserCaseworkCarcass({
      outerWidth: config.outerWidth,
      outerHeight: config.outerHeight,
      outerDepth: config.outerDepth,
      materialThickness: config.materialThickness,
      dividerThickness: config.dividerThickness,
      topPanelThickness: config.topPanelThickness,
      maxPurchasableBoardWidth: config.maxPurchasableBoardWidth,
      columnCount: config.columnCount,
      kickHeight: config.kickHeight,
      topAssemblyHeight: config.topAssemblyHeight,
      bottomPanelThickness: config.bottomPanelThickness,
      rowCount: config.rowCount,
      railBetweenDrawers: config.railBetweenDrawers,
      backThickness: config.backThickness,
    });
    if (!carcass.ok) return [];

    const drawerMath = computeDresserCaseworkEngine({
      outerWidth: config.outerWidth,
      outerHeight: config.outerHeight,
      outerDepth: config.outerDepth,
      materialThickness: config.materialThickness,
      dividerThickness: config.dividerThickness,
      columnCount: config.columnCount,
      rowCount: config.rowCount,
      rowOpeningHeightsInches: config.rowOpeningHeightsInches,
      kickHeight: config.kickHeight,
      topAssemblyHeight: config.topAssemblyHeight,
      bottomPanelThickness: config.bottomPanelThickness,
      railBetweenDrawers: config.railBetweenDrawers,
      backThickness: config.backThickness,
      rearClearanceForBox: config.rearClearanceForBox,
      slideLengthNominal: config.slideLengthNominal,
      slideWidthClearance: config.slideWidthClearance,
      slideHeightClearance: config.slideHeightClearance,
      drawerJoineryWidthAllowance: config.drawerJoineryWidthAllowance,
      drawerJoineryHeightAllowance: config.drawerJoineryHeightAllowance,
      drawerJoineryPreset: config.drawerJoineryPreset ?? "butt",
    });
    if (!drawerMath.ok) return [];

    const caseParts: Omit<Part, "id">[] = carcass.parts.map((p) => ({
      name: p.name,
      assembly: p.assembly,
      quantity: p.quantity,
      finished: p.finished,
      rough: { t: 0, w: 0, l: 0, manual: false },
      material: DRESSER_PRIMARY_HARDWOOD_4_4,
      grainNote: p.grainNote ?? "",
      status: p.status,
    }));

    const drawerNoteBase = (cell: (typeof drawerMath.cells)[number]) =>
      `Box interior ${cell.boxWidth.toFixed(3)}" × ${cell.boxHeight.toFixed(3)}"; depth (slide run) ${cell.boxDepth.toFixed(3)} in · ${drawerMath.drawerJoineryApplied.provenance}`;

    const drawerPartOpts = {
      joineryPreset: drawerMath.drawerJoineryApplied.preset,
      joineryMaterialThickness: drawerMath.drawerJoineryApplied.materialThickness,
    };
    const drawerParts: Omit<Part, "id">[] = drawerMath.cells.flatMap((cell) =>
      buildDresserDrawerBoxParts(cell, config.materialThickness, drawerNoteBase(cell), drawerPartOpts).map(
        ({ id: _id, ...row }) => row
      )
    );

    return [...caseParts, ...drawerParts];
  }
}

export const partGenerationService = new PartGenerationService();
