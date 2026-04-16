import type { CutProgressValue } from "./project-types";

/**
 * Stable id for one rough-length instance (one stick off the board per part quantity index).
 * Used for cut progress and shop labels; must survive 1D pack reordering.
 */
export function makeRoughInstanceId(partId: string, instanceIndex: number): string {
  return `${partId}:${instanceIndex}`;
}

/** Parse `partId:instance` where instance is a positive integer. */
export function parseRoughInstanceId(id: string): { partId: string; instanceIndex: number } | null {
  const colon = id.lastIndexOf(":");
  if (colon <= 0) return null;
  const partId = id.slice(0, colon);
  const inst = Number.parseInt(id.slice(colon + 1), 10);
  if (!Number.isFinite(inst) || inst < 1) return null;
  return { partId, instanceIndex: inst };
}

/** After part id remap (clone), re-key cut progress entries. */
export function remapCutProgressKeys(
  progress: Record<string, CutProgressValue> | undefined,
  partIdMap: Map<string, string>
): Record<string, CutProgressValue> {
  const out: Record<string, CutProgressValue> = {};
  if (!progress || partIdMap.size === 0) return out;
  for (const [key, val] of Object.entries(progress)) {
    if (val !== "cut") continue;
    const parsed = parseRoughInstanceId(key);
    if (!parsed) continue;
    const nextPartId = partIdMap.get(parsed.partId);
    if (!nextPartId) continue;
    out[makeRoughInstanceId(nextPartId, parsed.instanceIndex)] = "cut";
  }
  return out;
}

/** Drop progress for removed part ids (e.g. delete part, replace assembly). */
export function pruneCutProgressForPartIds(
  progress: Record<string, CutProgressValue> | undefined,
  removedPartIds: Set<string>
): Record<string, CutProgressValue> {
  if (!progress) return {};
  if (removedPartIds.size === 0) return { ...progress };
  const out: Record<string, CutProgressValue> = {};
  for (const [key, val] of Object.entries(progress)) {
    if (val !== "cut") continue;
    const parsed = parseRoughInstanceId(key);
    if (!parsed || removedPartIds.has(parsed.partId)) continue;
    out[key] = "cut";
  }
  return out;
}
