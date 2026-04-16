/**
 * Shared project model — aligns with docs/PRD.md (finished vs rough, materials, assemblies).
 * Dimensions are decimal inches: T = thickness, W = width, L = length of the part as cut.
 */

import type { CaseOutlineV0 } from "@/lib/geometry/types";

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

export type MaterialGroupCostRate = {
  /** Optional rate per adjusted board foot for this material group. */
  perBoardFoot?: number;
  /** Optional rate per adjusted linear foot for this material group. */
  perLinearFoot?: number;
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
  /** Multi-step application group id (e.g. preset run) for traceability UI. */
  applicationId?: string;
  /** Optional preset id if this joint was created from a construction preset. */
  presetId?: string;
  /** Optional friendly preset label for history grouping. */
  presetLabel?: string;
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

/**
 * Explicit part-to-part joinery edge (graph). `partAId` is the primary (dimensionally edited) part;
 * `partBId` is the mate when both ends of the connection are known.
 */
export type ProjectJoinConnection = {
  id: string;
  /** Multi-step application group id (e.g. preset run) for traceability UI. */
  applicationId?: string;
  partAId: string;
  partBId: string;
  ruleId: string;
  params: Record<string, number>;
  primaryEdgeLabel?: string;
  mateEdgeLabel?: string;
  explanation?: string;
  /** Optional link to the `ProjectJoint` audit row created in the same apply action. */
  jointId?: string;
  createdAt?: string;
  updatedAt?: string;
};

export const LUMBER_PROFILE_IDS = ["s4s_hardwood", "rough_hardwood", "sheet_goods", "mixed_stock"] as const;
export type LumberProfileId = (typeof LUMBER_PROFILE_IDS)[number];

export const OFFCUT_MODE_IDS = ["none", "keep_serviceable"] as const;
export type OffcutModeId = (typeof OFFCUT_MODE_IDS)[number];

export type WorkshopPreferences = {
  lumberProfile: LumberProfileId;
  offcutMode: OffcutModeId;
};

/** Progress for one rough stick instance (`partId:instanceIndex`). */
export type CutProgressValue = "cut";

export type Project = {
  id: string;
  version: 1;
  name: string;
  /** Added to each finished T, W, L to suggest rough size (simple shop default). */
  millingAllowanceInches: number;
  /** Max stick length for buy-list hints (transport). */
  maxTransportLengthInches: number;
  /**
   * Widest single board you can reliably buy (in). Used for panel glue-up copy and buy-list width caveats;
   * stick packing stays 1D on rough length.
   */
  maxPurchasableBoardWidthInches: number;
  /** Applied to board-foot subtotals in buy list. */
  wasteFactorPercent: number;
  /** Optional material-group rates keyed by `materialGroupKey(label, thicknessCategory)`. */
  costRatesByGroup: Record<string, MaterialGroupCostRate>;
  parts: Part[];
  /** Applied joinery rules (Phase 3). */
  joints: ProjectJoint[];
  /** Part-to-part joinery graph; omitted in legacy saves. */
  connections: ProjectJoinConnection[];
  /** Explicit review gates before export/print actions. */
  checkpoints: {
    materialAssumptionsReviewed: boolean;
    joineryReviewed: boolean;
  };
  /** Workshop memory defaults stored locally (Epic 7 starter). */
  workshop: WorkshopPreferences;
  /**
   * Optional per `materialGroupKey` max stock width (in) for 2D buy estimates.
   * Falls back to `maxPurchasableBoardWidthInches` when a key is absent.
   */
  stockWidthByMaterialGroup?: Record<string, number>;
  /**
   * Which rough-length instances are already cut (keys from `makeRoughInstanceId`).
   * Omitted keys mean not cut; only `"cut"` is stored today.
   */
  cutProgressByRoughInstanceId?: Record<string, CutProgressValue>;
  /**
   * Optional cached case outline (CAD-lite v0). Today the app may derive previews from parts instead;
   * field reserved for future persistence / round-trip.
   */
  geometry?: CaseOutlineV0 | null;
};

export type ProjectTemplate = {
  id: string;
  version: 1;
  name: string;
  sourceProjectName: string;
  createdAt: string;
  millingAllowanceInches: number;
  maxTransportLengthInches: number;
  maxPurchasableBoardWidthInches: number;
  wasteFactorPercent: number;
  costRatesByGroup: Record<string, MaterialGroupCostRate>;
  parts: Part[];
  joints: ProjectJoint[];
  connections: ProjectJoinConnection[];
  workshop: WorkshopPreferences;
  stockWidthByMaterialGroup?: Record<string, number>;
};
