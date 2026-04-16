import { newPartId } from "@/lib/project-utils";
import type { FurnitureTemplate, FurnitureType } from "@/lib/types/furniture-config";

const dresserTemplate: FurnitureTemplate = {
  id: "dresser-classic",
  type: "dresser",
  name: "Classic Dresser",
  description: "Graduated drawer dresser with recessed base and plywood back.",
  defaultConfig: {
    id: newPartId(),
    type: "dresser",
    name: "New Dresser",
    dimensions: {
      height: 48,
      width: 36,
      depth: 18,
      materialThickness: 0.75,
      backPanelThickness: 0.25,
    },
    material: {
      primary: { species: "White Oak", surfaced: true },
      secondary: { species: "Plywood", grade: "Cabinet Grade", surfaced: true },
    },
    openings: [
      { id: "drawer-1", type: "drawer", position: { column: 0, row: 0 }, size: { height: 6, depth: 16 }, features: { drawerBoxConstruction: "dado", drawerSlideType: "undermount" } },
      { id: "drawer-2", type: "drawer", position: { column: 0, row: 1 }, size: { height: 8, depth: 16 }, features: { drawerBoxConstruction: "dado", drawerSlideType: "undermount" } },
      { id: "drawer-3", type: "drawer", position: { column: 0, row: 2 }, size: { height: 8, depth: 16 }, features: { drawerBoxConstruction: "dado", drawerSlideType: "undermount" } },
      { id: "drawer-4", type: "drawer", position: { column: 0, row: 3 }, size: { height: 10, depth: 16 }, features: { drawerBoxConstruction: "dado", drawerSlideType: "undermount" } },
    ],
    construction: { carcassJoinery: "dado", backPanel: "plywood", faceFrame: false },
    features: { topOverhang: 0.5, baseType: "recessed", baseHeight: 4 },
  },
  configurableFields: [
    { path: "name", label: "Project name", type: "text", defaultValue: "New Dresser" },
    { path: "dimensions.height", label: "Height", type: "number", min: 24, max: 72, step: 1, defaultValue: 48 },
    { path: "dimensions.width", label: "Width", type: "number", min: 24, max: 60, step: 1, defaultValue: 36 },
    { path: "dimensions.depth", label: "Depth", type: "number", min: 12, max: 24, step: 1, defaultValue: 18 },
  ],
};

const consoleTemplate: FurnitureTemplate = {
  id: "console-table",
  type: "console",
  name: "Console Table",
  description: "Narrow table with top drawer and open shelf zone.",
  defaultConfig: {
    id: newPartId(),
    type: "console",
    name: "New Console",
    dimensions: { height: 32, width: 48, depth: 14, materialThickness: 0.75, backPanelThickness: 0.25 },
    material: { primary: { species: "Walnut", surfaced: true } },
    openings: [
      { id: "drawer-1", type: "drawer", position: { column: 0, row: 0 }, size: { height: 4, depth: 12 }, features: { drawerBoxConstruction: "dado", drawerSlideType: "side-mount" } },
      { id: "shelf-1", type: "open", position: { column: 0, row: 1 }, size: { height: 24 } },
    ],
    construction: { carcassJoinery: "mortise-and-tenon", backPanel: "none", faceFrame: true },
    features: { topOverhang: 1, baseType: "flush" },
  },
  configurableFields: [
    { path: "name", label: "Project name", type: "text", defaultValue: "New Console" },
    { path: "dimensions.height", label: "Height", type: "number", min: 28, max: 40, step: 1, defaultValue: 32 },
    { path: "dimensions.width", label: "Width", type: "number", min: 36, max: 72, step: 1, defaultValue: 48 },
    { path: "dimensions.depth", label: "Depth", type: "number", min: 12, max: 18, step: 1, defaultValue: 14 },
  ],
};

const bookshelfTemplate: FurnitureTemplate = {
  id: "bookshelf-adjustable",
  type: "bookshelf",
  name: "Adjustable Bookshelf",
  description: "Tall shelf case with adjustable shelves and optional base drawer.",
  defaultConfig: {
    id: newPartId(),
    type: "bookshelf",
    name: "New Bookshelf",
    dimensions: { height: 72, width: 36, depth: 12, materialThickness: 0.75, backPanelThickness: 0.25 },
    material: {
      primary: { species: "Cherry", surfaced: true },
      secondary: { species: "Plywood", surfaced: true },
    },
    openings: [
      { id: "shelf-area", type: "shelf", position: { column: 0, row: 0 }, size: { height: 60 }, features: { shelfAdjustable: true, shelfPinHoles: 20 } },
      { id: "drawer-base", type: "drawer", position: { column: 0, row: 1 }, size: { height: 8, depth: 10 }, features: { drawerBoxConstruction: "dado", drawerSlideType: "side-mount" } },
    ],
    construction: { carcassJoinery: "dado", backPanel: "plywood", faceFrame: false },
    features: { topOverhang: 0, baseType: "flush" },
  },
  configurableFields: [
    { path: "name", label: "Project name", type: "text", defaultValue: "New Bookshelf" },
    { path: "dimensions.height", label: "Height", type: "number", min: 48, max: 96, step: 1, defaultValue: 72 },
    { path: "dimensions.width", label: "Width", type: "number", min: 24, max: 60, step: 1, defaultValue: 36 },
    { path: "dimensions.depth", label: "Depth", type: "number", min: 10, max: 16, step: 1, defaultValue: 12 },
  ],
};

export const FURNITURE_TEMPLATES: FurnitureTemplate[] = [dresserTemplate, consoleTemplate, bookshelfTemplate];

export function getTemplateById(id: string): FurnitureTemplate | undefined {
  return FURNITURE_TEMPLATES.find((template) => template.id === id);
}

export function getTemplatesByType(type: FurnitureType): FurnitureTemplate[] {
  return FURNITURE_TEMPLATES.filter((template) => template.type === type);
}
