import { describe, expect, it } from "vitest";
import type { Part, ProjectJoint } from "@/lib/project-types";
import { connectionGraphService } from "@/lib/services/ConnectionGraphService";

describe("ConnectionGraphService", () => {
  const parts: Part[] = [
    {
      id: "stile-1",
      name: "Left stile",
      assembly: "Case",
      quantity: 1,
      finished: { t: 0.75, w: 3, l: 30 },
      rough: { t: 0.875, w: 3.25, l: 30.25, manual: false },
      material: { label: "Oak", thicknessCategory: "4/4" },
      grainNote: "",
      status: "solid",
    },
    {
      id: "rail-1",
      name: "Top rail",
      assembly: "Case",
      quantity: 1,
      finished: { t: 0.75, w: 3, l: 18 },
      rough: { t: 0.875, w: 3.25, l: 18.25, manual: false },
      material: { label: "Oak", thicknessCategory: "4/4" },
      grainNote: "",
      status: "solid",
    },
  ];

  it("builds graph connections from project joints", () => {
    const joints: ProjectJoint[] = [
      {
        id: "j1",
        ruleId: "mortise_tenon_rail",
        primaryPartId: "rail-1",
        matePartId: "stile-1",
        params: { tenonLengthPerEnd: 1 },
        explanation: "rail gets tenons",
        finishedBefore: { t: 0.75, w: 3, l: 16 },
        finishedAfter: { t: 0.75, w: 3, l: 18 },
      },
    ];
    const graph = connectionGraphService.buildGraph(parts, joints);
    expect(graph).toHaveLength(1);
    expect(graph[0].joineryMethod).toBe("mortise-and-tenon");
  });

  it("validates bad tenon depth as invalid", () => {
    const graph = [
      {
        id: "c1",
        type: "structural" as const,
        primaryPart: { partId: "stile-1", face: "edge" as const, feature: "mortise" as const, dimensions: { depth: 0.5, width: 0.75, length: 2 } },
        secondaryPart: { partId: "rail-1", face: "end" as const, feature: "tenon" as const, dimensions: { depth: 0.6, width: 0.75, length: 2 } },
        joineryMethod: "mortise-and-tenon" as const,
        constraints: [
          {
            type: "clearance" as const,
            description: "clearance",
            rule: () => ({ isValid: false, errors: ["too deep"] }),
          },
        ],
        adjustments: [],
      },
    ];
    const result = connectionGraphService.validateGraph(graph);
    expect(result.isValid).toBe(false);
    expect(result.errors[0]).toContain("too deep");
  });
});
