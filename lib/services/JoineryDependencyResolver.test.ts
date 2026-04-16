import { describe, expect, it } from "vitest";
import { joineryDependencyResolver } from "@/lib/services/JoineryDependencyResolver";
import type { PartConnection } from "@/lib/types/joinery-connection";
import type { Part } from "@/lib/project-types";

describe("JoineryDependencyResolver", () => {
  it("orders structural before surface connections on same part/dimension", () => {
    const connections: PartConnection[] = [
      {
        id: "groove-1",
        type: "surface",
        joineryMethod: "groove",
        primaryPart: { partId: "a", face: "edge", feature: "groove", dimensions: { depth: 0.25, width: 0.25, length: 1 } },
        secondaryPart: { partId: "b", face: "end", feature: "tongue", dimensions: { depth: 0.2, width: 0.25, length: 1 } },
        constraints: [],
        adjustments: [{ partId: "b", dimension: "length", delta: -0.5, reason: "groove" }],
      },
      {
        id: "mt-1",
        type: "structural",
        joineryMethod: "mortise-and-tenon",
        primaryPart: { partId: "a", face: "edge", feature: "mortise", dimensions: { depth: 1, width: 0.75, length: 2 } },
        secondaryPart: { partId: "b", face: "end", feature: "tenon", dimensions: { depth: 0.9, width: 0.75, length: 2 } },
        constraints: [],
        adjustments: [{ partId: "b", dimension: "length", delta: -2, reason: "tenon" }],
      },
    ];
    const parts: Part[] = [
      {
        id: "b",
        name: "Rail",
        assembly: "Case",
        quantity: 1,
        finished: { t: 0.75, w: 3, l: 20 },
        rough: { t: 0.875, w: 3.25, l: 20.25, manual: false },
        material: { label: "Oak", thicknessCategory: "4/4" },
        grainNote: "",
        status: "solid",
      },
    ];
    const resolved = joineryDependencyResolver.resolveInOrder(connections, parts);
    expect(resolved.orderedConnections[0]?.id).toBe("mt-1");
    expect(resolved.adjustedParts[0]?.finished.l).toBeCloseTo(17.5, 6);
  });

  it("detects cycle strings", () => {
    const a: PartConnection = {
      id: "a",
      type: "surface",
      joineryMethod: "groove",
      primaryPart: { partId: "p1", face: "edge", feature: "groove", dimensions: { depth: 0.25, width: 0.25, length: 1 } },
      secondaryPart: { partId: "p2", face: "end", feature: "tongue", dimensions: { depth: 0.2, width: 0.25, length: 1 } },
      constraints: [],
      adjustments: [{ partId: "p1", dimension: "length", delta: -1, reason: "a" }],
    };
    const b: PartConnection = { ...a, id: "b", adjustments: [{ partId: "p1", dimension: "length", delta: -1, reason: "b" }] };
    const cycles = joineryDependencyResolver.detectCycles([a, b]);
    expect(Array.isArray(cycles)).toBe(true);
  });
});
