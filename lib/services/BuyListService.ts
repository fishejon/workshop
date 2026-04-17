import { groupPartsByMaterial } from "@/lib/board-feet";
import { partsForHardwoodYardCutList } from "@/lib/cut-list-yard-parts";
import { buildLumberVehicleRows } from "@/lib/lumber-vehicle-summary";
import { evaluateAllPurchaseScenarios } from "@/lib/purchase-scenarios";
import type { Project } from "@/lib/project-types";

export class BuyListService {
  buildGroups(project: Project) {
    const parts = partsForHardwoodYardCutList(project);
    return groupPartsByMaterial(parts, project.wasteFactorPercent);
  }

  buildLumberRows(project: Project) {
    const parts = partsForHardwoodYardCutList(project);
    const groups = groupPartsByMaterial(parts, project.wasteFactorPercent);
    return buildLumberVehicleRows(groups, parts, project.maxTransportLengthInches, {
      maxPurchasableBoardWidthInches: project.maxPurchasableBoardWidthInches,
      stockWidthByMaterialGroup: project.stockWidthByMaterialGroup,
    });
  }

  buildPurchaseScenarios(project: Project) {
    const parts = partsForHardwoodYardCutList(project);
    return evaluateAllPurchaseScenarios({
      parts,
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
