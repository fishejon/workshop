/**
 * Read-only case outline DTO (v0) for schematic previews derived from the cut list.
 * Not a CAD model — proportional / orientation views only.
 */

export type CaseOutlineSource = "dresser-parts-inferred";

/** Dresser orthographic inputs aligned with `DresserPreview` props. */
export type CaseOutlineV0 = {
  version: 0;
  source: CaseOutlineSource;
  outerW: number;
  outerH: number;
  outerD: number;
  columnCount: 1 | 2 | 3;
  rowCount: number;
  rowOpeningHeightsInches: number[];
  kickH: number;
  topBand: number;
  bottomBand: number;
  rail: number;
  materialT: number;
};
