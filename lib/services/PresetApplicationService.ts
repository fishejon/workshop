import type { Part, Project } from "@/lib/project-types";
import { getPresetById, type ConnectionTemplate, type JoineryPreset, type PartSelector } from "@/lib/presets/joinery-presets";
import type { PartConnection } from "@/lib/types/joinery-connection";

function selectParts(parts: Part[], selector: PartSelector): Part[] {
  return parts.filter((part) => {
    if (selector.assembly && part.assembly !== selector.assembly) return false;
    if (selector.nameIncludes && !selector.nameIncludes.some((token) => part.name.toLowerCase().includes(token.toLowerCase()))) {
      return false;
    }
    if (selector.filter && !selector.filter(part)) return false;
    return true;
  });
}

export class PresetApplicationService {
  applyPreset(project: Project, preset: JoineryPreset): { connections: PartConnection[]; warnings: string[] } {
    const connections: PartConnection[] = [];
    const warnings: string[] = [];
    for (const template of preset.connections) {
      const primaryParts = selectParts(project.parts, template.primarySelector);
      const secondaryParts = selectParts(project.parts, template.secondarySelector);
      if (primaryParts.length === 0) {
        warnings.push(`No primary matches for "${template.label}".`);
        continue;
      }
      if (secondaryParts.length === 0) {
        warnings.push(`No secondary matches for "${template.label}".`);
        continue;
      }
      for (const primaryPart of primaryParts) {
        for (const secondaryPart of secondaryParts) {
          if (primaryPart.id === secondaryPart.id) continue;
          connections.push(this.buildConnection(primaryPart, secondaryPart, template, preset));
        }
      }
    }
    return { connections, warnings };
  }

  applyPresetById(project: Project, presetId: string) {
    const preset = getPresetById(presetId);
    if (!preset) return { connections: [], warnings: [`Unknown preset "${presetId}".`] };
    return this.applyPreset(project, preset);
  }

  private buildConnection(primaryPart: Part, secondaryPart: Part, template: ConnectionTemplate, preset: JoineryPreset): PartConnection {
    const depth = template.dimensions.depth ?? preset.defaultDimensions.depth ?? 0.25;
    const width = template.dimensions.width ?? preset.defaultDimensions.width ?? primaryPart.finished.t;
    const length = template.dimensions.length ?? preset.defaultDimensions.length ?? Math.min(primaryPart.finished.l, secondaryPart.finished.l) * 0.25;
    return {
      id: `${preset.id}-${primaryPart.id}-${secondaryPart.id}-${template.joineryMethod}`,
      type: template.joineryMethod === "mortise-and-tenon" || template.joineryMethod === "dovetail" ? "structural" : "surface",
      primaryPart: {
        partId: primaryPart.id,
        face: template.primaryFace ?? "edge",
        feature: template.primaryFeature,
        dimensions: { depth, width, length, offset: template.dimensions.offset },
      },
      secondaryPart: {
        partId: secondaryPart.id,
        face: template.secondaryFace ?? "end",
        feature: template.secondaryFeature,
        dimensions: { depth: Math.max(0, depth - 1 / 16), width, length, offset: template.dimensions.offset },
      },
      joineryMethod: template.joineryMethod,
      constraints: [],
      adjustments: [
        {
          partId: secondaryPart.id,
          dimension: "length",
          delta: template.joineryMethod === "mortise-and-tenon" || template.joineryMethod === "dado" ? -2 * depth : 0,
          reason: `${template.label} (${template.joineryMethod})`,
        },
      ],
      label: `${template.label}: ${secondaryPart.name} → ${primaryPart.name}`,
      notes: preset.notes?.join("; "),
      sourceRuleId: template.joineryMethod,
    };
  }
}

export const presetApplicationService = new PresetApplicationService();
