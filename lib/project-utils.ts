import type {
  AssemblyId,
  Dimension3,
  Part,
  Project,
  ProjectJoinConnection,
  ProjectJoint,
  ProjectTemplate,
  RoughSpec,
} from "./project-types";

export const STORAGE_KEY = "grainline-project-v1";
export const PROJECT_LIBRARY_STORAGE_KEY = "grainline-project-library-v1";
export const PROJECT_TEMPLATES_STORAGE_KEY = "grainline-project-templates-v1";

/** Max rows kept in local backup library (oldest dropped after backup). */
export const MAX_PROJECT_LIBRARY_RECORDS = 60;

/** Trim whitespace and strip a leading UTF-8 BOM so pasted or editor-exported JSON parses reliably. */
function parseStockWidthByMaterialGroup(raw: unknown): Record<string, number> | undefined {
  if (!raw || typeof raw !== "object") return undefined;
  const out: Record<string, number> = {};
  for (const [k, v] of Object.entries(raw as Record<string, unknown>)) {
    if (typeof v === "number" && Number.isFinite(v) && v > 0) out[k] = v;
  }
  return Object.keys(out).length > 0 ? out : undefined;
}

export function normalizeProjectJsonInput(input: string): string {
  let s = input.trimStart();
  if (!s) return "";
  if (s.charCodeAt(0) === 0xfeff) s = s.slice(1).trimStart();
  return s.trimEnd();
}

export type StoredProjectRecord = {
  id: string;
  name: string;
  updatedAt: string;
  archived: boolean;
  project: Project;
};

export function newPartId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `p-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function newProjectId(): string {
  return `prj-${newPartId()}`;
}

export function newTemplateId(): string {
  return `tpl-${newPartId()}`;
}

function nextUniqueId(used: Set<string>): string {
  let candidate = newPartId();
  while (used.has(candidate)) candidate = newPartId();
  used.add(candidate);
  return candidate;
}

function remapGraph(
  parts: Part[],
  joints: ProjectJoint[],
  connections: ProjectJoinConnection[],
  shouldCopyPart: (part: Part) => boolean,
  copyNameSuffix?: string
): {
  parts: Part[];
  joints: ProjectJoint[];
  connections: ProjectJoinConnection[];
} {
  const usedPartIds = new Set(parts.map((part) => part.id));
  const usedJointIds = new Set(joints.map((joint) => joint.id));
  const usedConnectionIds = new Set(connections.map((connection) => connection.id));
  const partIdMap = new Map<string, string>();
  const jointIdMap = new Map<string, string>();

  const duplicatedParts: Part[] = [];
  for (const part of parts) {
    if (!shouldCopyPart(part)) continue;
    const nextPartId = nextUniqueId(usedPartIds);
    partIdMap.set(part.id, nextPartId);
    duplicatedParts.push({
      ...part,
      id: nextPartId,
      name: copyNameSuffix ? `${part.name}${copyNameSuffix}` : part.name,
    });
  }

  const duplicatedJoints: ProjectJoint[] = [];
  for (const joint of joints) {
    const duplicatedPrimaryId = partIdMap.get(joint.primaryPartId);
    if (!duplicatedPrimaryId) continue;
    const nextJointId = nextUniqueId(usedJointIds);
    jointIdMap.set(joint.id, nextJointId);
    duplicatedJoints.push({
      ...joint,
      id: nextJointId,
      primaryPartId: duplicatedPrimaryId,
      matePartId: joint.matePartId ? (partIdMap.get(joint.matePartId) ?? joint.matePartId) : undefined,
    });
  }

  const duplicatedConnections: ProjectJoinConnection[] = [];
  for (const connection of connections) {
    const duplicatedA = partIdMap.get(connection.partAId);
    const duplicatedB = partIdMap.get(connection.partBId);
    if (!duplicatedA || !duplicatedB) continue;
    duplicatedConnections.push({
      ...connection,
      id: nextUniqueId(usedConnectionIds),
      partAId: duplicatedA,
      partBId: duplicatedB,
      jointId: connection.jointId ? jointIdMap.get(connection.jointId) : undefined,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  }

  return {
    parts: duplicatedParts,
    joints: duplicatedJoints,
    connections: duplicatedConnections,
  };
}

export function createEmptyProject(): Project {
  return {
    id: newProjectId(),
    version: 1,
    name: "Untitled project",
    millingAllowanceInches: 0.5,
    maxTransportLengthInches: 96,
    maxPurchasableBoardWidthInches: 20,
    wasteFactorPercent: 15,
    costRatesByGroup: {},
    parts: [],
    joints: [],
    connections: [],
    checkpoints: {
      materialAssumptionsReviewed: false,
      joineryReviewed: false,
    },
    workshop: {
      lumberProfile: "s4s_hardwood",
      offcutMode: "none",
    },
  };
}

export function cloneProject(project: Project, name: string): Project {
  const duplicated = remapGraph(project.parts, project.joints, project.connections, () => true);
  return {
    ...project,
    id: newProjectId(),
    name,
    parts: duplicated.parts,
    joints: duplicated.joints,
    connections: duplicated.connections,
    checkpoints: {
      materialAssumptionsReviewed: false,
      joineryReviewed: false,
    },
  };
}

export function serializeTemplate(project: Project, templateName: string): ProjectTemplate {
  return {
    id: newTemplateId(),
    version: 1,
    name: templateName,
    sourceProjectName: project.name,
    createdAt: new Date().toISOString(),
    millingAllowanceInches: project.millingAllowanceInches,
    maxTransportLengthInches: project.maxTransportLengthInches,
    maxPurchasableBoardWidthInches: project.maxPurchasableBoardWidthInches,
    wasteFactorPercent: project.wasteFactorPercent,
    costRatesByGroup: { ...project.costRatesByGroup },
    workshop: { ...project.workshop },
    parts: project.parts.map((part) => ({ ...part, finished: { ...part.finished }, rough: { ...part.rough }, material: { ...part.material } })),
    joints: project.joints.map((joint) => ({ ...joint, params: { ...joint.params }, finishedBefore: { ...joint.finishedBefore }, finishedAfter: { ...joint.finishedAfter } })),
    connections: project.connections.map((connection) => ({ ...connection, params: { ...connection.params } })),
    ...(project.stockWidthByMaterialGroup && Object.keys(project.stockWidthByMaterialGroup).length > 0
      ? { stockWidthByMaterialGroup: { ...project.stockWidthByMaterialGroup } }
      : {}),
  };
}

export function applyTemplate(template: ProjectTemplate, projectName: string): Project {
  const baseline: Project = {
    ...createEmptyProject(),
    name: projectName,
    millingAllowanceInches: template.millingAllowanceInches,
    maxTransportLengthInches: template.maxTransportLengthInches,
    maxPurchasableBoardWidthInches:
      typeof template.maxPurchasableBoardWidthInches === "number" &&
      Number.isFinite(template.maxPurchasableBoardWidthInches) &&
      template.maxPurchasableBoardWidthInches > 0
        ? template.maxPurchasableBoardWidthInches
        : 20,
    wasteFactorPercent: template.wasteFactorPercent,
    costRatesByGroup: { ...template.costRatesByGroup },
    workshop: { ...template.workshop },
    ...(template.stockWidthByMaterialGroup && Object.keys(template.stockWidthByMaterialGroup).length > 0
      ? { stockWidthByMaterialGroup: { ...template.stockWidthByMaterialGroup } }
      : {}),
  };
  const duplicated = remapGraph(template.parts, template.joints, template.connections, () => true);
  return {
    ...baseline,
    parts: duplicated.parts,
    joints: duplicated.joints,
    connections: duplicated.connections,
  };
}

export function duplicateAssemblyGroup(project: Project, assembly: AssemblyId): Project {
  const duplicated = remapGraph(
    project.parts,
    project.joints,
    project.connections,
    (part) => part.assembly === assembly,
    " (copy)"
  );
  return {
    ...project,
    parts: [...project.parts, ...duplicated.parts],
    joints: [...project.joints, ...duplicated.joints],
    connections: [...project.connections, ...duplicated.connections],
    checkpoints: {
      materialAssumptionsReviewed: false,
      joineryReviewed: false,
    },
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
    const v = JSON.parse(normalizeProjectJsonInput(json)) as unknown;
    if (!v || typeof v !== "object") return null;
    const o = v as Partial<Project>;
    if (o.version !== 1 || !Array.isArray(o.parts)) return null;
    const joints = Array.isArray(o.joints) ? o.joints : [];
    const connections = Array.isArray(o.connections) ? o.connections : [];
    const costRatesByGroup =
      o.costRatesByGroup && typeof o.costRatesByGroup === "object" ? o.costRatesByGroup : {};
    const checkpoints = o.checkpoints ?? {
      materialAssumptionsReviewed: false,
      joineryReviewed: false,
    };
    const workshop = o.workshop ?? {
      lumberProfile: "s4s_hardwood",
      offcutMode: "none",
    };
    const id = typeof o.id === "string" && o.id.length > 0 ? o.id : newProjectId();
    const maxPurchasableBoardWidthInches =
      typeof o.maxPurchasableBoardWidthInches === "number" &&
      Number.isFinite(o.maxPurchasableBoardWidthInches) &&
      o.maxPurchasableBoardWidthInches > 0
        ? o.maxPurchasableBoardWidthInches
        : 20;
    const stockWidthByMaterialGroup = parseStockWidthByMaterialGroup(o.stockWidthByMaterialGroup);
    return {
      ...(o as Project),
      id,
      joints,
      connections,
      costRatesByGroup,
      checkpoints,
      workshop,
      maxPurchasableBoardWidthInches,
      stockWidthByMaterialGroup,
    };
  } catch {
    return null;
  }
}

export function parseTemplates(json: string): ProjectTemplate[] {
  try {
    const raw = JSON.parse(normalizeProjectJsonInput(json)) as unknown;
    if (!Array.isArray(raw)) return [];
    const parsed: ProjectTemplate[] = [];
    const seenIds = new Set<string>();
    for (const row of raw) {
      if (!row || typeof row !== "object") continue;
      const candidate = row as Partial<ProjectTemplate>;
      if (
        typeof candidate.id !== "string" ||
        typeof candidate.name !== "string" ||
        typeof candidate.sourceProjectName !== "string" ||
        typeof candidate.createdAt !== "string"
      ) {
        continue;
      }
      if (seenIds.has(candidate.id)) continue;
      const project = parseProject(
        JSON.stringify({
          ...candidate,
          id: newProjectId(),
          version: 1,
          name: candidate.sourceProjectName,
        })
      );
      if (!project) continue;
      seenIds.add(candidate.id);
      parsed.push({
        id: candidate.id,
        version: 1,
        name: candidate.name,
        sourceProjectName: candidate.sourceProjectName,
        createdAt: candidate.createdAt,
        millingAllowanceInches: project.millingAllowanceInches,
        maxTransportLengthInches: project.maxTransportLengthInches,
        maxPurchasableBoardWidthInches: project.maxPurchasableBoardWidthInches,
        wasteFactorPercent: project.wasteFactorPercent,
        costRatesByGroup: project.costRatesByGroup,
        workshop: project.workshop,
        parts: project.parts,
        joints: project.joints,
        connections: project.connections,
        ...(project.stockWidthByMaterialGroup && Object.keys(project.stockWidthByMaterialGroup).length > 0
          ? { stockWidthByMaterialGroup: { ...project.stockWidthByMaterialGroup } }
          : {}),
      });
    }
    return parsed;
  } catch {
    return [];
  }
}

export function parseProjectLibrary(json: string): StoredProjectRecord[] {
  try {
    const raw = JSON.parse(normalizeProjectJsonInput(json)) as unknown;
    if (!Array.isArray(raw)) return [];
    const parsed: StoredProjectRecord[] = [];
    const seenIds = new Set<string>();
    for (const row of raw) {
      if (!row || typeof row !== "object") continue;
      const rec = row as Partial<StoredProjectRecord>;
      if (typeof rec.id !== "string" || typeof rec.name !== "string" || typeof rec.updatedAt !== "string") continue;
      if (!rec.project) continue;
      if (seenIds.has(rec.id)) continue;
      const normalized = parseProject(JSON.stringify(rec.project));
      if (!normalized) continue;
      seenIds.add(rec.id);
      const archived = typeof rec.archived === "boolean" ? rec.archived : false;
      parsed.push({
        id: rec.id,
        name: rec.name,
        updatedAt: rec.updatedAt,
        archived,
        project: normalized,
      });
    }
    return parsed;
  } catch {
    return [];
  }
}
