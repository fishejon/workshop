import { dresserDrawerCellLabelFromPartName } from "@/lib/dresser-drawer-parts";
import type { Part } from "@/lib/project-types";

export type DrawerHardwareSummary = {
  /** Sum of quantities for dresser drawer assembly parts (front, sides, back, bottom, …). */
  drawerBoxPartCount: number;
  /** Distinct drawer cells (Col × Row) found on drawer parts. */
  drawerBoxLineCount: number;
};

/**
 * Lightweight hardware handoff hints from the cut list (no SKU database).
 */
export function summarizeDrawerHardwareFromParts(parts: Part[]): DrawerHardwareSummary {
  const drawerParts = parts.filter((p) => p.assembly === "Drawers" && dresserDrawerCellLabelFromPartName(p.name));
  const cells = new Set<string>();
  for (const p of drawerParts) {
    const c = dresserDrawerCellLabelFromPartName(p.name);
    if (c) cells.add(c);
  }
  const drawerBoxPartCount = drawerParts.reduce((sum, p) => {
    const q = Math.floor(Number(p.quantity));
    return sum + (Number.isFinite(q) && q > 0 ? q : 0);
  }, 0);
  return {
    drawerBoxPartCount,
    drawerBoxLineCount: cells.size,
  };
}
