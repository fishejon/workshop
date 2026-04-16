import { useMemo } from "react";
import type { FurnitureConfig } from "@/lib/types/furniture-config";
import { caseworkGenerationService } from "@/lib/services/CaseworkGenerationService";

export function useCaseworkGeneration(config: FurnitureConfig) {
  const parts = useMemo(() => caseworkGenerationService.generateParts(config), [config]);
  const openings = useMemo(() => caseworkGenerationService.calculateOpenings(config), [config]);

  const validation = useMemo(() => {
    const errors: string[] = [];
    if (config.dimensions.height < 12) errors.push('Height must be at least 12".');
    if (config.dimensions.width < 12) errors.push('Width must be at least 12".');
    if (config.dimensions.depth < 8) errors.push('Depth must be at least 8".');
    if (config.openings.length < 1) errors.push("At least one opening is required.");

    const seen = new Set<string>();
    for (const opening of config.openings) {
      const key = `${opening.position.row}:${opening.position.column}`;
      if (seen.has(key)) errors.push(`Overlapping opening at row ${opening.position.row + 1}, column ${opening.position.column + 1}.`);
      seen.add(key);
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }, [config]);

  return { parts, openings, validation };
}
