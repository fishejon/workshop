import type { Part } from "@/lib/project-types";
import type {
  FurnitureConfig,
  GeneratedOpening,
  OpeningConfig,
} from "@/lib/types/furniture-config";

const SECONDARY_THICKNESS = 0.5;
const BOTTOM_THICKNESS = 0.25;

function primaryMaterial(config: FurnitureConfig) {
  return {
    label: config.material.primary.species,
    thicknessCategory: config.material.primary.surfaced ? "4/4" : "Rough",
  };
}

function secondaryMaterial(config: FurnitureConfig) {
  const species = config.material.secondary?.species ?? "Plywood";
  return {
    label: species,
    thicknessCategory: species.toLowerCase().includes("ply") ? "1/4 ply" : "4/4",
  };
}

function openingArea(config: FurnitureConfig) {
  const t = config.dimensions.materialThickness;
  const topOverhang = config.features?.topOverhang ?? 0;
  const height = config.dimensions.height - t * 2 - (config.features?.baseHeight ?? 0);
  const width = config.dimensions.width - t * 2 - topOverhang * 2;
  const depth = config.dimensions.depth - t;
  return { height: Math.max(0, height), width: Math.max(0, width), depth: Math.max(0, depth) };
}

export class CaseworkGenerationService {
  generateParts(config: FurnitureConfig): Part[] {
    const parts: Part[] = [];
    parts.push(...this.generateCarcassParts(config));
    if (config.construction.dividers?.length) parts.push(...this.generateDividers(config));
    if (config.construction.faceFrame) parts.push(...this.generateFaceFrame(config));
    for (const opening of config.openings) {
      parts.push(...this.generateOpeningParts(opening, config));
    }
    if (config.construction.backPanel !== "none") {
      parts.push(this.generateBackPanel(config));
    }
    return parts;
  }

  calculateOpenings(config: FurnitureConfig): GeneratedOpening[] {
    const area = openingArea(config);
    const rows = Math.max(...config.openings.map((opening) => opening.position.row + (opening.position.rowSpan ?? 1)), 1);
    const columns = Math.max(...config.openings.map((opening) => opening.position.column + (opening.position.columnSpan ?? 1)), 1);
    const rowHeight = area.height / rows;
    const colWidth = area.width / columns;
    return config.openings.map((opening) => {
      const rowSpan = opening.position.rowSpan ?? 1;
      const colSpan = opening.position.columnSpan ?? 1;
      return {
        id: opening.id,
        type: opening.type,
        height: opening.size.height ?? rowHeight * rowSpan,
        width: opening.size.width ?? colWidth * colSpan,
        depth: opening.size.depth ?? area.depth,
      };
    });
  }

  generateCarcassParts(config: FurnitureConfig): Part[] {
    const { height, width, depth, materialThickness } = config.dimensions;
    const overhang = config.features?.topOverhang ?? 0;
    const mat = primaryMaterial(config);
    return [
      {
        id: "case-side-left",
        name: "Case side (left)",
        assembly: "Case",
        quantity: 1,
        finished: { t: materialThickness, w: depth, l: height },
        rough: { t: materialThickness, w: depth, l: height, manual: false },
        material: mat,
        grainNote: "",
        status: "solid",
      },
      {
        id: "case-side-right",
        name: "Case side (right)",
        assembly: "Case",
        quantity: 1,
        finished: { t: materialThickness, w: depth, l: height },
        rough: { t: materialThickness, w: depth, l: height, manual: false },
        material: mat,
        grainNote: "",
        status: "solid",
      },
      {
        id: "case-top",
        name: "Case top",
        assembly: "Case",
        quantity: 1,
        finished: { t: materialThickness, w: depth + overhang, l: width + overhang * 2 },
        rough: { t: materialThickness, w: depth + overhang, l: width + overhang * 2, manual: false },
        material: mat,
        grainNote: "",
        status: "solid",
      },
      {
        id: "case-bottom",
        name: "Case bottom",
        assembly: "Case",
        quantity: 1,
        finished: { t: materialThickness, w: depth - materialThickness, l: width - materialThickness * 2 },
        rough: { t: materialThickness, w: depth - materialThickness, l: width - materialThickness * 2, manual: false },
        material: mat,
        grainNote: "",
        status: "solid",
      },
    ];
  }

  generateDividers(config: FurnitureConfig): Part[] {
    const parts: Part[] = [];
    const mat = primaryMaterial(config);
    const { height, width, depth, materialThickness } = config.dimensions;
    for (const divider of config.construction.dividers ?? []) {
      const isVertical = divider.orientation === "vertical";
      parts.push({
        id: `divider-${divider.orientation}-${divider.position}`,
        name: `${isVertical ? "Vertical" : "Horizontal"} divider`,
        assembly: "Case",
        quantity: 1,
        finished: {
          t: divider.thickness,
          w: isVertical ? depth - materialThickness : depth - materialThickness,
          l: isVertical ? height - materialThickness * 2 : width - materialThickness * 2,
        },
        rough: {
          t: divider.thickness,
          w: isVertical ? depth - materialThickness : depth - materialThickness,
          l: isVertical ? height - materialThickness * 2 : width - materialThickness * 2,
          manual: false,
        },
        material: mat,
        grainNote: "",
        status: "solid",
      });
    }
    return parts;
  }

  generateFaceFrame(config: FurnitureConfig): Part[] {
    const mat = primaryMaterial(config);
    const { height, width, materialThickness } = config.dimensions;
    const stileWidth = 2;
    const railWidth = 2;
    return [
      {
        id: "face-frame-stile-left",
        name: "Face frame stile (left)",
        assembly: "Case",
        quantity: 1,
        finished: { t: materialThickness, w: stileWidth, l: height },
        rough: { t: materialThickness, w: stileWidth, l: height, manual: false },
        material: mat,
        grainNote: "",
        status: "solid",
      },
      {
        id: "face-frame-stile-right",
        name: "Face frame stile (right)",
        assembly: "Case",
        quantity: 1,
        finished: { t: materialThickness, w: stileWidth, l: height },
        rough: { t: materialThickness, w: stileWidth, l: height, manual: false },
        material: mat,
        grainNote: "",
        status: "solid",
      },
      {
        id: "face-frame-rail-top",
        name: "Face frame rail (top)",
        assembly: "Case",
        quantity: 1,
        finished: { t: materialThickness, w: railWidth, l: width - stileWidth * 2 },
        rough: { t: materialThickness, w: railWidth, l: width - stileWidth * 2, manual: false },
        material: mat,
        grainNote: "",
        status: "solid",
      },
      {
        id: "face-frame-rail-bottom",
        name: "Face frame rail (bottom)",
        assembly: "Case",
        quantity: 1,
        finished: { t: materialThickness, w: railWidth, l: width - stileWidth * 2 },
        rough: { t: materialThickness, w: railWidth, l: width - stileWidth * 2, manual: false },
        material: mat,
        grainNote: "",
        status: "solid",
      },
    ];
  }

  generateOpeningParts(opening: OpeningConfig, config: FurnitureConfig): Part[] {
    if (opening.type === "drawer") return this.generateDrawerParts(opening, config);
    if (opening.type === "shelf") return this.generateShelfParts(opening, config);
    return [];
  }

  generateDrawerParts(opening: OpeningConfig, config: FurnitureConfig): Part[] {
    const openingDims = this.calculateOpenings(config).find((row) => row.id === opening.id);
    if (!openingDims) return [];
    const mat = primaryMaterial(config);
    const sec = secondaryMaterial(config);
    const height = openingDims.height;
    const width = openingDims.width;
    const depth = openingDims.depth;
    return [
      {
        id: `${opening.id}-front`,
        name: `Drawer front (${opening.id})`,
        assembly: "Drawers",
        quantity: 1,
        finished: { t: config.dimensions.materialThickness, w: height, l: width },
        rough: { t: config.dimensions.materialThickness, w: height, l: width, manual: false },
        material: mat,
        grainNote: "",
        status: "solid",
      },
      {
        id: `${opening.id}-side`,
        name: `Drawer side (${opening.id})`,
        assembly: "Drawers",
        quantity: 2,
        finished: { t: SECONDARY_THICKNESS, w: height - 0.5, l: depth },
        rough: { t: SECONDARY_THICKNESS, w: height - 0.5, l: depth, manual: false },
        material: mat,
        grainNote: "",
        status: "solid",
      },
      {
        id: `${opening.id}-back`,
        name: `Drawer back (${opening.id})`,
        assembly: "Drawers",
        quantity: 1,
        finished: { t: SECONDARY_THICKNESS, w: height - 0.5, l: width - SECONDARY_THICKNESS * 2 },
        rough: { t: SECONDARY_THICKNESS, w: height - 0.5, l: width - SECONDARY_THICKNESS * 2, manual: false },
        material: mat,
        grainNote: "",
        status: "solid",
      },
      {
        id: `${opening.id}-bottom`,
        name: `Drawer bottom (${opening.id})`,
        assembly: "Drawers",
        quantity: 1,
        finished: { t: BOTTOM_THICKNESS, w: depth - 0.5, l: width - SECONDARY_THICKNESS * 2 },
        rough: { t: BOTTOM_THICKNESS, w: depth - 0.5, l: width - SECONDARY_THICKNESS * 2, manual: false },
        material: sec,
        grainNote: "",
        status: "panel",
      },
    ];
  }

  generateShelfParts(opening: OpeningConfig, config: FurnitureConfig): Part[] {
    const openingDims = this.calculateOpenings(config).find((row) => row.id === opening.id);
    if (!openingDims) return [];
    const shelfCount = opening.features?.shelfAdjustable ? 3 : 1;
    const mat = primaryMaterial(config);
    const parts: Part[] = [];
    for (let i = 0; i < shelfCount; i++) {
      parts.push({
        id: `${opening.id}-shelf-${i + 1}`,
        name: `Shelf ${i + 1} (${opening.id})`,
        assembly: "Case",
        quantity: 1,
        finished: { t: config.dimensions.materialThickness, w: openingDims.depth, l: openingDims.width },
        rough: { t: config.dimensions.materialThickness, w: openingDims.depth, l: openingDims.width, manual: false },
        material: mat,
        grainNote: opening.features?.shelfAdjustable ? "Adjustable shelf" : "",
        status: "solid",
      });
    }
    return parts;
  }

  generateBackPanel(config: FurnitureConfig): Part {
    const mat = secondaryMaterial(config);
    return {
      id: "back-panel",
      name: "Back panel",
      assembly: "Back",
      quantity: 1,
      finished: {
        t: config.dimensions.backPanelThickness ?? 0.25,
        w: config.dimensions.height,
        l: config.dimensions.width,
      },
      rough: {
        t: config.dimensions.backPanelThickness ?? 0.25,
        w: config.dimensions.height,
        l: config.dimensions.width,
        manual: false,
      },
      material: mat,
      grainNote: config.construction.backPanel === "shiplap" ? "Shiplap option" : "",
      status: "panel",
    };
  }
}

export const caseworkGenerationService = new CaseworkGenerationService();
