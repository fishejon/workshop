/**
 * Shared project model — aligns with docs/PRD.md (finished vs rough, materials, assemblies).
 * Dimensions are decimal inches: T = thickness, W = width, L = length of the part as cut.
 */

export const ASSEMBLY_IDS = ["Case", "Drawers", "Base", "Back", "Doors", "Other"] as const;
export type AssemblyId = (typeof ASSEMBLY_IDS)[number];

export type Dimension3 = {
  /** Thickness (inches) */
  t: number;
  /** Width (inches) */
  w: number;
  /** Length (inches) */
  l: number;
};

export type MaterialSpec = {
  /** Species / grade / source — free text */
  label: string;
  /** Nominal thickness for buying / BF grouping, e.g. "4/4", "5/4", "1/2 ply" */
  thicknessCategory: string;
};

export type PartStatus = "solid" | "panel" | "needs_milling";

export type RoughSpec = {
  t: number;
  w: number;
  l: number;
  /**
   * When false, rough T/W/L track `finished` + project `millingAllowanceInches` until user edits rough.
   * After user edits any rough field, set true for that part.
   */
  manual: boolean;
};

export type Part = {
  id: string;
  name: string;
  assembly: AssemblyId;
  quantity: number;
  finished: Dimension3;
  rough: RoughSpec;
  material: MaterialSpec;
  grainNote: string;
  status: PartStatus;
};

/**
 * Record of a joinery rule applied to a part (audit + before/after display).
 * `ruleId` matches `JointRuleId` in `lib/joinery/types.ts`.
 */
export type ProjectJoint = {
  id: string;
  ruleId: string;
  /** Part that received the dimensional change. */
  primaryPartId: string;
  /** Optional mate (e.g. stile for a rail, side for a shelf). */
  matePartId?: string;
  /** Shop-language reference for primary mating edge/face. */
  primaryEdgeLabel?: string;
  /** Shop-language reference for mate edge/face. */
  mateEdgeLabel?: string;
  params: Record<string, number>;
  explanation: string;
  finishedBefore: Dimension3;
  finishedAfter: Dimension3;
};

export type Project = {
  version: 1;
  name: string;
  /** Added to each finished T, W, L to suggest rough size (simple shop default). */
  millingAllowanceInches: number;
  /** Max stick length for buy-list hints (transport). */
  maxTransportLengthInches: number;
  /** Applied to board-foot subtotals in buy list. */
  wasteFactorPercent: number;
  parts: Part[];
  /** Applied joinery rules (Phase 3). */
  joints: ProjectJoint[];
};
