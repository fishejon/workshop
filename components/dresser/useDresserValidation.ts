import { useMemo } from "react";

export type DresserValidationConfig = {
  height: number;
  width: number;
  depth: number;
  rows: number;
  columns: number;
  materialThickness: number;
  kickHeight: number;
  topThickness: number;
};

export type DresserValidationResult = {
  isValid: boolean;
  errors: string[];
  warnings: string[];
};

export function useDresserValidation(config: DresserValidationConfig): DresserValidationResult {
  return useMemo(() => {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (config.height < 12) errors.push('Height must be at least 12".');
    if (config.width < 12) errors.push('Width must be at least 12".');
    if (config.depth < 8) errors.push('Depth must be at least 8".');
    if (config.rows < 1) errors.push("At least one row is required.");
    if (config.columns < 1) errors.push("At least one column is required.");

    const interiorHeight = config.height - config.kickHeight - config.topThickness - config.materialThickness * 2;
    const drawerHeight = interiorHeight / Math.max(1, config.rows);
    if (drawerHeight < 3) {
      errors.push(`Drawer opening too small (${drawerHeight.toFixed(2)}").`);
    } else if (drawerHeight < 4) {
      warnings.push("Drawer openings are shallow; verify usability.");
    }

    const estimatedColumnWidth = config.width / Math.max(1, config.columns);
    if (estimatedColumnWidth < 8) {
      errors.push("Columns are too narrow; reduce columns or increase overall width.");
    }

    return { isValid: errors.length === 0, errors, warnings };
  }, [config]);
}
