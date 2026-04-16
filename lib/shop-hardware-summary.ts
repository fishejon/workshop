import type { Part } from "@/lib/project-types";

export type DrawerHardwareSummary = {
  /** Sum of quantities for parts whose name matches dresser drawer rows. */
  drawerBoxPartCount: number;
  /** Distinct drawer box part rows (usually one row per Col×Row label). */
  drawerBoxLineCount: number;
};

const DRAWER_BOX_PREFIX = "Drawer box (";

/**
 * Lightweight hardware handoff hints from the cut list (no SKU database).
 */
export function summarizeDrawerHardwareFromParts(parts: Part[]): DrawerHardwareSummary {
  const drawerParts = parts.filter((p) => p.name.startsWith(DRAWER_BOX_PREFIX));
  const drawerBoxPartCount = drawerParts.reduce((sum, p) => sum + Math.max(1, p.quantity), 0);
  return {
    drawerBoxPartCount,
    drawerBoxLineCount: drawerParts.length,
  };
}
