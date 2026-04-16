import { afterEach, describe, expect, it, vi } from "vitest";
import { cutListExportCheckpointsReady, jointsEffectiveForCutList } from "./cut-list-scope";
import { createEmptyProject } from "./project-utils";

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("cut-list scope", () => {
  it("jointsEffectiveForCutList returns empty while main-path joinery flag is off", () => {
    const p = createEmptyProject();
    p.joints = [
      {
        id: "j",
        ruleId: "dado_shelf_width",
        primaryPartId: "x",
        params: {},
        explanation: "",
        finishedBefore: { t: 1, w: 1, l: 1 },
        finishedAfter: { t: 1, w: 1, l: 1 },
      },
    ];
    expect(jointsEffectiveForCutList(p)).toEqual([]);
  });

  it("jointsEffectiveForCutList returns project joints when NEXT_PUBLIC_GL_MAIN_PATH_JOINERY=1", () => {
    vi.stubEnv("NEXT_PUBLIC_GL_MAIN_PATH_JOINERY", "1");
    const p = createEmptyProject();
    const joint = {
      id: "j",
      ruleId: "dado_shelf_width",
      primaryPartId: "x",
      params: {},
      explanation: "",
      finishedBefore: { t: 1, w: 1, l: 1 },
      finishedAfter: { t: 1, w: 1, l: 1 },
    };
    p.joints = [joint];
    expect(jointsEffectiveForCutList(p)).toEqual([joint]);
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
