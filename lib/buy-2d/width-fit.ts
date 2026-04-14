/**
 * v1 width heuristic: integer rip count = how many stock-width “lanes” a cut spans.
 * Kerf between rips on the same face is not modeled here (deferred to v2).
 */
export function widthRipMultiplier(widthInches: number, stockWidthInches: number): number {
  if (!(widthInches > 0) || !(stockWidthInches > 0)) return 1;
  return Math.max(1, Math.ceil(widthInches / stockWidthInches - 1e-9));
}
