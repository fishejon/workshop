import { describe, expect, it } from "vitest";
import { applyDadoShelfWidth } from "./dado-shelf";

describe("applyDadoShelfWidth", () => {
  it("subtracts 2× dado depth from finished W", () => {
    const r = applyDadoShelfWidth({ dadoDepth: 0.375 });
    expect(r.finishedDimensionDeltas).toEqual({ t: 0, w: -0.75, l: 0 });
  });
});
