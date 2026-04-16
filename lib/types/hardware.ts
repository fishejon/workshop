export type HardwareType =
  | "drawer-slide"
  | "hinge"
  | "knob"
  | "pull"
  | "back-panel-fastener"
  | "shelf-pin";

export type HardwareSpecs = {
  slideType?: "undermount" | "side-mount" | "center-mount";
  extension?: "full" | "three-quarter" | "half";
  length?: number;
  weightCapacity?: number;
  hingeType?: "european" | "butt" | "piano" | "concealed";
  overlay?: "full" | "half" | "inset";
  finish?: string;
  screwSize?: string;
};

export type HardwareItem = {
  id: string;
  type: HardwareType;
  manufacturer?: string;
  model?: string;
  specs: HardwareSpecs;
  quantity: number;
  associatedParts: string[];
  notes?: string;
};
