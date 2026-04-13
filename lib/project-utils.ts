import type { Dimension3, Part, Project, RoughSpec } from "./project-types";

export const STORAGE_KEY = "grainline-project-v1";

export function newPartId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `p-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function createEmptyProject(): Project {
  return {
    version: 1,
    name: "Untitled project",
    millingAllowanceInches: 0.5,
    maxTransportLengthInches: 96,
    wasteFactorPercent: 15,
    parts: [],
  };
}

/** Rough = finished + allowance on each axis (MVP rule). */
export function deriveRough(finished: Dimension3, millingAllowanceInches: number): RoughSpec {
  const a = Math.max(0, millingAllowanceInches);
  return {
    t: finished.t + a,
    w: finished.w + a,
    l: finished.l + a,
    manual: false,
  };
}

export function ensureRoughDerived(part: Part, millingAllowanceInches: number): Part {
  if (part.rough.manual) return part;
  return {
    ...part,
    rough: { ...deriveRough(part.finished, millingAllowanceInches), manual: false },
  };
}

export function recomputeAllRoughParts(project: Project): Project {
  const a = project.millingAllowanceInches;
  return {
    ...project,
    parts: project.parts.map((p) => (p.rough.manual ? p : { ...p, rough: { ...deriveRough(p.finished, a), manual: false } })),
  };
}

export function serializeProject(p: Project): string {
  return JSON.stringify(p);
}

export function parseProject(json: string): Project | null {
  try {
    const v = JSON.parse(json) as unknown;
    if (!v || typeof v !== "object") return null;
    const o = v as Partial<Project>;
    if (o.version !== 1 || !Array.isArray(o.parts)) return null;
    return o as Project;
  } catch {
    return null;
  }
}
