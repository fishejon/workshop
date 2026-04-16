import { buildLumberVehicleRows } from "@/lib/lumber-vehicle-summary";
import { groupPartsByMaterial } from "@/lib/board-feet";
import { evaluateAllPurchaseScenarios } from "@/lib/purchase-scenarios";
import type { Project } from "@/lib/project-types";

export class BuyListService {
  buildGroups(project: Project) {
    return groupPartsByMaterial(project.parts, project.wasteFactorPercent);
  }

  buildLumberRows(project: Project) {
    const groups = this.buildGroups(project);
    return buildLumberVehicleRows(groups, project.parts, project.maxTransportLengthInches, {
      maxPurchasableBoardWidthInches: project.maxPurchasableBoardWidthInches,
      stockWidthByMaterialGroup: project.stockWidthByMaterialGroup,
    });
  }

  buildPurchaseScenarios(project: Project) {
    return evaluateAllPurchaseScenarios({
      parts: project.parts,
      wasteFactorPercent: project.wasteFactorPercent,
      maxTransportLengthInches: project.maxTransportLengthInches,
      maxPurchasableBoardWidthInches: project.maxPurchasableBoardWidthInches,
      stockWidthByMaterialGroup: project.stockWidthByMaterialGroup,
      costRatesByGroup: project.costRatesByGroup,
      kerfInches: 0.125,
    });
  }
}

export const buyListService = new BuyListService();
