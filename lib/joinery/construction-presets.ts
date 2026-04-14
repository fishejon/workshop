import type { Part } from "@/lib/project-types";
import type { JointRuleId } from "@/lib/joinery/types";

export type ConstructionPresetId = "frame_and_panel" | "dovetailed_drawer_box" | "grooved_back_case";

export type PresetRuleApplication = {
  ruleId: JointRuleId;
  params: Record<string, number>;
  explanation: string;
  partIds: string[];
};

export type ConstructionPresetPlan = {
  id: ConstructionPresetId;
  label: string;
  summary: string;
  applications: PresetRuleApplication[];
};

function includesToken(part: Part, token: RegExp): boolean {
  return token.test(part.name.toLowerCase());
}

function uniquePartIds(parts: Part[]): string[] {
  return [...new Set(parts.map((part) => part.id))];
}

export function buildConstructionPresetPlan(parts: Part[], presetId: ConstructionPresetId): ConstructionPresetPlan {
  if (presetId === "frame_and_panel") {
    const rails = parts.filter((part) => includesToken(part, /\brail\b/));
    const stiles = parts.filter((part) => includesToken(part, /\bstile\b/));
    const panelCandidates = parts.filter(
      (part) =>
        part.assembly === "Back" ||
        (part.status === "panel" && includesToken(part, /\bpanel\b|\bback\b|\bcenter\b/))
    );
    return {
      id: "frame_and_panel",
      label: "Frame-and-panel",
      summary:
        "Applies rail tenon growth, stile shoulder reduction, and floating-panel groove allowance to panel/back inserts.",
      applications: [
        {
          ruleId: "mortise_tenon_rail",
          params: { tenonLengthPerEnd: 1 },
          explanation: "Frame rails gain tenon length at both ends so shoulder-to-shoulder rails fit stile mortises.",
          partIds: uniquePartIds(rails),
        },
        {
          ruleId: "mortise_tenon_stile",
          params: { tenonLengthPerEnd: 1 },
          explanation:
            "Frame stiles are shortened by two shoulder seats so visible height tracks rail shoulder spacing, not tenon tips.",
          partIds: uniquePartIds(stiles),
        },
        {
          ruleId: "groove_quarter_back",
          params: { grooveDepth: 0.25, panelThickness: 0.25 },
          explanation:
            "Floating panel/back insert is reduced by groove depth on both sides of width and length for seasonal movement.",
          partIds: uniquePartIds(panelCandidates),
        },
      ],
    };
  }

  if (presetId === "dovetailed_drawer_box") {
    const drawerSides = parts.filter(
      (part) => part.assembly === "Drawers" && includesToken(part, /\b(side|left|right)\b/)
    );
    const drawerFrontBack = parts.filter(
      (part) => part.assembly === "Drawers" && includesToken(part, /\b(front|back)\b/)
    );
    const drawerBottoms = parts.filter(
      (part) =>
        part.assembly === "Drawers" &&
        (includesToken(part, /\bbottom\b/) || (part.status === "panel" && includesToken(part, /\bdrawer\b/)))
    );
    return {
      id: "dovetailed_drawer_box",
      label: "Dovetailed drawer box",
      summary:
        "Applies bottom panel groove allowance and dado-seat shelf-width style adjustment for bottom capture in drawer side grooves.",
      applications: [
        {
          ruleId: "groove_quarter_back",
          params: { grooveDepth: 0.25, panelThickness: 0.25 },
          explanation:
            "Drawer bottoms captured in grooves are undersized on both axes by groove depth per side for a slip fit.",
          partIds: uniquePartIds(drawerBottoms),
        },
        {
          ruleId: "dado_shelf_width",
          params: { dadoDepth: 0.25 },
          explanation:
            "Side-to-front/back groove seating uses shelf-width style reduction so captured components clear groove bottoms.",
          partIds: uniquePartIds([...drawerSides, ...drawerFrontBack]),
        },
      ],
    };
  }

  const backPanels = parts.filter((part) => part.assembly === "Back");
  const shelves = parts.filter((part) => includesToken(part, /\bshelf\b/));
  return {
    id: "grooved_back_case",
    label: "Grooved back case",
    summary: "Applies back panel groove allowances and shelf dado width reduction for case-style captured joinery.",
    applications: [
      {
        ruleId: "groove_quarter_back",
        params: { grooveDepth: 0.25, panelThickness: 0.25 },
        explanation: "Back panel is reduced to float in perimeter grooves (depth allowance on both width and length edges).",
        partIds: uniquePartIds(backPanels),
      },
      {
        ruleId: "dado_shelf_width",
        params: { dadoDepth: 0.25 },
        explanation: "Shelves seated in opposing dados are narrowed by two dado depths for a practical installation fit.",
        partIds: uniquePartIds(shelves),
      },
    ],
  };
}
