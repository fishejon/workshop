"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
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
import { pruneCutProgressForPartIds } from "@/lib/rough-instance-id";
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
  setProjectDescription: (description: string) => void;
  setProjectPhotos: (photos: string[]) => void;
  setMillingAllowanceInches: (n: number) => void;
  setMaxTransportLengthInches: (n: number) => void;
  setMaxPurchasableBoardWidthInches: (n: number) => void;
  setWasteFactorPercent: (n: number) => void;
  setMaterialGroupCostRate: (groupKey: string, rate: MaterialGroupCostRate) => void;
  /** Per-group stock width for 2D buy estimate; pass null to clear override. */
  setMaterialGroupStockWidth: (groupKey: string, widthInches: number | null) => void;
  setWorkshopLumberProfile: (profile: Project["workshop"]["lumberProfile"]) => void;
  setWorkshopOffcutMode: (mode: Project["workshop"]["offcutMode"]) => void;
  setOmitDresserCaseBackFromHardwoodCutList: (omit: boolean) => void;
  setDrawerYardPackAxis: (axis: "height" | "width") => void;
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
  backupCurrentProject: (name?: string, options?: { forceNew?: boolean }) => BackupResult;
  restoreFromLibrary: (id: string) => RestoreResult;
  /** Load an editable copy of a library row into the workspace (new project id; does not change the library row). */
  forkProjectFromLibrary: (id: string, name: string) => { ok: true } | { ok: false; reason: string };
  setLibraryArchived: (id: string, archived: boolean) => void;
  deleteLibraryRecord: (id: string) => void;
  addJointRecord: (joint: Omit<ProjectJoint, "id"> & { id?: string }) => void;
  addConnectionRecord: (c: Omit<ProjectJoinConnection, "id"> & { id?: string }) => void;
  setCheckpointReviewed: (
    checkpoint: "materialAssumptionsReviewed" | "joineryReviewed",
    reviewed: boolean
  ) => void;
  /** Toggle “cut” progress for one rough-length instance (`partId:instanceIndex`). */
  toggleCutProgress: (roughInstanceId: string) => void;
  clearCutProgress: () => void;
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
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
  /** True when an existing library row (see `project.activeLibraryRecordId`) was overwritten. */
  updatedExisting: boolean;
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

export function ProjectProvider({ children }: { children: ReactNode }) {
  const MAX_UNDO_STEPS = 60;
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

  /** Same initial snapshot on server and client so SSR markup matches first client paint; load localStorage after mount. */
  const [project, setProjectState] = useState<Project>(() => createEmptyProject());
  const [projectLibrary, setProjectLibrary] = useState<StoredProjectRecord[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [undoPast, setUndoPast] = useState<Project[]>([]);
  const [undoFuture, setUndoFuture] = useState<Project[]>([]);

  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect -- one-shot rehydrate from localStorage after mount; initial state must match SSR for hydration */
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = parseProject(raw);
      if (parsed) setProjectState(parsed);
    }
    const rawLibrary = window.localStorage.getItem(PROJECT_LIBRARY_STORAGE_KEY);
    if (rawLibrary) {
      setProjectLibrary(parseProjectLibrary(rawLibrary));
    }
    setHydrated(true);
    /* eslint-enable react-hooks/set-state-in-effect */
  }, []);

  const setProject = useCallback((updater: Project | ((prev: Project) => Project)) => {
    setProjectState((prev) => {
      const next = typeof updater === "function" ? (updater as (value: Project) => Project)(prev) : updater;
      if (next === prev) return prev;
      setUndoPast((past) => [...past.slice(-(MAX_UNDO_STEPS - 1)), prev]);
      setUndoFuture([]);
      return next;
    });
  }, [MAX_UNDO_STEPS]);

  const undo = useCallback(() => {
    setUndoPast((past) => {
      const previous = past[past.length - 1];
      if (!previous) return past;
      setProjectState((current) => {
        setUndoFuture((future) => [current, ...future].slice(0, MAX_UNDO_STEPS));
        return previous;
      });
      return past.slice(0, -1);
    });
  }, [MAX_UNDO_STEPS]);

  const redo = useCallback(() => {
    setUndoFuture((future) => {
      const next = future[0];
      if (!next) return future;
      setProjectState((current) => {
        setUndoPast((past) => [...past.slice(-(MAX_UNDO_STEPS - 1)), current]);
        return next;
      });
      return future.slice(1);
    });
  }, [MAX_UNDO_STEPS]);

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
  }, [setProject]);

  const setProjectDescription = useCallback((description: string) => {
    setProject((p) => ({ ...p, description }));
  }, [setProject]);

  const setProjectPhotos = useCallback((photos: string[]) => {
    setProject((p) => ({ ...p, photos }));
  }, [setProject]);

  const setMillingAllowanceInches = useCallback((n: number) => {
    setProject((p) => {
      const next = { ...p, millingAllowanceInches: n };
      return resetMaterialCheckpoint(recomputeAllRoughParts(next));
    });
  }, [resetMaterialCheckpoint, setProject]);

  const setMaxTransportLengthInches = useCallback((n: number) => {
    setProject((p) => resetMaterialCheckpoint({ ...p, maxTransportLengthInches: n }));
  }, [resetMaterialCheckpoint, setProject]);

  const setMaxPurchasableBoardWidthInches = useCallback((n: number) => {
    setProject((p) => resetMaterialCheckpoint({ ...p, maxPurchasableBoardWidthInches: n }));
  }, [resetMaterialCheckpoint, setProject]);

  const setWasteFactorPercent = useCallback((n: number) => {
    setProject((p) => resetMaterialCheckpoint({ ...p, wasteFactorPercent: n }));
  }, [resetMaterialCheckpoint, setProject]);

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
    [resetMaterialCheckpoint, setProject]
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
    [resetMaterialCheckpoint, setProject]
  );

  const setWorkshopLumberProfile = useCallback((profile: Project["workshop"]["lumberProfile"]) => {
    setProject((p) => ({ ...p, workshop: { ...p.workshop, lumberProfile: profile } }));
  }, [setProject]);

  const setWorkshopOffcutMode = useCallback((mode: Project["workshop"]["offcutMode"]) => {
    setProject((p) => ({ ...p, workshop: { ...p.workshop, offcutMode: mode } }));
  }, [setProject]);

  const setOmitDresserCaseBackFromHardwoodCutList = useCallback((omit: boolean) => {
    setProject((p) => ({ ...p, omitDresserCaseBackFromHardwoodCutList: omit }));
  }, [setProject]);

  const setDrawerYardPackAxis = useCallback((axis: "height" | "width") => {
    setProject((p) => ({ ...p, drawerYardPackAxis: axis }));
  }, [setProject]);

  const addPart = useCallback((part: Omit<Part, "id"> & { id?: string }) => {
    setProject((p) => {
      const id = part.id ?? newPartId();
      const rough = part.rough.manual
        ? part.rough
        : { ...deriveRough(part.finished, p.millingAllowanceInches), manual: false };
      const full: Part = { ...part, id, rough };
      return resetJoineryCheckpoint(resetMaterialCheckpoint({ ...p, parts: [...p.parts, full] }));
    });
  }, [resetJoineryCheckpoint, resetMaterialCheckpoint, setProject]);

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
  }, [resetJoineryCheckpoint, resetMaterialCheckpoint, setProject]);

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
        const cutProgressByRoughInstanceId = pruneCutProgressForPartIds(
          p.cutProgressByRoughInstanceId,
          removedIds
        );
        return resetJoineryCheckpoint(
          resetMaterialCheckpoint({ ...p, parts: nextParts, joints, connections, cutProgressByRoughInstanceId })
        );
      });
    },
    [resetJoineryCheckpoint, resetMaterialCheckpoint, setProject]
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
  }, [resetJoineryCheckpoint, resetMaterialCheckpoint, setProject]);

  const removePart = useCallback((id: string) => {
    setProject((p) => {
      const cutProgressByRoughInstanceId = pruneCutProgressForPartIds(p.cutProgressByRoughInstanceId, new Set([id]));
      return resetJoineryCheckpoint(
        resetMaterialCheckpoint({
          ...p,
          parts: p.parts.filter((x) => x.id !== id),
          joints: p.joints.filter((j) => j.primaryPartId !== id && j.matePartId !== id),
          connections: p.connections.filter((c) => c.partAId !== id && c.partBId !== id),
          cutProgressByRoughInstanceId,
        })
      );
    });
  }, [resetJoineryCheckpoint, resetMaterialCheckpoint, setProject]);

  const clearParts = useCallback(() => {
    setProject((p) =>
      resetJoineryCheckpoint(
        resetMaterialCheckpoint({ ...p, parts: [], joints: [], connections: [], cutProgressByRoughInstanceId: {} })
      )
    );
  }, [resetJoineryCheckpoint, resetMaterialCheckpoint, setProject]);

  const resetProject = useCallback(() => {
    setProject(createEmptyProject());
  }, [setProject]);

  const duplicateProject = useCallback((name: string) => {
    setProject((p) => cloneProject(p, name));
  }, [setProject]);

  const createTemplate = useCallback(
    (templateName: string) => serializeProjectTemplate(project, templateName),
    [project]
  );

  const applyTemplate = useCallback((template: ProjectTemplate, projectName: string) => {
    setProject(applyProjectTemplate(template, projectName));
  }, [setProject]);

  const duplicateAssemblyGroup = useCallback((assembly: AssemblyId) => {
    setProject((p) => duplicateAssemblyGroupInProject(p, assembly));
  }, [setProject]);

  const exportProjectJson = useCallback(() => serializeProject(project), [project]);

  const importProjectJson = useCallback((json: string) => {
    const parsed = importProjectFromJson(json);
    if (!parsed.ok) return { ok: false as const, reason: parsed.reason, details: parsed.details };
    const summary = summarizeProjectDiff(project, parsed.project);
    setProject({ ...parsed.project, activeLibraryRecordId: undefined });
    return {
      ok: true as const,
      source: parsed.source,
      importedAtIso: new Date().toISOString(),
      exportedAtIso: parsed.exportedAt,
      summary,
      warnings: parsed.warnings,
    };
  }, [project, setProject]);

  const backupCurrentProject = useCallback(
    (name?: string, options?: { forceNew?: boolean }) => {
      const nowIso = new Date().toISOString();
      const trimmedName = (name?.trim() || project.name || "Untitled project").trim() || "Untitled project";
      const projectSnapshot = JSON.parse(JSON.stringify(project)) as Project;
      let freshCreateId: string | null = null;
      let recordId = "";
      let updatedExisting = false;
      let retainedCount = 0;
      let droppedOldest = false;

      setProjectLibrary((prev) => {
        const binding = options?.forceNew ? undefined : project.activeLibraryRecordId;
        const cap = MAX_PROJECT_LIBRARY_RECORDS;
        const trim = (rows: StoredProjectRecord[]) => {
          if (rows.length > cap) {
            return { rows: rows.slice(0, cap), droppedOldest: true, retainedCount: cap };
          }
          return { rows, droppedOldest: false, retainedCount: rows.length };
        };

        if (binding) {
          const idx = prev.findIndex((r) => r.id === binding);
          if (idx >= 0) {
            const row = prev[idx]!;
            const merged: StoredProjectRecord = {
              ...row,
              name: trimmedName,
              updatedAt: nowIso,
              project: { ...projectSnapshot, activeLibraryRecordId: binding },
            };
            const packed = trim([merged, ...prev.filter((_, j) => j !== idx)]);
            recordId = binding;
            updatedExisting = true;
            retainedCount = packed.retainedCount;
            droppedOldest = packed.droppedOldest;
            return packed.rows;
          }
        }

        if (!freshCreateId) freshCreateId = newPartId();
        const newId = freshCreateId;
        const mergedProject = { ...projectSnapshot, activeLibraryRecordId: newId };
        const record: StoredProjectRecord = {
          id: newId,
          name: trimmedName,
          updatedAt: nowIso,
          archived: false,
          project: mergedProject,
        };
        const packed = trim([record, ...prev]);
        recordId = newId;
        updatedExisting = false;
        retainedCount = packed.retainedCount;
        droppedOldest = packed.droppedOldest;
        return packed.rows;
      });

      if (!updatedExisting) {
        setProject((p) => (p.activeLibraryRecordId === recordId ? p : { ...p, activeLibraryRecordId: recordId }));
      }

      return {
        createdRecordId: recordId,
        updatedExisting,
        retainedCount,
        retentionCap: MAX_PROJECT_LIBRARY_RECORDS,
        droppedOldest,
        createdAtIso: nowIso,
      };
    },
    [project, setProject]
  );

  const restoreFromLibrary = useCallback(
    (id: string) => {
      const record = projectLibrary.find((row) => row.id === id);
      if (!record) return { ok: false as const, reason: "Backup could not be found." };
      const summary = summarizeProjectDiff(project, record.project);
      setProject({ ...record.project, activeLibraryRecordId: id });
      return {
        ok: true as const,
        source: "library" as const,
        restoredAtIso: new Date().toISOString(),
        backupUpdatedAtIso: record.updatedAt,
        backupName: record.name,
        summary,
      };
    },
    [project, projectLibrary, setProject]
  );

  const forkProjectFromLibrary = useCallback(
    (id: string, name: string) => {
      const record = projectLibrary.find((row) => row.id === id);
      if (!record) return { ok: false as const, reason: "Project could not be found." };
      const nextName = name.trim() || `${record.name} copy`;
      setProject(cloneProject(record.project, nextName));
      return { ok: true as const };
    },
    [projectLibrary, setProject]
  );

  const setLibraryArchived = useCallback((id: string, archived: boolean) => {
    setProjectLibrary((prev) => prev.map((row) => (row.id === id ? { ...row, archived } : row)));
  }, []);

  const deleteLibraryRecord = useCallback((id: string) => {
    setProjectLibrary((prev) => prev.filter((row) => row.id !== id));
    setProject((p) => (p.activeLibraryRecordId === id ? { ...p, activeLibraryRecordId: undefined } : p));
  }, [setProject]);

  const addJointRecord = useCallback((joint: Omit<ProjectJoint, "id"> & { id?: string }) => {
    setProject((p) =>
      resetJoineryCheckpoint({
        ...p,
        joints: [...p.joints, { ...joint, id: joint.id ?? newPartId() }],
      })
    );
  }, [resetJoineryCheckpoint, setProject]);

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
  }, [resetJoineryCheckpoint, setProject]);

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
    [setProject]
  );

  const toggleCutProgress = useCallback((roughInstanceId: string) => {
    setProject((p) => {
      const cur = p.cutProgressByRoughInstanceId ?? {};
      const next = { ...cur };
      if (next[roughInstanceId] === "cut") {
        delete next[roughInstanceId];
      } else {
        next[roughInstanceId] = "cut";
      }
      return { ...p, cutProgressByRoughInstanceId: next };
    });
  }, [setProject]);

  const clearCutProgress = useCallback(() => {
    setProject((p) => ({ ...p, cutProgressByRoughInstanceId: {} }));
  }, [setProject]);

  const validationIssues = validateProject(project);
  const blockingValidationIssues = getBlockingValidationIssues(validationIssues);
  const warningValidationIssues = getWarningValidationIssues(validationIssues);
  const value: ProjectContextValue = {
    project,
    validationIssues,
    blockingValidationIssues,
    warningValidationIssues,
    hasBlockingValidationIssues: blockingValidationIssues.length > 0,
    setProjectName,
    setProjectDescription,
    setProjectPhotos,
    setMillingAllowanceInches,
    setMaxTransportLengthInches,
    setMaxPurchasableBoardWidthInches,
    setWasteFactorPercent,
    setMaterialGroupCostRate,
    setMaterialGroupStockWidth,
    setWorkshopLumberProfile,
    setWorkshopOffcutMode,
    setOmitDresserCaseBackFromHardwoodCutList,
    setDrawerYardPackAxis,
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
    forkProjectFromLibrary,
    setLibraryArchived,
    deleteLibraryRecord,
    addJointRecord,
    addConnectionRecord,
    setCheckpointReviewed,
    toggleCutProgress,
    clearCutProgress,
    undo,
    redo,
    canUndo: undoPast.length > 0,
    canRedo: undoFuture.length > 0,
  };

  return <ProjectContext.Provider value={value}>{children}</ProjectContext.Provider>;
}

export function useProject(): ProjectContextValue {
  const ctx = useContext(ProjectContext);
  if (!ctx) throw new Error("useProject must be used within ProjectProvider");
  return ctx;
}
