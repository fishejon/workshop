export type FurnitureType = "dresser" | "console" | "sideboard" | "bookshelf" | "cabinet";
export type OpeningType = "drawer" | "door" | "shelf" | "open";

export type CaseworkDimensions = {
  height: number;
  width: number;
  depth: number;
  materialThickness: number;
  backPanelThickness?: number;
};

export type OpeningPosition = {
  column: number;
  row: number;
  columnSpan?: number;
  rowSpan?: number;
};

export type OpeningSize = {
  height?: number;
  width?: number;
  depth?: number;
};

export type OpeningFeatures = {
  drawerBoxConstruction?: "dado" | "dovetail" | "pocket-screw";
  drawerSlideType?: "undermount" | "side-mount";
  drawerBottomType?: "plywood" | "solid-panel";
  doorStyle?: "inset" | "overlay" | "full-overlay";
  doorConstruction?: "frame-and-panel" | "slab";
  hingeType?: "European" | "butt";
  shelfAdjustable?: boolean;
  shelfPinHoles?: number;
};

export type OpeningConfig = {
  id: string;
  type: OpeningType;
  position: OpeningPosition;
  size: OpeningSize;
  features?: OpeningFeatures;
};

export type DividerConfig = {
  orientation: "vertical" | "horizontal";
  position: number;
  thickness: number;
};

export type MaterialConfig = {
  primary: {
    species: string;
    grade?: string;
    surfaced: boolean;
  };
  secondary?: {
    species: string;
    grade?: string;
    surfaced: boolean;
  };
};

export type ConstructionConfig = {
  carcassJoinery?: "mortise-and-tenon" | "dado" | "pocket-hole" | "dowel";
  backPanel?: "shiplap" | "plywood" | "none";
  dividers?: DividerConfig[];
  faceFrame?: boolean;
};

export type FurnitureFeatures = {
  topOverhang?: number;
  baseType?: "flush" | "recessed" | "none";
  baseHeight?: number;
  hardwareStyle?: string;
};

export type FurnitureConfig = {
  id: string;
  type: FurnitureType;
  name: string;
  dimensions: CaseworkDimensions;
  material: MaterialConfig;
  openings: OpeningConfig[];
  construction: ConstructionConfig;
  features?: FurnitureFeatures;
};

export type ConfigurableField = {
  path: string;
  label: string;
  type: "number" | "select" | "boolean" | "text";
  options?: Array<{ label: string; value: string | number | boolean }>;
  min?: number;
  max?: number;
  step?: number;
  defaultValue: string | number | boolean;
  helpText?: string;
};

export type FurnitureTemplate = {
  id: string;
  type: FurnitureType;
  name: string;
  description: string;
  thumbnail?: string;
  defaultConfig: FurnitureConfig;
  configurableFields: ConfigurableField[];
};

export type GeneratedOpening = {
  id: string;
  type: OpeningType;
  height: number;
  width: number;
  depth: number;
};
