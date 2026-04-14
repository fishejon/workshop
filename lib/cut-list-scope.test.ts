import { describe, expect, it } from "vitest";
import { cutListExportCheckpointsReady, jointsEffectiveForCutList } from "./cut-list-scope";
import { createEmptyProject } from "./project-utils";

describe("cut-list scope", () => {
  it("jointsEffectiveForCutList returns empty while joinery is disabled on main path", () => {
    const p = createEmptyProject();
    p.joints = [{ id: "j", ruleId: "dado_shelf_width", primaryPartId: "x", params: {}, explanation: "", finishedBefore: { t: 1, w: 1, l: 1 }, finishedAfter: { t: 1, w: 1, l: 1 } }];
    expect(jointsEffectiveForCutList(p)).toEqual([]);
  });

  it("cutListExportCheckpointsReady reflects material checkpoint only", () => {
    const p = createEmptyProject();
    p.checkpoints.materialAssumptionsReviewed = false;
    p.checkpoints.joineryReviewed = true;
    expect(cutListExportCheckpointsReady(p)).toBe(false);
    p.checkpoints.materialAssumptionsReviewed = true;
    expect(cutListExportCheckpointsReady(p)).toBe(true);
  });
});
