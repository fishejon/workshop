import type { ProjectJoint } from "@/lib/project-types";

export class JoineryService {
  summarizeRecentRules(joints: ProjectJoint[], limit = 5): string[] {
    return joints
      .slice()
      .reverse()
      .slice(0, Math.max(1, limit))
      .map((joint) => joint.ruleId);
  }
}

export const joineryService = new JoineryService();
