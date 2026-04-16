import type { CaseOutlineV0 } from "@/lib/geometry/types";

function isDim3(n: unknown): n is number {
  return typeof n === "number" && Number.isFinite(n) && n >= 0;
}

export function isCaseOutlineV0(v: unknown): v is CaseOutlineV0 {
  if (!v || typeof v !== "object") return false;
  const o = v as Record<string, unknown>;
  if (o.version !== 0 || o.source !== "dresser-parts-inferred") return false;
  if (!isDim3(o.outerW) || !isDim3(o.outerH) || !isDim3(o.outerD)) return false;
  if (o.columnCount !== 1 && o.columnCount !== 2 && o.columnCount !== 3) return false;
  if (typeof o.rowCount !== "number" || !Number.isFinite(o.rowCount) || o.rowCount < 1) return false;
  if (!Array.isArray(o.rowOpeningHeightsInches)) return false;
  if (o.rowOpeningHeightsInches.length < o.rowCount) return false;
  if (!o.rowOpeningHeightsInches.slice(0, o.rowCount).every((x) => typeof x === "number" && Number.isFinite(x) && x > 0)) {
    return false;
  }
  if (!isDim3(o.kickH) || !isDim3(o.topBand) || !isDim3(o.bottomBand) || !isDim3(o.rail) || !isDim3(o.materialT)) {
    return false;
  }
  return true;
}
