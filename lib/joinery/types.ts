import type { Dimension3 } from "@/lib/project-types";

/** Identifiers for built-in joinery rules (extend as new rules ship). */
export type JointRuleId =
  | "groove_quarter_back"
  | "dado_shelf_width"
  | "mortise_tenon_rail"
  | "mortise_tenon_stile";

/** Serializable rule selection + numeric parameters. */
export type JointSpec = {
  id: JointRuleId;
  params: Record<string, number>;
};

/**
 * Output of evaluating a rule: how finished T×W×L should change and why.
 * MVP: target a single `partId`, or filter project parts by `assembly === "Back"`;
 * `namePattern` is reserved for later batch matching.
 */
export type JointAdjustment = {
  partId?: string;
  namePattern?: string;
  finishedDimensionDeltas: Dimension3;
  explanation: string;
};
