import type { AssemblyId, Part, Project } from "@/lib/project-types";
import { ASSEMBLY_IDS } from "@/lib/project-types";
import { widthRipMultiplier } from "@/lib/buy-2d/width-fit";
import { partsForHardwoodYardCutList } from "@/lib/cut-list-yard-parts";
import {
  purchasableStockWidthInchesForPart,
  type PartAssumptionsProjectInput,
} from "@/lib/part-assumptions";
import { makeRoughInstanceLaneId } from "@/lib/rough-instance-id";
import { indexToGroupPrefix, shopLabelGroupKeyForPart } from "@/lib/shop-labels";

/**
 * Rough-instance ids the yard stick packer assigns for one part (lanes = width rips on the stock face).
 * Must stay aligned with `packGroupToBoardPlans` in `lib/lumber-vehicle-summary.ts`.
 */
export function expectedRoughInstanceLaneIdsForYardStickPart(
  part: Part,
  project: PartAssumptionsProjectInput,
  drawerPackAxis: "height" | "width"
): string[] {
  const q = Math.floor(Number(part.quantity));
  if (!Number.isFinite(q) || q < 1) return [];
  const drawerByWidth = drawerPackAxis === "width" && part.assembly === "Drawers";
  const cutLen = drawerByWidth ? part.finished.w : part.finished.l;
  const cutWidth = drawerByWidth ? part.finished.l : part.finished.w;
  if (!(cutLen > 0)) return [];
  const stockWidth = purchasableStockWidthInchesForPart(part, project).value;
  const rip = widthRipMultiplier(cutWidth, stockWidth);
  const keys: string[] = [];
  for (let inst = 1; inst <= q; inst += 1) {
    for (let lane = 1; lane <= rip; lane += 1) {
      keys.push(makeRoughInstanceLaneId(part.id, inst, lane));
    }
  }
  return keys;
}

export function yardCutProgressStatsForAssembly(
  project: Project,
  assembly: AssemblyId
): { requiredCuts: number; cutCuts: number } | null {
  const axis = project.drawerYardPackAxis ?? "width";
  const yardParts = partsForHardwoodYardCutList(project).filter((p) => p.assembly === assembly);
  if (yardParts.length === 0) return null;
  const progress = project.cutProgressByRoughInstanceId ?? {};
  let requiredCuts = 0;
  let cutCuts = 0;
  for (const part of yardParts) {
    const keys = expectedRoughInstanceLaneIdsForYardStickPart(part, project, axis);
    for (const k of keys) {
      requiredCuts += 1;
      if (progress[k] === "cut") cutCuts += 1;
    }
  }
  if (requiredCuts === 0) return null;
  return { requiredCuts, cutCuts };
}

export function yardHardwoodCutProgressSummaries(project: Project): Array<{
  assembly: AssemblyId;
  requiredCuts: number;
  cutCuts: number;
}> {
  const out: Array<{ assembly: AssemblyId; requiredCuts: number; cutCuts: number }> = [];
  for (const assembly of ASSEMBLY_IDS) {
    const s = yardCutProgressStatsForAssembly(project, assembly);
    if (s) out.push({ assembly, ...s });
  }
  return out;
}

export function yardCutProgressStatsForPart(
  project: Project,
  part: Part
): { requiredCuts: number; cutCuts: number } {
  const axis = project.drawerYardPackAxis ?? "width";
  const progress = project.cutProgressByRoughInstanceId ?? {};
  const keys = expectedRoughInstanceLaneIdsForYardStickPart(part, project, axis);
  let cutCuts = 0;
  for (const k of keys) {
    if (progress[k] === "cut") cutCuts += 1;
  }
  return { requiredCuts: keys.length, cutCuts };
}

/** Lane-aware shop labels for yard cut pieces (`A-1`, `A-2`...) without duplicate base labels. */
export function buildYardRoughInstanceLabelMap(project: Project): Map<string, string> {
  const axis = project.drawerYardPackAxis ?? "width";
  const sorted = [...partsForHardwoodYardCutList(project)].sort((a, b) => {
    const gk = shopLabelGroupKeyForPart(a).localeCompare(shopLabelGroupKeyForPart(b));
    if (gk !== 0) return gk;
    return a.id.localeCompare(b.id);
  });
  const groups: string[] = [];
  const seen = new Set<string>();
  for (const part of sorted) {
    const gk = shopLabelGroupKeyForPart(part);
    if (seen.has(gk)) continue;
    seen.add(gk);
    groups.push(gk);
  }
  const prefixByGroup = new Map(groups.map((g, i) => [g, indexToGroupPrefix(i)]));
  const nextByGroup = new Map<string, number>();
  const out = new Map<string, string>();
  for (const part of sorted) {
    const gk = shopLabelGroupKeyForPart(part);
    const prefix = prefixByGroup.get(gk);
    if (!prefix) continue;
    for (const key of expectedRoughInstanceLaneIdsForYardStickPart(part, project, axis)) {
      const next = (nextByGroup.get(gk) ?? 0) + 1;
      nextByGroup.set(gk, next);
      out.set(key, `${prefix}-${next}`);
    }
  }
  return out;
}
