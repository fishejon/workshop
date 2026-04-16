import type { CutProgressValue } from "./project-types";

/**
 * Stable id for one rough-length instance (one stick off the board per part quantity index).
 * Used for cut progress and shop labels; must survive 1D pack reordering.
 */
export function makeRoughInstanceId(partId: string, instanceIndex: number): string {
  return `${partId}:${instanceIndex}`;
}

/**
 * Optional lane suffix for when one part instance expands into multiple cuts
 * (e.g. width rips against a fixed stock width).
 *
 * Format: `${partId}:${instanceIndex}#${laneIndex}` where laneIndex is 1-based.
 */
export function makeRoughInstanceLaneId(partId: string, instanceIndex: number, laneIndex: number): string {
  const lane = Math.max(1, Math.floor(Number(laneIndex)));
  return `${makeRoughInstanceId(partId, instanceIndex)}#${lane}`;
}

/** Parse `partId:instance` where instance is a positive integer. */
export function parseRoughInstanceId(
  id: string
): { partId: string; instanceIndex: number; laneIndex?: number } | null {
  const colon = id.lastIndexOf(":");
  if (colon <= 0) return null;
  const partId = id.slice(0, colon);
  const raw = id.slice(colon + 1);
  const [instRaw, laneRaw] = raw.split("#");
  const inst = Number.parseInt(instRaw ?? "", 10);
  if (!Number.isFinite(inst) || inst < 1) return null;
  const laneParsed = laneRaw ? Number.parseInt(laneRaw, 10) : NaN;
  if (laneRaw && !(Number.isFinite(laneParsed) && laneParsed >= 1)) {
    return { partId, instanceIndex: inst };
  }
  return laneRaw ? { partId, instanceIndex: inst, laneIndex: laneParsed } : { partId, instanceIndex: inst };
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
    out[
      parsed.laneIndex
        ? makeRoughInstanceLaneId(nextPartId, parsed.instanceIndex, parsed.laneIndex)
        : makeRoughInstanceId(nextPartId, parsed.instanceIndex)
    ] = "cut";
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
