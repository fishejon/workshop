import type { ProjectJoint, Part } from "@/lib/project-types";
import { partsToCsv } from "@/lib/parts-csv";

export class ExportService {
  exportPartsCsv(args: {
    parts: Part[];
    joints: ProjectJoint[];
    maxPurchasableBoardWidthInches: number;
    stockWidthByMaterialGroup?: Record<string, number>;
  }) {
    return partsToCsv(args.parts, args.joints, {
      maxPurchasableBoardWidthInches: args.maxPurchasableBoardWidthInches,
      stockWidthByMaterialGroup: args.stockWidthByMaterialGroup,
    });
  }
}

export const exportService = new ExportService();
