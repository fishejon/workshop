import type { Part, Project } from "@/lib/project-types";
import type { JoineryFeature, JoineryMethod, PartFace } from "@/lib/types/joinery-connection";

export type PartSelector = {
  assembly?: string;
  nameIncludes?: string[];
  filter?: (part: Part) => boolean;
};

export type ConnectionTemplate = {
  label: string;
  joineryMethod: JoineryMethod;
  primarySelector: PartSelector;
  secondarySelector: PartSelector;
  primaryFeature: JoineryFeature;
  secondaryFeature: JoineryFeature;
  primaryFace?: PartFace;
  secondaryFace?: PartFace;
  dimensions: {
    depth?: number;
    width?: number;
    length?: number;
    offset?: number;
  };
};

export type JoineryPreset = {
  id: string;
  name: string;
  description: string;
  category: "carcass" | "drawer" | "door" | "frame-and-panel" | "edge";
  applicability: (project: Project) => boolean;
  connections: ConnectionTemplate[];
  defaultDimensions: {
    depth?: number;
    width?: number;
    length?: number;
  };
  notes?: string[];
};

function hasPart(project: Project, predicate: (part: Part) => boolean): boolean {
  return project.parts.some(predicate);
}

export const FRAME_AND_PANEL_CARCASS: JoineryPreset = {
  id: "frame-and-panel-carcass",
  name: "Frame and Panel Case",
  description: "Rails/stiles as M&T and panel/back captured in grooves.",
  category: "frame-and-panel",
  applicability: (project) =>
    hasPart(project, (part) => /rail|stile/i.test(part.name)) && hasPart(project, (part) => /panel|back/i.test(part.name)),
  connections: [
    {
      label: "Rail to stile M&T",
      joineryMethod: "mortise-and-tenon",
      primarySelector: { nameIncludes: ["stile"] },
      secondarySelector: { nameIncludes: ["rail"] },
      primaryFeature: "mortise",
      secondaryFeature: "tenon",
      dimensions: { depth: 1, length: 2.5 },
    },
    {
      label: "Panel groove capture",
      joineryMethod: "groove",
      primarySelector: { nameIncludes: ["stile", "rail", "back"] },
      secondarySelector: { nameIncludes: ["panel", "back"] },
      primaryFeature: "groove",
      secondaryFeature: "tongue",
      dimensions: { depth: 0.25, width: 0.25 },
    },
  ],
  defaultDimensions: { depth: 1, width: 0.75, length: 2.5 },
};

export const DOVETAILED_DRAWER: JoineryPreset = {
  id: "dovetailed-drawer",
  name: "Dovetailed Drawer",
  description: "Half-blind/through dovetail drawer joints with grooved bottom.",
  category: "drawer",
  applicability: (project) => hasPart(project, (part) => part.assembly === "Drawers"),
  connections: [
    {
      label: "Drawer front/back dovetail",
      joineryMethod: "dovetail",
      primarySelector: { assembly: "Drawers", nameIncludes: ["side"] },
      secondarySelector: { assembly: "Drawers", nameIncludes: ["front", "back"] },
      primaryFeature: "dovetail",
      secondaryFeature: "dovetail",
      dimensions: { depth: 0.5 },
    },
    {
      label: "Drawer bottom groove",
      joineryMethod: "groove",
      primarySelector: { assembly: "Drawers", nameIncludes: ["side", "front", "back"] },
      secondarySelector: { assembly: "Drawers", nameIncludes: ["bottom"] },
      primaryFeature: "groove",
      secondaryFeature: "tongue",
      dimensions: { depth: 0.25, width: 0.25 },
    },
  ],
  defaultDimensions: { depth: 0.5, width: 0.25 },
};

export const DADO_DRAWER: JoineryPreset = {
  id: "dado-drawer",
  name: "Dado Drawer (Simple)",
  description: "Simple dado capture for drawer fronts/backs and grooved bottom.",
  category: "drawer",
  applicability: (project) => hasPart(project, (part) => part.assembly === "Drawers"),
  connections: [
    {
      label: "Drawer front/back dado",
      joineryMethod: "dado",
      primarySelector: { assembly: "Drawers", nameIncludes: ["side"] },
      secondarySelector: { assembly: "Drawers", nameIncludes: ["front", "back"] },
      primaryFeature: "dado",
      secondaryFeature: "none",
      dimensions: { depth: 0.25, width: 0.5 },
    },
    {
      label: "Drawer bottom groove",
      joineryMethod: "groove",
      primarySelector: { assembly: "Drawers", nameIncludes: ["side", "front", "back"] },
      secondarySelector: { assembly: "Drawers", nameIncludes: ["bottom"] },
      primaryFeature: "groove",
      secondaryFeature: "tongue",
      dimensions: { depth: 0.25, width: 0.25 },
    },
  ],
  defaultDimensions: { depth: 0.25, width: 0.25 },
};

export const MITERED_CASE: JoineryPreset = {
  id: "mitered-case",
  name: "Mitered Case",
  description: "Mitered case corners with spline-like reinforcement grooves.",
  category: "carcass",
  applicability: (project) => hasPart(project, (part) => part.assembly === "Case"),
  connections: [
    {
      label: "Case corner reinforcement",
      joineryMethod: "rabbet",
      primarySelector: { assembly: "Case", nameIncludes: ["side"] },
      secondarySelector: { assembly: "Case", nameIncludes: ["top", "bottom"] },
      primaryFeature: "rabbet",
      secondaryFeature: "rabbet",
      dimensions: { depth: 0.375, width: 0.25 },
    },
  ],
  defaultDimensions: { depth: 0.375, width: 0.25 },
};

export const JOINERY_PRESETS: JoineryPreset[] = [
  FRAME_AND_PANEL_CARCASS,
  DOVETAILED_DRAWER,
  DADO_DRAWER,
  MITERED_CASE,
];

export function getApplicablePresets(project: Project): JoineryPreset[] {
  return JOINERY_PRESETS.filter((preset) => preset.applicability(project));
}

export function getPresetById(id: string): JoineryPreset | undefined {
  return JOINERY_PRESETS.find((preset) => preset.id === id);
}
