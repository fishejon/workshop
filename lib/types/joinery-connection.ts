import type { Part, ProjectJoinConnection } from "@/lib/project-types";

export type PartFace = "top" | "bottom" | "left" | "right" | "front" | "back" | "end" | "edge";
export type JoineryFeature =
  | "mortise"
  | "tenon"
  | "dado"
  | "groove"
  | "rabbet"
  | "dovetail"
  | "tongue"
  | "none";

export type JoineryMethod =
  | "mortise-and-tenon"
  | "dado"
  | "groove"
  | "rabbet"
  | "dovetail"
  | "pocket-hole"
  | "dowel"
  | "biscuit"
  | "sliding-dovetail"
  | "tongue-and-groove";

export type ConnectionDimension = "length" | "width" | "thickness";

export type JoineryDimensions = {
  depth: number;
  width: number;
  length: number;
  offset?: number;
};

export type ConnectionEnd = {
  partId: string;
  face: PartFace;
  feature: JoineryFeature;
  dimensions: JoineryDimensions;
};

export type ValidationResult = {
  isValid: boolean;
  errors: string[];
};

export type ConnectionConstraint = {
  type: "alignment" | "clearance" | "strength" | "visibility";
  description: string;
  rule: (connection: PartConnection) => ValidationResult;
};

export type ConnectionAdjustment = {
  partId: string;
  dimension: ConnectionDimension;
  delta: number;
  reason: string;
};

export type PartConnection = {
  id: string;
  type: "structural" | "surface" | "hardware";
  primaryPart: ConnectionEnd;
  secondaryPart: ConnectionEnd;
  joineryMethod: JoineryMethod;
  constraints: ConnectionConstraint[];
  adjustments: ConnectionAdjustment[];
  label?: string;
  notes?: string;
  sourceRuleId?: string;
};

export type JoineryGraphSummary = {
  partCount: number;
  connectionCount: number;
  adjustmentCount: number;
};

export function toProjectConnection(connection: PartConnection): Omit<ProjectJoinConnection, "id"> {
  const first = connection.adjustments[0];
  return {
    partAId: connection.primaryPart.partId,
    partBId: connection.secondaryPart.partId,
    ruleId: connection.sourceRuleId ?? connection.joineryMethod,
    params: {
      depth: connection.primaryPart.dimensions.depth,
      width: connection.primaryPart.dimensions.width,
      length: connection.primaryPart.dimensions.length,
      ...(first ? { adjustmentDelta: first.delta } : {}),
    },
    explanation: connection.label ?? connection.notes,
  };
}

export function inferPartFaceFromName(part: Part): PartFace {
  const name = part.name.toLowerCase();
  if (name.includes("top")) return "top";
  if (name.includes("bottom")) return "bottom";
  if (name.includes("left")) return "left";
  if (name.includes("right")) return "right";
  if (name.includes("front")) return "front";
  if (name.includes("back")) return "back";
  return "edge";
}
