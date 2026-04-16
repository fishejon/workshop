import type { Part, ProjectJoint } from "@/lib/project-types";
import {
  type ConnectionAdjustment,
  type ConnectionConstraint,
  type JoineryGraphSummary,
  type JoineryMethod,
  type PartConnection,
  inferPartFaceFromName,
} from "@/lib/types/joinery-connection";

function asMethod(ruleId: string): JoineryMethod {
  if (ruleId.includes("mortise")) return "mortise-and-tenon";
  if (ruleId.includes("dado")) return "dado";
  if (ruleId.includes("groove")) return "groove";
  return "rabbet";
}

function toConnectionDimension(axis: "t" | "w" | "l"): "thickness" | "width" | "length" {
  if (axis === "t") return "thickness";
  if (axis === "w") return "width";
  return "length";
}

export class ConnectionGraphService {
  buildGraph(parts: Part[], joints: ProjectJoint[]): PartConnection[] {
    return joints
      .map((joint) => this.buildConnection(parts, joint))
      .filter((connection): connection is PartConnection => connection !== null);
  }

  validateGraph(connections: PartConnection[]) {
    const errors: string[] = [];
    for (const connection of connections) {
      for (const constraint of connection.constraints) {
        const result = constraint.rule(connection);
        if (!result.isValid) errors.push(...result.errors);
      }
    }
    return { isValid: errors.length === 0, errors };
  }

  applyAdjustments(parts: Part[], connections: PartConnection[]): Part[] {
    const byId = new Map(parts.map((part) => [part.id, { ...part, finished: { ...part.finished }, rough: { ...part.rough } }]));
    for (const connection of connections) {
      for (const adjustment of connection.adjustments) {
        const part = byId.get(adjustment.partId);
        if (!part) continue;
        if (adjustment.dimension === "length") part.finished.l += adjustment.delta;
        if (adjustment.dimension === "width") part.finished.w += adjustment.delta;
        if (adjustment.dimension === "thickness") part.finished.t += adjustment.delta;
      }
    }
    return [...byId.values()];
  }

  toAdjacencyList(connections: PartConnection[]): Map<string, string[]> {
    const graph = new Map<string, string[]>();
    for (const connection of connections) {
      const a = connection.primaryPart.partId;
      const b = connection.secondaryPart.partId;
      graph.set(a, [...(graph.get(a) ?? []), b]);
      graph.set(b, [...(graph.get(b) ?? []), a]);
    }
    return graph;
  }

  summarize(connections: PartConnection[]): JoineryGraphSummary {
    const partIds = new Set<string>();
    let adjustmentCount = 0;
    for (const connection of connections) {
      partIds.add(connection.primaryPart.partId);
      partIds.add(connection.secondaryPart.partId);
      adjustmentCount += connection.adjustments.length;
    }
    return {
      partCount: partIds.size,
      connectionCount: connections.length,
      adjustmentCount,
    };
  }

  private buildConnection(parts: Part[], joint: ProjectJoint): PartConnection | null {
    const primaryPart = parts.find((part) => part.id === joint.primaryPartId);
    if (!primaryPart) return null;
    const secondaryPart = joint.matePartId ? parts.find((part) => part.id === joint.matePartId) ?? primaryPart : primaryPart;
    const method = asMethod(joint.ruleId);
    const depth =
      joint.params.tenonLengthPerEnd ??
      joint.params.grooveDepth ??
      joint.params.dadoDepth ??
      0.25;
    const width = primaryPart.finished.t;
    const length = Math.max(primaryPart.finished.w, primaryPart.finished.l) * 0.25;
    const adjustments = this.buildAdjustments(joint);
    return {
      id: `conn-${joint.id}`,
      type: method === "dado" || method === "groove" ? "surface" : "structural",
      primaryPart: {
        partId: primaryPart.id,
        face: inferPartFaceFromName(primaryPart),
        feature: method === "mortise-and-tenon" ? "mortise" : method === "dado" ? "dado" : "groove",
        dimensions: { depth, width, length },
      },
      secondaryPart: {
        partId: secondaryPart.id,
        face: method === "mortise-and-tenon" ? "end" : inferPartFaceFromName(secondaryPart),
        feature: method === "mortise-and-tenon" ? "tenon" : method === "dado" ? "none" : "tongue",
        dimensions: { depth: Math.max(0, depth - 1 / 16), width, length },
      },
      joineryMethod: method,
      constraints: this.constraintsForMethod(method),
      adjustments,
      label: `${joint.ruleId} · ${primaryPart.name}${secondaryPart.id !== primaryPart.id ? ` → ${secondaryPart.name}` : ""}`,
      notes: joint.explanation,
      sourceRuleId: joint.ruleId,
    };
  }

  private buildAdjustments(joint: ProjectJoint): ConnectionAdjustment[] {
    const delta = {
      t: joint.finishedAfter.t - joint.finishedBefore.t,
      w: joint.finishedAfter.w - joint.finishedBefore.w,
      l: joint.finishedAfter.l - joint.finishedBefore.l,
    };
    const adjustments: ConnectionAdjustment[] = [];
    if (delta.t !== 0) adjustments.push({ partId: joint.primaryPartId, dimension: toConnectionDimension("t"), delta: delta.t, reason: joint.explanation });
    if (delta.w !== 0) adjustments.push({ partId: joint.primaryPartId, dimension: toConnectionDimension("w"), delta: delta.w, reason: joint.explanation });
    if (delta.l !== 0) adjustments.push({ partId: joint.primaryPartId, dimension: toConnectionDimension("l"), delta: delta.l, reason: joint.explanation });
    return adjustments;
  }

  private constraintsForMethod(method: JoineryMethod): ConnectionConstraint[] {
    if (method !== "mortise-and-tenon") return [];
    return [
      {
        type: "clearance",
        description: "Tenon must fit within mortise depth with relief",
        rule: (connection) => {
          const mortiseDepth = connection.primaryPart.dimensions.depth;
          const tenonDepth = connection.secondaryPart.dimensions.depth;
          const ok = tenonDepth <= mortiseDepth - 1 / 32;
          return {
            isValid: ok,
            errors: ok ? [] : [`Tenon (${tenonDepth}") exceeds mortise depth (${mortiseDepth}") with relief`],
          };
        },
      },
    ];
  }
}

export const connectionGraphService = new ConnectionGraphService();
