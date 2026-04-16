/**
 * Grouped shop labels for rough stick instances: `A-1`, `A-2`, `B-1`, …
 * Prefix = build group (drawer cell, panel glue-up, or single part line); suffix = piece index in that group.
 * Deterministic: pack order does not affect labels.
 */

import { ASSEMBLY_IDS, type Dimension3, type Part } from "./project-types";
import { makeRoughInstanceId } from "./rough-instance-id";

const GROUP_LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

/** 0 -> A, 25 -> Z, 26 -> AA (Excel-style). */
export function indexToGroupPrefix(index: number): string {
  let n = index;
  let s = "";
  do {
    s = GROUP_LETTERS[n % 26] + s;
    n = Math.floor(n / 26) - 1;
  } while (n >= 0);
  return s;
}

/** Stable key for “pieces that go together” (glue-up, drawer cell, or one part line). */
export function shopLabelGroupKeyForPart(part: Part): string {
  const drawerMatch = part.name.match(/Drawer box\s*\(([^)]+)\)/i);
  if (drawerMatch && part.assembly === "Drawers") {
    const inner = drawerMatch[1].replace(/\s+/g, " ").trim();
    return `drawer:${inner}`;
  }
  if (part.status === "panel") {
    return `panel:${part.id}`;
  }
  return `part:${part.id}`;
}

export type GroupedInstance = {
  roughInstanceId: string;
  groupKey: string;
};

function assignGroupedLabels(instances: GroupedInstance[]): Map<string, string> {
  const uniqueKeys: string[] = [];
  const seen = new Set<string>();
  for (const { groupKey } of instances) {
    if (!seen.has(groupKey)) {
      seen.add(groupKey);
      uniqueKeys.push(groupKey);
    }
  }
  const prefixByGroup = new Map(uniqueKeys.map((g, i) => [g, indexToGroupPrefix(i)]));
  const nextInGroup = new Map<string, number>();
  const out = new Map<string, string>();
  for (const { roughInstanceId, groupKey } of instances) {
    const prefix = prefixByGroup.get(groupKey)!;
    const n = (nextInGroup.get(groupKey) ?? 0) + 1;
    nextInGroup.set(groupKey, n);
    out.set(roughInstanceId, `${prefix}-${n}`);
  }
  return out;
}

/** Map `roughInstanceId` → `A-1` style label from project parts. */
export function buildRoughInstanceLabelMap(parts: Part[]): Map<string, string> {
  const sorted = [...parts].sort((a, b) => {
    const ai = ASSEMBLY_IDS.indexOf(a.assembly);
    const bi = ASSEMBLY_IDS.indexOf(b.assembly);
    if (ai !== bi) return ai - bi;
    const nm = a.name.localeCompare(b.name, undefined, { sensitivity: "base" });
    if (nm !== 0) return nm;
    return a.id.localeCompare(b.id);
  });

  const instances: GroupedInstance[] = [];
  for (const p of sorted) {
    const q = Math.floor(Number(p.quantity));
    if (!Number.isFinite(q) || q < 1) continue;
    if (!(p.rough.l > 0)) continue;
    const gk = shopLabelGroupKeyForPart(p);
    for (let i = 1; i <= q; i++) {
      instances.push({ roughInstanceId: makeRoughInstanceId(p.id, i), groupKey: gk });
    }
  }
  return assignGroupedLabels(instances);
}

/** Map `roughInstanceId` → label for board-cut planner rows (each row = one group). */
export function buildPlannerGroupedShopLabels(rows: { rowId: string; qty: number }[]): Map<string, string> {
  const instances: GroupedInstance[] = [];
  for (const row of rows) {
    const q = Math.floor(Number(row.qty));
    if (!Number.isFinite(q) || q < 1) continue;
    const gk = `planner:${row.rowId}`;
    for (let i = 1; i <= q; i++) {
      instances.push({ roughInstanceId: makeRoughInstanceId(row.rowId, i), groupKey: gk });
    }
  }
  return assignGroupedLabels(instances);
}

export function compareShopLabels(a: string, b: string): number {
  const [ap, as] = a.split("-");
  const [bp, bs] = b.split("-");
  if (ap !== bp) return ap.localeCompare(bp, undefined, { sensitivity: "base" });
  const an = Number.parseInt(as ?? "", 10);
  const bn = Number.parseInt(bs ?? "", 10);
  if (Number.isFinite(an) && Number.isFinite(bn)) return an - bn;
  return (as ?? "").localeCompare(bs ?? "");
}

export type ShopGuideRow = {
  roughInstanceId: string;
  shopLabel: string;
  assembly: string;
  partName: string;
  roughLInches: number;
  finished: Dimension3;
  grainNote: string;
};

/** Rows for print / assembly guide, sorted by shop label. */
export function shopGuideRows(parts: Part[]): ShopGuideRow[] {
  const labelMap = buildRoughInstanceLabelMap(parts);
  const rows: ShopGuideRow[] = [];
  for (const [roughInstanceId, shopLabel] of labelMap) {
    const colon = roughInstanceId.lastIndexOf(":");
    const partId = colon > 0 ? roughInstanceId.slice(0, colon) : "";
    const p = parts.find((x) => x.id === partId);
    if (!p) continue;
    rows.push({
      roughInstanceId,
      shopLabel,
      assembly: p.assembly,
      partName: p.name,
      roughLInches: p.rough.l,
      finished: p.finished,
      grainNote: p.grainNote.trim(),
    });
  }
  rows.sort((a, b) => compareShopLabels(a.shopLabel, b.shopLabel));
  return rows;
}
