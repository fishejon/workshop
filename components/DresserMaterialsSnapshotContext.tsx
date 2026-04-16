"use client";

import { createContext, useContext, useMemo, useState, type ReactNode } from "react";

export type DresserMaterialsSnapshot = {
  columnInnerWidth: number | null;
  drawerZoneHeight: number | null;
  openingBudget: number | null;
  openingsSum: number | null;
  depthAvailableForBox: number | null;
  resolvedBoxDepth: number | null;
  totalWidthDeduction: number | null;
  totalHeightDeduction: number | null;
  caseOk: boolean;
  drawerMathOk: boolean;
};

type Ctx = {
  snapshot: DresserMaterialsSnapshot | null;
  setDresserSnapshot: (s: DresserMaterialsSnapshot | null) => void;
};

const DresserMaterialsSnapshotContext = createContext<Ctx | null>(null);

export function DresserMaterialsSnapshotProvider({ children }: { children: ReactNode }) {
  const [snapshot, setDresserSnapshot] = useState<DresserMaterialsSnapshot | null>(null);
  const value = useMemo(() => ({ snapshot, setDresserSnapshot }), [snapshot]);
  return (
    <DresserMaterialsSnapshotContext.Provider value={value}>{children}</DresserMaterialsSnapshotContext.Provider>
  );
}

export function useDresserMaterialsSnapshot(): DresserMaterialsSnapshot | null {
  return useContext(DresserMaterialsSnapshotContext)?.snapshot ?? null;
}

export function useSetDresserMaterialsSnapshot(): (s: DresserMaterialsSnapshot | null) => void {
  const ctx = useContext(DresserMaterialsSnapshotContext);
  if (!ctx) {
    return () => {};
  }
  return ctx.setDresserSnapshot;
}
