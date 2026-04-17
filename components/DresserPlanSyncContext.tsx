"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  type ReactNode,
} from "react";

type FlushDresserParts = () => void;

type DresserPlanSyncContextValue = {
  /** DresserPlanner registers the latest flush (clears debounce + applies carcass + drawers). */
  setDresserPartsFlush: (fn: FlushDresserParts | null) => void;
  /** Call when switching to Materials so yard/cut list match Plan inputs immediately. */
  flushDresserPartsNow: () => void;
};

const DresserPlanSyncContext = createContext<DresserPlanSyncContextValue | null>(null);

export function DresserPlanSyncProvider({ children }: { children: ReactNode }) {
  const flushRef = useRef<FlushDresserParts | null>(null);

  const setDresserPartsFlush = useCallback((fn: FlushDresserParts | null) => {
    flushRef.current = fn;
  }, []);

  const flushDresserPartsNow = useCallback(() => {
    flushRef.current?.();
  }, []);

  const value = useMemo(
    () => ({ setDresserPartsFlush, flushDresserPartsNow }),
    [setDresserPartsFlush, flushDresserPartsNow]
  );

  return (
    <DresserPlanSyncContext.Provider value={value}>{children}</DresserPlanSyncContext.Provider>
  );
}

export function useDresserPlanSync(): DresserPlanSyncContextValue {
  const ctx = useContext(DresserPlanSyncContext);
  if (!ctx) {
    throw new Error("useDresserPlanSync must be used within DresserPlanSyncProvider");
  }
  return ctx;
}
