import type { Dimension3 } from "@/lib/project-types";

/**
 * Shelf (or similar horizontal part) seated in dados on two opposing sides.
 *
 * **Assumption:** Finished **W** is currently the **opening** between dados (flush to groove bottoms).
 * Subtract **2 × dado depth** so the shelf is shorter than the opening and can slide in.
 * **T** and **L** unchanged (typical fixed shelf: L = case depth, T = shelf thickness).
 */
export function applyDadoShelfWidth(params: { dadoDepth: number }): {
  explanation: string;
  finishedDimensionDeltas: Dimension3;
} {
  const d = Math.max(0, params.dadoDepth);
  const sub = 2 * d;
  const explanation = [
    `Dadoed shelf width: each side removes ${d.toFixed(3)}" from the shelf’s finished width (${sub.toFixed(3)}" total on W).`,
    `Assumes W was sized to the clear opening between groove bottoms; adjust if you size to other references.`,
  ].join(" ");
  return {
    explanation,
    finishedDimensionDeltas: { t: 0, w: -sub, l: 0 },
  };
}
