import { describe, expect, it } from "vitest";
import { createEmptyProject } from "@/lib/project-utils";
import { getPresetById } from "@/lib/presets/joinery-presets";
import { presetApplicationService } from "@/lib/services/PresetApplicationService";
import { joineryDependencyResolver } from "@/lib/services/JoineryDependencyResolver";
import { connectionGraphService } from "@/lib/services/ConnectionGraphService";
import { hardwareService } from "@/lib/services/HardwareService";

describe("Joinery 2.0 integration pipeline", () => {
  it("applies preset, resolves dependencies, validates graph, and yields hardware schedule", () => {
    const project = createEmptyProject();
    project.parts.push(
      {
        id: "stile-1",
        name: "Side stile",
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
      {
        id: "drawer-1",
        name: "Drawer box (A1)",
        assembly: "Drawers",
        quantity: 2,
        finished: { t: 0.5, w: 12, l: 18 },
        rough: { t: 0.5, w: 12, l: 18, manual: false },
        material: { label: "Maple", thicknessCategory: "4/4" },
        grainNote: "",
        status: "solid",
      }
    );

    const preset = getPresetById("frame-and-panel-carcass");
    expect(preset).toBeDefined();
    const applied = presetApplicationService.applyPreset(project, preset!);
    expect(applied.connections.length).toBeGreaterThan(0);

    const resolved = joineryDependencyResolver.resolveInOrder(applied.connections, project.parts);
    expect(resolved.orderedConnections.length).toBe(applied.connections.length);

    const asJoints = resolved.orderedConnections
      .filter((connection) => connection.adjustments.length > 0)
      .map((connection, index) => ({
        id: `joint-${index}`,
        ruleId: connection.sourceRuleId ?? connection.joineryMethod,
        primaryPartId: connection.adjustments[0]!.partId,
        matePartId: connection.primaryPart.partId,
        params: { depth: connection.primaryPart.dimensions.depth },
        explanation: connection.label ?? "",
        finishedBefore: { t: 0.75, w: 3, l: 18 },
        finishedAfter: { t: 0.75, w: 3, l: 16 },
      }));
    const graph = connectionGraphService.buildGraph(project.parts, asJoints);
    const graphValidation = connectionGraphService.validateGraph(graph);
    expect(graphValidation.isValid).toBe(true);

    const hardware = hardwareService.generateSchedule({ parts: resolved.adjustedParts });
    expect(hardware.length).toBeGreaterThan(0);
  });
});
