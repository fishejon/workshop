import type { Part } from "./project-types";

export type RoughCutPiece = {
  label: string;
  lengthInches: number;
};

/**
 * Expands each part by quantity into individual rough stick cuts. Uses **rough L** as the 1D stick length
 * (length along the board, dominant rip direction). Labels are `name` + space + 1-based index per instance.
 * For width-aware board counts see `lib/buy-2d/` (parallel 2D estimate, not a replacement for BF/LF).
 */
export function roughCutsFromParts(parts: Part[]): RoughCutPiece[] {
  const out: RoughCutPiece[] = [];
  for (const p of parts) {
    const q = Math.floor(Number(p.quantity));
    if (!Number.isFinite(q) || q < 1) continue;
    const L = p.rough.l;
    if (!(L > 0)) continue;
    const base = p.name.trim() || "Part";
    for (let i = 1; i <= q; i++) {
      out.push({ label: `${base} ${i}`, lengthInches: L });
    }
  }
  return out;
}
