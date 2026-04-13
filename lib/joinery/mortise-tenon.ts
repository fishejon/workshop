import type { Dimension3 } from "@/lib/project-types";

/**
 * Simplified mortise & tenon along the part **length (L)** axis.
 *
 * **Rail:** Finished L grows by 2× tenon length (one tenon each end). Rough follows if not manual.
 * **Stile:** Finished L shrinks by 2× tenon length (opening between rail shoulder seats).
 *
 * Assumes square-shouldered tenons full width of rail; haunches and drawbore are not modeled.
 */
export function applyMortiseTenonRail(params: { tenonLengthPerEnd: number }): {
  explanation: string;
  finishedDimensionDeltas: Dimension3;
} {
  const t = Math.max(0, params.tenonLengthPerEnd);
  const add = 2 * t;
  const explanation = [
    `Rail tenons: add ${t.toFixed(3)}" finished length at each end (${add.toFixed(3)}" total on L).`,
    `Interpret L as the rail’s long grain run; measure between stile inside faces, then add both tenons for overall blank length.`,
  ].join(" ");
  return {
    explanation,
    finishedDimensionDeltas: { t: 0, w: 0, l: add },
  };
}

export function applyMortiseTenonStile(params: { tenonLengthPerEnd: number }): {
  explanation: string;
  finishedDimensionDeltas: Dimension3;
} {
  const t = Math.max(0, params.tenonLengthPerEnd);
  const sub = 2 * t;
  const explanation = [
    `Stile between rails: subtract ${t.toFixed(3)}" per shoulder seat (${sub.toFixed(3)}" total from L).`,
    `Use when L is the exposed stile height between top and bottom rail faces; adjust if rails are haunched or stub-tenoned.`,
  ].join(" ");
  return {
    explanation,
    finishedDimensionDeltas: { t: 0, w: 0, l: -sub },
  };
}
