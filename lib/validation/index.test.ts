import { describe, expect, it } from "vitest";
import { VALIDATION_FIXTURE_PROJECT } from "@/lib/fixtures/validation.fixture";
import {
  canExportOrPrintProject,
  getBlockingValidationIssues,
  getWarningValidationIssues,
  validateProject,
} from "@/lib/validation";

describe("validateProject", () => {
  it("detects sanity and joinery issues with stable ordering", () => {
    const issues = validateProject(VALIDATION_FIXTURE_PROJECT);
    expect(issues.length).toBeGreaterThan(0);
    expect(issues[0]?.severity).toBe("high");
    expect(issues[0]?.id).toBeTruthy();

    const codes = issues.map((issue) => issue.code);
    expect(codes).toContain("drawer_box_wider_than_opening");
    expect(codes).toContain("tenon_too_long_for_part");
    expect(codes).toContain("rough_less_than_finished");
    expect(codes).toContain("joinery_axis_direction_conflict");
  });

  it("splits blocking vs warning and gates print/export", () => {
    const issues = validateProject(VALIDATION_FIXTURE_PROJECT);
    const blocking = getBlockingValidationIssues(issues);
    const warnings = getWarningValidationIssues(issues);

    expect(blocking.length).toBeGreaterThan(0);
    expect(warnings.length).toBeGreaterThanOrEqual(0);
    expect(canExportOrPrintProject(true, issues)).toBe(false);
    expect(canExportOrPrintProject(false, issues)).toBe(false);
    expect(canExportOrPrintProject(true, [])).toBe(true);
  });

  it("dedupes repeated identical issues", () => {
    const project = {
      ...VALIDATION_FIXTURE_PROJECT,
      parts: [
        ...VALIDATION_FIXTURE_PROJECT.parts,
        {
          ...VALIDATION_FIXTURE_PROJECT.parts[0],
        },
      ],
    };
    const issues = validateProject(project);
    const uniqueIds = new Set(issues.map((issue) => issue.id));
    expect(uniqueIds.size).toBe(issues.length);
  });
});
