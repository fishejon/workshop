import type { JointRuleId } from "@/lib/joinery/types";
import type { DrawerJoineryPresetId } from "@/lib/joinery/drawer-allowances";
import type { Part, ProjectJoint } from "@/lib/project-types";

const JOINT_RULE_LABELS: Record<JointRuleId, string> = {
  groove_quarter_back: "Groove / 1/4 back",
  dado_shelf_width: "Dado shelf",
  mortise_tenon_rail: "M&T rail",
  mortise_tenon_stile: "M&T stile",
};

const DRAWER_JOINERY_PRESET_LABELS: Record<DrawerJoineryPresetId, string> = {
  butt: "Drawer butt baseline",
  rabbet: "Drawer rabbet",
  dovetail_full_overlap: "Drawer dovetail (full overlap)",
  dovetail_half_lap: "Drawer dovetail (half-lap)",
};

export type PartProvenance = {
  roughSource: "manual" | "derived";
  joineryChangeCount: number;
  joineryReferenceCount: number;
  lastJoineryRuleId?: string;
};

export function summarizePartProvenance(part: Part, joints: ProjectJoint[]): PartProvenance {
  let joineryChangeCount = 0;
  let joineryReferenceCount = 0;
  let lastJoineryRuleId: string | undefined;

  for (const joint of joints) {
    if (joint.primaryPartId === part.id) {
      joineryChangeCount += 1;
      lastJoineryRuleId = joint.ruleId;
      continue;
    }
    if (joint.matePartId === part.id) {
      joineryReferenceCount += 1;
    }
  }

  return {
    roughSource: part.rough.manual ? "manual" : "derived",
    joineryChangeCount,
    joineryReferenceCount,
    lastJoineryRuleId,
  };
}

export function formatJointRuleLabel(ruleId: string): string {
  return JOINT_RULE_LABELS[ruleId as JointRuleId] ?? ruleId;
}

export function formatDrawerJoineryPresetLabel(presetId: DrawerJoineryPresetId): string {
  return DRAWER_JOINERY_PRESET_LABELS[presetId] ?? presetId;
}
