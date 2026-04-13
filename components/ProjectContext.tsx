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
import type { AssemblyId, Part, Project, ProjectJoint } from "@/lib/project-types";
import {
  STORAGE_KEY,
  createEmptyProject,
  deriveRough,
  newPartId,
  parseProject,
  recomputeAllRoughParts,
  serializeProject,
} from "@/lib/project-utils";

type ProjectContextValue = {
  project: Project;
  setProjectName: (name: string) => void;
  setMillingAllowanceInches: (n: number) => void;
  setMaxTransportLengthInches: (n: number) => void;
  setWasteFactorPercent: (n: number) => void;
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
  addJointRecord: (joint: Omit<ProjectJoint, "id"> & { id?: string }) => void;
};

const ProjectContext = createContext<ProjectContextValue | null>(null);

function loadInitial(): Project {
  if (typeof window === "undefined") return createEmptyProject();
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) return createEmptyProject();
  const parsed = parseProject(raw);
  return parsed ?? createEmptyProject();
}

export function ProjectProvider({ children }: { children: ReactNode }) {
  const [project, setProject] = useState<Project>(createEmptyProject);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect -- localStorage hydration after mount (avoid SSR/client mismatch) */
    setProject(loadInitial());
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

  const setProjectName = useCallback((name: string) => {
    setProject((p) => ({ ...p, name }));
  }, []);

  const setMillingAllowanceInches = useCallback((n: number) => {
    setProject((p) => {
      const next = { ...p, millingAllowanceInches: n };
      return recomputeAllRoughParts(next);
    });
  }, []);

  const setMaxTransportLengthInches = useCallback((n: number) => {
    setProject((p) => ({ ...p, maxTransportLengthInches: n }));
  }, []);

  const setWasteFactorPercent = useCallback((n: number) => {
    setProject((p) => ({ ...p, wasteFactorPercent: n }));
  }, []);

  const addPart = useCallback((part: Omit<Part, "id"> & { id?: string }) => {
    setProject((p) => {
      const id = part.id ?? newPartId();
      const rough = part.rough.manual
        ? part.rough
        : { ...deriveRough(part.finished, p.millingAllowanceInches), manual: false };
      const full: Part = { ...part, id, rough };
      return { ...p, parts: [...p.parts, full] };
    });
  }, []);

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
      return { ...p, parts: next };
    });
  }, []);

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
        return { ...p, parts: nextParts, joints };
      });
    },
    []
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
      return { ...p, parts };
    });
  }, []);

  const removePart = useCallback((id: string) => {
    setProject((p) => ({
      ...p,
      parts: p.parts.filter((x) => x.id !== id),
      joints: p.joints.filter((j) => j.primaryPartId !== id && j.matePartId !== id),
    }));
  }, []);

  const clearParts = useCallback(() => {
    setProject((p) => ({ ...p, parts: [], joints: [] }));
  }, []);

  const resetProject = useCallback(() => {
    setProject(createEmptyProject());
  }, []);

  const addJointRecord = useCallback((joint: Omit<ProjectJoint, "id"> & { id?: string }) => {
    setProject((p) => ({
      ...p,
      joints: [...p.joints, { ...joint, id: joint.id ?? newPartId() }],
    }));
  }, []);

  const value = useMemo(
    () => ({
      project,
      setProjectName,
      setMillingAllowanceInches,
      setMaxTransportLengthInches,
      setWasteFactorPercent,
      addPart,
      addParts,
      replacePartsInAssemblies,
      updatePart,
      removePart,
      clearParts,
      resetProject,
      addJointRecord,
    }),
    [
      project,
      setProjectName,
      setMillingAllowanceInches,
      setMaxTransportLengthInches,
      setWasteFactorPercent,
      addPart,
      addParts,
      replacePartsInAssemblies,
      updatePart,
      removePart,
      clearParts,
      resetProject,
      addJointRecord,
    ]
  );

  return <ProjectContext.Provider value={value}>{children}</ProjectContext.Provider>;
}

export function useProject(): ProjectContextValue {
  const ctx = useContext(ProjectContext);
  if (!ctx) throw new Error("useProject must be used within ProjectProvider");
  return ctx;
}
