/**
 * Board feet: 1 BF = 144 cu in (nominal T × W × L in inches).
 * For surfaced hardwood, many yards still price 4/4 as ~1" nominal for BF — we document assumption in UI.
 */

import type { Part } from "./project-types";

export type PartBoardFeetLine = {
  partId: string;
  partName: string;
  quantity: number;
  /** Per-part rough BF (single piece). */
  boardFeetEach: number;
  /** quantity × boardFeetEach */
  boardFeetTotal: number;
  /** Single piece: rough L in feet (length axis only). */
  linearFeetEach: number;
  /** quantity × linearFeetEach — total lineal demand for this thickness group. */
  linearFeetTotal: number;
};

export function boardFeetFromDimensions(thicknessIn: number, widthIn: number, lengthIn: number): number {
  if (thicknessIn <= 0 || widthIn <= 0 || lengthIn <= 0) return 0;
  return (thicknessIn * widthIn * lengthIn) / 144;
}

export function boardFeetForPart(part: Part): number {
  return boardFeetFromDimensions(part.rough.t, part.rough.w, part.rough.l);
}

/** Lineal feet along rough L for one piece (12 in = 1 LF). */
export function linearFeetForPart(part: Part): number {
  if (part.rough.l <= 0) return 0;
  return part.rough.l / 12;
}

export type MaterialGroupKey = string;

export function materialGroupKey(materialLabel: string, thicknessCategory: string): MaterialGroupKey {
  return `${materialLabel.trim()}||${thicknessCategory.trim()}`;
}

export type BoardFootGroup = {
  key: MaterialGroupKey;
  materialLabel: string;
  thicknessCategory: string;
  lines: PartBoardFeetLine[];
  subtotalBoardFeet: number;
  /** After waste factor (multiplier). */
  adjustedBoardFeet: number;
  /** Σ (qty × rough L) / 12 for the group. */
  subtotalLinearFeet: number;
  adjustedLinearFeet: number;
};

export function groupPartsByMaterial(
  parts: Part[],
  wasteFactorPercent: number
): BoardFootGroup[] {
  const map = new Map<MaterialGroupKey, BoardFootGroup>();
  const wasteMult = 1 + Math.max(0, wasteFactorPercent) / 100;

  for (const p of parts) {
    const key = materialGroupKey(p.material.label, p.material.thicknessCategory);
    const each = boardFeetForPart(p);
    const total = each * Math.max(1, p.quantity);
    const lfEach = linearFeetForPart(p);
    const lfTotal = lfEach * Math.max(1, p.quantity);
    const line: PartBoardFeetLine = {
      partId: p.id,
      partName: p.name,
      quantity: p.quantity,
      boardFeetEach: each,
      boardFeetTotal: total,
      linearFeetEach: lfEach,
      linearFeetTotal: lfTotal,
    };
    const g = map.get(key);
    if (g) {
      g.lines.push(line);
      g.subtotalBoardFeet += total;
      g.subtotalLinearFeet += lfTotal;
    } else {
      map.set(key, {
        key,
        materialLabel: p.material.label,
        thicknessCategory: p.material.thicknessCategory,
        lines: [line],
        subtotalBoardFeet: total,
        adjustedBoardFeet: 0,
        subtotalLinearFeet: lfTotal,
        adjustedLinearFeet: 0,
      });
    }
  }

  const groups = Array.from(map.values()).map((g) => ({
    ...g,
    adjustedBoardFeet: g.subtotalBoardFeet * wasteMult,
    adjustedLinearFeet: g.subtotalLinearFeet * wasteMult,
  }));
  groups.sort((a, b) => a.materialLabel.localeCompare(b.materialLabel));
  return groups;
}

export function totalBoardFeet(groups: BoardFootGroup[]): number {
  return groups.reduce((s, g) => s + g.subtotalBoardFeet, 0);
}

export function totalAdjustedBoardFeet(groups: BoardFootGroup[]): number {
  return groups.reduce((s, g) => s + g.adjustedBoardFeet, 0);
}

export function totalLinearFeet(groups: BoardFootGroup[]): number {
  return groups.reduce((s, g) => s + g.subtotalLinearFeet, 0);
}

export function totalAdjustedLinearFeet(groups: BoardFootGroup[]): number {
  return groups.reduce((s, g) => s + g.adjustedLinearFeet, 0);
}
