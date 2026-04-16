import { buildDresserCaseworkCarcass, computeDresserCaseworkEngine } from "@/lib/archetypes/casework";
import { DRESSER_PRIMARY_HARDWOOD_4_4 } from "@/lib/archetypes/assemblies";
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

    const drawerParts: Omit<Part, "id">[] = drawerMath.cells.map((cell) => ({
      name: `Drawer box (${cell.label})`,
      assembly: "Drawers",
      quantity: 1,
      finished: { t: 0.5, w: cell.boxWidth, l: cell.boxHeight },
      rough: { t: 0, w: 0, l: 0, manual: false },
      material: DRESSER_PRIMARY_HARDWOOD_4_4,
      grainNote: `Depth (slide run) ${cell.boxDepth.toFixed(3)} in`,
      status: "needs_milling",
    }));

    return [...caseParts, ...drawerParts];
  }
}

export const partGenerationService = new PartGenerationService();
