"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type {
  AssemblyId,
  MaterialGroupCostRate,
  Part,
  Project,
  ProjectJoinConnection,
  ProjectJoint,
  ProjectTemplate,
} from "@/lib/project-types";
import {
  MAX_PROJECT_LIBRARY_RECORDS,
  PROJECT_LIBRARY_STORAGE_KEY,
  STORAGE_KEY,
  importProjectFromJson,
  applyTemplate as applyProjectTemplate,
  cloneProject,
  createEmptyProject,
  deriveRough,
  duplicateAssemblyGroup as duplicateAssemblyGroupInProject,
  newPartId,
  parseProject,
  parseProjectLibrary,
  recomputeAllRoughParts,
  serializeTemplate as serializeProjectTemplate,
  serializeProject,
  type StoredProjectRecord,
} from "@/lib/project-utils";
import {
  getBlockingValidationIssues,
  getWarningValidationIssues,
  validateProject,
} from "@/lib/validation";
import type { ValidationIssue } from "@/lib/validation/types";

type ProjectContextValue = {
  project: Project;
  validationIssues: ValidationIssue[];
  blockingValidationIssues: ValidationIssue[];
  warningValidationIssues: ValidationIssue[];
  hasBlockingValidationIssues: boolean;
  setProjectName: (name: string) => void;
  setMillingAllowanceInches: (n: number) => void;
  setMaxTransportLengthInches: (n: number) => void;
  setMaxPurchasableBoardWidthInches: (n: number) => void;
  setWasteFactorPercent: (n: number) => void;
  setMaterialGroupCostRate: (groupKey: string, rate: MaterialGroupCostRate) => void;
  /** Per-group stock width for 2D buy estimate; pass null to clear override. */
  setMaterialGroupStockWidth: (groupKey: string, widthInches: number | null) => void;
  setWorkshopLumberProfile: (profile: Project["workshop"]["lumberProfile"]) => void;
  setWorkshopOffcutMode: (mode: Project["workshop"]["offcutMode"]) => void;
  addPart: (part: Omit<Part, "id"> & { id?: string }) => void;
  addParts: (parts: Array<Omit<Part, "id"> & { id?: string }>) => void;
  replacePartsInAssemblies: (
    assemblies: AssemblyId[],
    parts: Array<Omit<Part, "id"> & { id?: string }>
  ) => void;
  updatePart: (id: string, patch: Partial<Part>) => void;
  removePart: (id: string) => void;
  clearParts: () => void;
  resetProject: () => void;
  duplicateProject: (name: string) => void;
  createTemplate: (templateName: string) => ProjectTemplate;
  applyTemplate: (template: ProjectTemplate, projectName: string) => void;
  duplicateAssemblyGroup: (assembly: AssemblyId) => void;
  exportProjectJson: () => string;
  importProjectJson: (json: string) => ImportResult;
  projectLibrary: StoredProjectRecord[];
  backupCurrentProject: (name?: string) => BackupResult;
  restoreFromLibrary: (id: string) => RestoreResult;
  setLibraryArchived: (id: string, archived: boolean) => void;
  addJointRecord: (joint: Omit<ProjectJoint, "id"> & { id?: string }) => void;
  addConnectionRecord: (c: Omit<ProjectJoinConnection, "id"> & { id?: string }) => void;
  setCheckpointReviewed: (
    checkpoint: "materialAssumptionsReviewed" | "joineryReviewed",
    reviewed: boolean
  ) => void;
};

const ProjectContext = createContext<ProjectContextValue | null>(null);

type ChangeSummary = {
  nameChanged: boolean;
  partsDelta: number;
  jointsDelta: number;
  connectionsDelta: number;
};

type ImportResult =
  | {
      ok: true;
      source: "direct" | "envelope";
      importedAtIso: string;
      exportedAtIso?: string;
      summary: ChangeSummary;
      warnings: string[];
    }
  | { ok: false; reason: string; details?: string[] };

type RestoreResult =
  | {
      ok: true;
      source: "library";
      restoredAtIso: string;
      backupUpdatedAtIso: string;
      backupName: string;
      summary: ChangeSummary;
    }
  | { ok: false; reason: string };

type BackupResult = {
  createdRecordId: string;
  retainedCount: number;
  retentionCap: number;
  droppedOldest: boolean;
  createdAtIso: string;
};

function summarizeProjectDiff(before: Project, after: Project): ChangeSummary {
  return {
    nameChanged: before.name !== after.name,
    partsDelta: after.parts.length - before.parts.length,
    jointsDelta: after.joints.length - before.joints.length,
    connectionsDelta: after.connections.length - before.connections.length,
  };
}

function loadInitial(): Project {
  if (typeof window === "undefined") return createEmptyProject();
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) return createEmptyProject();
  const parsed = parseProject(raw);
  return parsed ?? createEmptyProject();
}

export function ProjectProvider({ children }: { children: ReactNode }) {
  const resetMaterialCheckpoint = useCallback((p: Project): Project => {
    if (!p.checkpoints.materialAssumptionsReviewed) return p;
    return {
      ...p,
      checkpoints: {
        ...p.checkpoints,
        materialAssumptionsReviewed: false,
      },
    };
  }, []);

  const resetJoineryCheckpoint = useCallback((p: Project): Project => {
    if (!p.checkpoints.joineryReviewed) return p;
    return {
      ...p,
      checkpoints: {
        ...p.checkpoints,
        joineryReviewed: false,
      },
    };
  }, []);

  const [project, setProject] = useState<Project>(createEmptyProject);
  const [projectLibrary, setProjectLibrary] = useState<StoredProjectRecord[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect -- localStorage hydration after mount (avoid SSR/client mismatch) */
    setProject(loadInitial());
    const rawLibrary = window.localStorage.getItem(PROJECT_LIBRARY_STORAGE_KEY);
    setProjectLibrary(rawLibrary ? parseProjectLibrary(rawLibrary) : []);
    setHydrated(true);
    /* eslint-enable react-hooks/set-state-in-effect */
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, serializeProject(project));
    } catch {
      /* ignore quota */
    }
  }, [project, hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(PROJECT_LIBRARY_STORAGE_KEY, JSON.stringify(projectLibrary));
    } catch {
      /* ignore quota */
    }
  }, [projectLibrary, hydrated]);

  const setProjectName = useCallback((name: string) => {
    setProject((p) => ({ ...p, name }));
  }, []);

  const setMillingAllowanceInches = useCallback((n: number) => {
    setProject((p) => {
      const next = { ...p, millingAllowanceInches: n };
      return resetMaterialCheckpoint(recomputeAllRoughParts(next));
    });
  }, [resetMaterialCheckpoint]);

  const setMaxTransportLengthInches = useCallback((n: number) => {
    setProject((p) => resetMaterialCheckpoint({ ...p, maxTransportLengthInches: n }));
  }, [resetMaterialCheckpoint]);

  const setMaxPurchasableBoardWidthInches = useCallback((n: number) => {
    setProject((p) => resetMaterialCheckpoint({ ...p, maxPurchasableBoardWidthInches: n }));
  }, [resetMaterialCheckpoint]);

  const setWasteFactorPercent = useCallback((n: number) => {
    setProject((p) => resetMaterialCheckpoint({ ...p, wasteFactorPercent: n }));
  }, [resetMaterialCheckpoint]);

  const setMaterialGroupCostRate = useCallback(
    (groupKey: string, rate: MaterialGroupCostRate) => {
      setProject((p) => {
        const nextRates = { ...p.costRatesByGroup };
        const normalized: MaterialGroupCostRate = {};
        if (typeof rate.perBoardFoot === "number" && Number.isFinite(rate.perBoardFoot) && rate.perBoardFoot >= 0) {
          normalized.perBoardFoot = rate.perBoardFoot;
        }
        if (typeof rate.perLinearFoot === "number" && Number.isFinite(rate.perLinearFoot) && rate.perLinearFoot >= 0) {
          normalized.perLinearFoot = rate.perLinearFoot;
        }
        if (normalized.perBoardFoot === undefined && normalized.perLinearFoot === undefined) {
          delete nextRates[groupKey];
        } else {
          nextRates[groupKey] = normalized;
        }
        return resetMaterialCheckpoint({ ...p, costRatesByGroup: nextRates });
      });
    },
    [resetMaterialCheckpoint]
  );

  const setMaterialGroupStockWidth = useCallback(
    (groupKey: string, widthInches: number | null) => {
      setProject((p) => {
        const next = { ...(p.stockWidthByMaterialGroup ?? {}) };
        if (widthInches === null || !Number.isFinite(widthInches) || widthInches <= 0) {
          delete next[groupKey];
        } else {
          next[groupKey] = widthInches;
        }
        const keys = Object.keys(next);
        return resetMaterialCheckpoint({
          ...p,
          stockWidthByMaterialGroup: keys.length > 0 ? next : undefined,
        });
      });
    },
    [resetMaterialCheckpoint]
  );

  const setWorkshopLumberProfile = useCallback((profile: Project["workshop"]["lumberProfile"]) => {
    setProject((p) => ({ ...p, workshop: { ...p.workshop, lumberProfile: profile } }));
  }, []);

  const setWorkshopOffcutMode = useCallback((mode: Project["workshop"]["offcutMode"]) => {
    setProject((p) => ({ ...p, workshop: { ...p.workshop, offcutMode: mode } }));
  }, []);

  const addPart = useCallback((part: Omit<Part, "id"> & { id?: string }) => {
    setProject((p) => {
      const id = part.id ?? newPartId();
      const rough = part.rough.manual
        ? part.rough
        : { ...deriveRough(part.finished, p.millingAllowanceInches), manual: false };
      const full: Part = { ...part, id, rough };
      return resetJoineryCheckpoint(resetMaterialCheckpoint({ ...p, parts: [...p.parts, full] }));
    });
  }, [resetJoineryCheckpoint, resetMaterialCheckpoint]);

  const addParts = useCallback((parts: Array<Omit<Part, "id"> & { id?: string }>) => {
    setProject((p) => {
      const next = [...p.parts];
      for (const part of parts) {
        const id = part.id ?? newPartId();
        const rough = part.rough.manual
          ? part.rough
          : { ...deriveRough(part.finished, p.millingAllowanceInches), manual: false };
        next.push({ ...part, id, rough });
      }
      return resetJoineryCheckpoint(resetMaterialCheckpoint({ ...p, parts: next }));
    });
  }, [resetJoineryCheckpoint, resetMaterialCheckpoint]);

  const replacePartsInAssemblies = useCallback(
    (assemblies: AssemblyId[], parts: Array<Omit<Part, "id"> & { id?: string }>) => {
      setProject((p) => {
        const assemblySet = new Set(assemblies);
        const removedIds = new Set(
          p.parts.filter((part) => assemblySet.has(part.assembly)).map((part) => part.id)
        );
        const nextParts = p.parts.filter((part) => !assemblySet.has(part.assembly));
        for (const part of parts) {
          const id = part.id ?? newPartId();
          const rough = part.rough.manual
            ? part.rough
            : { ...deriveRough(part.finished, p.millingAllowanceInches), manual: false };
          nextParts.push({ ...part, id, rough });
        }
        const joints = p.joints.filter(
          (joint) =>
            !removedIds.has(joint.primaryPartId) &&
            (!joint.matePartId || !removedIds.has(joint.matePartId))
        );
        const connections = p.connections.filter(
          (c) => !removedIds.has(c.partAId) && !removedIds.has(c.partBId)
        );
        return resetJoineryCheckpoint(
          resetMaterialCheckpoint({ ...p, parts: nextParts, joints, connections })
        );
      });
    },
    [resetJoineryCheckpoint, resetMaterialCheckpoint]
  );

  const updatePart = useCallback((id: string, patch: Partial<Part>) => {
    setProject((p) => {
      const parts = p.parts.map((row) => {
        if (row.id !== id) return row;
        const merged = { ...row, ...patch } as Part;
        if (patch.finished && !merged.rough.manual) {
          merged.rough = { ...deriveRough(merged.finished, p.millingAllowanceInches), manual: false };
        }
        return merged;
      });
      return resetJoineryCheckpoint(resetMaterialCheckpoint({ ...p, parts }));
    });
  }, [resetJoineryCheckpoint, resetMaterialCheckpoint]);

  const removePart = useCallback((id: string) => {
    setProject((p) =>
      resetJoineryCheckpoint(
        resetMaterialCheckpoint({
          ...p,
          parts: p.parts.filter((x) => x.id !== id),
          joints: p.joints.filter((j) => j.primaryPartId !== id && j.matePartId !== id),
          connections: p.connections.filter((c) => c.partAId !== id && c.partBId !== id),
        })
      )
    );
  }, [resetJoineryCheckpoint, resetMaterialCheckpoint]);

  const clearParts = useCallback(() => {
    setProject((p) =>
      resetJoineryCheckpoint(resetMaterialCheckpoint({ ...p, parts: [], joints: [], connections: [] }))
    );
  }, [resetJoineryCheckpoint, resetMaterialCheckpoint]);

  const resetProject = useCallback(() => {
    setProject(createEmptyProject());
  }, []);

  const duplicateProject = useCallback((name: string) => {
    setProject((p) => cloneProject(p, name));
  }, []);

  const createTemplate = useCallback(
    (templateName: string) => serializeProjectTemplate(project, templateName),
    [project]
  );

  const applyTemplate = useCallback((template: ProjectTemplate, projectName: string) => {
    setProject(applyProjectTemplate(template, projectName));
  }, []);

  const duplicateAssemblyGroup = useCallback((assembly: AssemblyId) => {
    setProject((p) => duplicateAssemblyGroupInProject(p, assembly));
  }, []);

  const exportProjectJson = useCallback(() => serializeProject(project), [project]);

  const importProjectJson = useCallback((json: string) => {
    const parsed = importProjectFromJson(json);
    if (!parsed.ok) return { ok: false as const, reason: parsed.reason, details: parsed.details };
    const summary = summarizeProjectDiff(project, parsed.project);
    setProject(parsed.project);
    return {
      ok: true as const,
      source: parsed.source,
      importedAtIso: new Date().toISOString(),
      exportedAtIso: parsed.exportedAt,
      summary,
      warnings: parsed.warnings,
    };
  }, [project]);

  const backupCurrentProject = useCallback(
    (name?: string) => {
      const nowIso = new Date().toISOString();
      const record: StoredProjectRecord = {
        id: newPartId(),
        name: name?.trim() || project.name || "Untitled project",
        updatedAt: nowIso,
        archived: false,
        project,
      };
      let droppedOldest = false;
      let retainedCount = 1;
      setProjectLibrary((prev) => {
        const next = [record, ...prev];
        if (next.length > MAX_PROJECT_LIBRARY_RECORDS) {
          droppedOldest = true;
          retainedCount = MAX_PROJECT_LIBRARY_RECORDS;
          return next.slice(0, MAX_PROJECT_LIBRARY_RECORDS);
        }
        retainedCount = next.length;
        return next;
      });
      return {
        createdRecordId: record.id,
        retainedCount,
        retentionCap: MAX_PROJECT_LIBRARY_RECORDS,
        droppedOldest,
        createdAtIso: nowIso,
      };
    },
    [project]
  );

  const restoreFromLibrary = useCallback(
    (id: string) => {
      const record = projectLibrary.find((row) => row.id === id);
      if (!record) return { ok: false as const, reason: "Backup could not be found." };
      const summary = summarizeProjectDiff(project, record.project);
      setProject(record.project);
      return {
        ok: true as const,
        source: "library" as const,
        restoredAtIso: new Date().toISOString(),
        backupUpdatedAtIso: record.updatedAt,
        backupName: record.name,
        summary,
      };
    },
    [project, projectLibrary]
  );

  const setLibraryArchived = useCallback((id: string, archived: boolean) => {
    setProjectLibrary((prev) => prev.map((row) => (row.id === id ? { ...row, archived } : row)));
  }, []);

  const addJointRecord = useCallback((joint: Omit<ProjectJoint, "id"> & { id?: string }) => {
    setProject((p) =>
      resetJoineryCheckpoint({
        ...p,
        joints: [...p.joints, { ...joint, id: joint.id ?? newPartId() }],
      })
    );
  }, [resetJoineryCheckpoint]);

  const addConnectionRecord = useCallback((c: Omit<ProjectJoinConnection, "id"> & { id?: string }) => {
    setProject((p) => {
      const duplicate = p.connections.some(
        (existing) =>
          existing.jointId === c.jointId &&
          existing.partAId === c.partAId &&
          existing.partBId === c.partBId &&
          existing.ruleId === c.ruleId
      );
      if (duplicate) return p;
      return resetJoineryCheckpoint({
        ...p,
        connections: [...p.connections, { ...c, id: c.id ?? newPartId() }],
      });
    });
  }, [resetJoineryCheckpoint]);

  const setCheckpointReviewed = useCallback(
    (checkpoint: "materialAssumptionsReviewed" | "joineryReviewed", reviewed: boolean) => {
      setProject((p) => ({
        ...p,
        checkpoints: {
          ...p.checkpoints,
          [checkpoint]: reviewed,
        },
      }));
    },
    []
  );

  const value = useMemo(
    () => {
      const validationIssues = validateProject(project);
      const blockingValidationIssues = getBlockingValidationIssues(validationIssues);
      const warningValidationIssues = getWarningValidationIssues(validationIssues);
      return {
      project,
      validationIssues,
      blockingValidationIssues,
      warningValidationIssues,
      hasBlockingValidationIssues: blockingValidationIssues.length > 0,
      setProjectName,
      setMillingAllowanceInches,
      setMaxTransportLengthInches,
      setMaxPurchasableBoardWidthInches,
      setWasteFactorPercent,
      setMaterialGroupCostRate,
      setMaterialGroupStockWidth,
      setWorkshopLumberProfile,
      setWorkshopOffcutMode,
      addPart,
      addParts,
      replacePartsInAssemblies,
      updatePart,
      removePart,
      clearParts,
      resetProject,
      duplicateProject,
      createTemplate,
      applyTemplate,
      duplicateAssemblyGroup,
      exportProjectJson,
      importProjectJson,
      projectLibrary,
      backupCurrentProject,
      restoreFromLibrary,
      setLibraryArchived,
      addJointRecord,
      addConnectionRecord,
      setCheckpointReviewed,
      };
    },
    [
      project,
      setProjectName,
      setMillingAllowanceInches,
      setMaxTransportLengthInches,
      setMaxPurchasableBoardWidthInches,
      setWasteFactorPercent,
      setMaterialGroupCostRate,
      setMaterialGroupStockWidth,
      setWorkshopLumberProfile,
      setWorkshopOffcutMode,
      addPart,
      addParts,
      replacePartsInAssemblies,
      updatePart,
      removePart,
      clearParts,
      resetProject,
      duplicateProject,
      createTemplate,
      applyTemplate,
      duplicateAssemblyGroup,
      exportProjectJson,
      importProjectJson,
      projectLibrary,
      backupCurrentProject,
      restoreFromLibrary,
      setLibraryArchived,
      addJointRecord,
      addConnectionRecord,
      setCheckpointReviewed,
    ]
  );

  return <ProjectContext.Provider value={value}>{children}</ProjectContext.Provider>;
}

export function useProject(): ProjectContextValue {
  const ctx = useContext(ProjectContext);
  if (!ctx) throw new Error("useProject must be used within ProjectProvider");
  return ctx;
}
