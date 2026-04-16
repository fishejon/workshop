import type { Part, Project } from "@/lib/project-types";
import type { HardwareItem } from "@/lib/types/hardware";

export class HardwareService {
  generateSchedule(project: Pick<Project, "parts">): HardwareItem[] {
    const schedule: HardwareItem[] = [];
    const drawerRows = project.parts.filter((part) => part.assembly === "Drawers" && part.name.toLowerCase().includes("drawer"));
    if (drawerRows.length > 0) {
      const drawerCount = drawerRows.reduce((sum, row) => sum + Math.max(1, row.quantity), 0);
      const maxDepth = Math.max(...drawerRows.map((row) => row.finished.l));
      schedule.push({
        id: "drawer-slides",
        type: "drawer-slide",
        specs: {
          slideType: "undermount",
          extension: "full",
          length: this.recommendSlideLength(maxDepth),
          weightCapacity: 100,
          finish: "zinc",
        },
        quantity: drawerCount * 2,
        associatedParts: drawerRows.map((row) => row.id),
        notes: "Confirm manufacturer clearances and weight ratings.",
      });
      schedule.push({
        id: "drawer-pulls",
        type: "pull",
        specs: { finish: "match project hardware pack", screwSize: "#8 x 1in" },
        quantity: drawerCount,
        associatedParts: drawerRows.map((row) => row.id),
      });
    }
    return schedule;
  }

  applyHardwareClearances(parts: Part[], hardware: HardwareItem[]) {
    const warnings: string[] = [];
    for (const item of hardware) {
      if (item.type !== "drawer-slide" || item.specs.slideType !== "undermount") continue;
      for (const partId of item.associatedParts) {
        const part = parts.find((row) => row.id === partId);
        if (!part) continue;
        if (part.finished.w < 1) {
          warnings.push(`Drawer part "${part.name}" width looks invalid for slide clearances.`);
        }
      }
    }
    return { adjustedParts: parts, warnings };
  }

  private recommendSlideLength(drawerDepth: number): number {
    const standard = [10, 12, 14, 16, 18, 20, 22];
    const target = drawerDepth - 1.5;
    return standard.filter((len) => len <= target).pop() ?? standard[0]!;
  }
}

export const hardwareService = new HardwareService();
