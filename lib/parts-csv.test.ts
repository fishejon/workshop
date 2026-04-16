import { describe, expect, it } from "vitest";
import { derivePartAssumptionsDetailed } from "./part-assumptions";
import { partsToCsv } from "./parts-csv";
import type { Part, ProjectJoint } from "./project-types";

/** Minimal RFC-style CSV line parse (quoted fields, doubled quotes). */
function parseCsvLine(line: string): string[] {
  const out: string[] = [];
  let cur = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (inQuotes) {
      if (c === '"') {
        if (line[i + 1] === '"') {
          cur += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        cur += c;
      }
    } else if (c === '"') {
      inQuotes = true;
    } else if (c === ",") {
      out.push(cur);
      cur = "";
    } else {
      cur += c;
    }
  }
  out.push(cur);
  return out;
}

describe("partsToCsv", () => {
  it("exports normalized assumptions and provenance columns", () => {
    const panel: Part = {
      id: "panel-1",
      name: "Back panel",
      assembly: "Back",
      quantity: 1,
      finished: { t: 0.25, w: 24, l: 30 },
      rough: { t: 0.25, w: 24, l: 30, manual: false },
      material: { label: "White oak", thicknessCategory: "4/4" },
      grainNote: "",
      status: "panel",
    };
    const joints: ProjectJoint[] = [
      {
        id: "j1",
        ruleId: "groove_quarter_back",
        primaryPartId: "panel-1",
        params: { grooveDepth: 0.25, panelThickness: 0.25 },
        explanation: "fixture",
        finishedBefore: { t: 0.25, w: 24.5, l: 30.5 },
        finishedAfter: { t: 0.25, w: 24, l: 30 },
      },
    ];
    const csv = partsToCsv([panel], joints, {
      maxPurchasableBoardWidthInches: 20,
      stockWidthByMaterialGroup: { "White oak||4/4": 8 },
    });
    const [header, row] = csv.split("\n");
    expect(header).toContain("provenance_summary");
    expect(header).toContain("glue_up_board_width_source");
    expect(row).toContain("material_override");
    expect(row).toContain("Joinery-adjusted finished size");
    expect(row).toContain("Glue-up required assumption");
  });

  it("uses the same joinery / glue-up / provenance strings as derivePartAssumptionsDetailed (Parts + print parity)", () => {
    const panel: Part = {
      id: "panel-1",
      name: "Back panel",
      assembly: "Back",
      quantity: 1,
      finished: { t: 0.25, w: 24, l: 30 },
      rough: { t: 0.25, w: 24, l: 30, manual: false },
      material: { label: "White oak", thicknessCategory: "4/4" },
      grainNote: "",
      status: "panel",
    };
    const joints: ProjectJoint[] = [
      {
        id: "j1",
        ruleId: "groove_quarter_back",
        primaryPartId: "panel-1",
        params: { grooveDepth: 0.25, panelThickness: 0.25 },
        explanation: "fixture",
        finishedBefore: { t: 0.25, w: 24.5, l: 30.5 },
        finishedAfter: { t: 0.25, w: 24, l: 30 },
      },
    ];
    const projectPick = {
      maxPurchasableBoardWidthInches: 20,
      stockWidthByMaterialGroup: { "White oak||4/4": 8 } as Record<string, number>,
    };
    const derived = derivePartAssumptionsDetailed(panel, joints, projectPick);
    const csv = partsToCsv([panel], joints, projectPick);
    const [headerLine, rowLine] = csv.split("\n");
    const headers = parseCsvLine(headerLine);
    const row = parseCsvLine(rowLine);
    const ix = (name: string) => {
      const i = headers.indexOf(name);
      expect(i).toBeGreaterThanOrEqual(0);
      return i;
    };
    expect(row[ix("joinery_assumption")]).toBe(derived.assumptions.joinery);
    expect(row[ix("glue_up_assumption")]).toBe(derived.assumptions.glueUp);
    expect(row[ix("provenance_summary")]).toBe(derived.provenanceSummary);
  });
});
