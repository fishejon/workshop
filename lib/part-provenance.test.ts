import { describe, expect, it } from "vitest";
import {
  formatDrawerJoineryPresetLabel,
  formatJointRuleLabel,
  summarizePartProvenance,
} from "@/lib/part-provenance";
import type { Part, ProjectJoint } from "@/lib/project-types";

function makePart(id: string, manual = false): Part {
  return {
    id,
    name: "Part",
    assembly: "Other",
    quantity: 1,
    finished: { t: 0.75, w: 3, l: 24 },
    rough: { t: 1.25, w: 3.5, l: 24.5, manual },
    material: { label: "Hardwood", thicknessCategory: "4/4" },
    grainNote: "",
    status: "solid",
  };
}

describe("summarizePartProvenance", () => {
  it("tracks manual rough and joinery change count", () => {
    const part = makePart("p-1", true);
    const joints: ProjectJoint[] = [
      {
        id: "j-1",
        ruleId: "dado_shelf_width",
        primaryPartId: "p-1",
        params: { dadoDepth: 0.25 },
        explanation: "Test",
        finishedBefore: { t: 0.75, w: 10, l: 24 },
        finishedAfter: { t: 0.75, w: 9.5, l: 24 },
      },
      {
        id: "j-2",
        ruleId: "mortise_tenon_stile",
        primaryPartId: "other",
        matePartId: "p-1",
        params: { tenonLengthPerEnd: 1 },
        explanation: "Test",
        finishedBefore: { t: 0.75, w: 2, l: 32 },
        finishedAfter: { t: 0.75, w: 2, l: 30 },
      },
    ];

    expect(summarizePartProvenance(part, joints)).toEqual({
      roughSource: "manual",
      joineryChangeCount: 1,
      joineryReferenceCount: 1,
      lastJoineryRuleId: "dado_shelf_width",
    });
  });
});

describe("formatJointRuleLabel", () => {
  it("returns friendly known labels and fallback for unknown ids", () => {
    expect(formatJointRuleLabel("groove_quarter_back")).toBe("Groove / 1/4 back");
    expect(formatJointRuleLabel("custom_rule")).toBe("custom_rule");
  });
});

describe("formatDrawerJoineryPresetLabel", () => {
  it("returns engineering labels for drawer joinery presets", () => {
    expect(formatDrawerJoineryPresetLabel("dovetail_full_overlap")).toBe("Drawer dovetail (full overlap)");
    expect(formatDrawerJoineryPresetLabel("dovetail_half_lap")).toBe("Drawer dovetail (half-lap)");
  });
});
