import { connectionGraphService } from "@/lib/services/ConnectionGraphService";
import type { Part } from "@/lib/project-types";
import type { PartConnection } from "@/lib/types/joinery-connection";

type DependencyNode = {
  connection: PartConnection;
  dependencies: string[];
};

const STRUCTURAL_METHODS = new Set(["mortise-and-tenon", "dovetail", "sliding-dovetail"]);

export class JoineryDependencyResolver {
  buildDependencyGraph(connections: PartConnection[]): Map<string, DependencyNode> {
    const graph = new Map<string, DependencyNode>();
    for (const connection of connections) {
      graph.set(connection.id, { connection, dependencies: [] });
    }
    for (const current of connections) {
      const node = graph.get(current.id);
      if (!node) continue;
      for (const other of connections) {
        if (current.id === other.id) continue;
        if (this.affectsSameDimension(current, other) && this.shouldResolveBefore(other, current)) {
          node.dependencies.push(other.id);
        }
      }
    }
    return graph;
  }

  resolveInOrder(connections: PartConnection[], parts: Part[]) {
    const graph = this.buildDependencyGraph(connections);
    const ordered: PartConnection[] = [];
    const visited = new Set<string>();
    const active = new Set<string>();

    const visit = (nodeId: string) => {
      if (visited.has(nodeId)) return;
      if (active.has(nodeId)) {
        throw new Error(`Circular dependency detected at ${nodeId}`);
      }
      const node = graph.get(nodeId);
      if (!node) return;
      active.add(nodeId);
      for (const dep of node.dependencies) visit(dep);
      active.delete(nodeId);
      visited.add(nodeId);
      ordered.push(node.connection);
    };

    for (const id of graph.keys()) visit(id);
    const adjustedParts = connectionGraphService.applyAdjustments(parts, ordered);
    return { orderedConnections: ordered, adjustedParts };
  }

  detectCycles(connections: PartConnection[]): string[] {
    const graph = this.buildDependencyGraph(connections);
    const cycles: string[] = [];
    const visited = new Set<string>();
    const stack = new Set<string>();

    const walk = (id: string, path: string[]) => {
      if (stack.has(id)) {
        cycles.push([...path, id].join(" -> "));
        return;
      }
      if (visited.has(id)) return;
      visited.add(id);
      stack.add(id);
      const node = graph.get(id);
      if (node) {
        for (const dep of node.dependencies) walk(dep, [...path, id]);
      }
      stack.delete(id);
    };

    for (const id of graph.keys()) walk(id, []);
    return cycles;
  }

  private affectsSameDimension(a: PartConnection, b: PartConnection): boolean {
    for (const adjA of a.adjustments) {
      for (const adjB of b.adjustments) {
        if (adjA.partId === adjB.partId && adjA.dimension === adjB.dimension) return true;
      }
    }
    return false;
  }

  private shouldResolveBefore(first: PartConnection, second: PartConnection): boolean {
    const firstStructural = STRUCTURAL_METHODS.has(first.joineryMethod);
    const secondStructural = STRUCTURAL_METHODS.has(second.joineryMethod);
    if (firstStructural !== secondStructural) return firstStructural;
    return first.id < second.id;
  }
}

export const joineryDependencyResolver = new JoineryDependencyResolver();
