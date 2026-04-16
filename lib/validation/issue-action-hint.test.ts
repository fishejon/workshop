import { describe, expect, it } from "vitest";
import { validationIssueWhereHint } from "@/lib/validation/issue-action-hint";
import type { ValidationIssue } from "@/lib/validation/types";

function issue(partial: Partial<ValidationIssue> & Pick<ValidationIssue, "code" | "message" | "source">): ValidationIssue {
  return {
    id: "t",
    severity: "high",
    ...partial,
  };
}

describe("validationIssueWhereHint", () => {
  it("points dresser geometry to Plan", () => {
    expect(validationIssueWhereHint(issue({ code: "invalid_opening_budget", message: "x", source: "sanity" }))).toMatch(
      /Plan tab/
    );
  });

  it("points joinery conflicts to Labs", () => {
    expect(validationIssueWhereHint(issue({ code: "tenon_too_long_for_part", message: "x", source: "joinery" }))).toMatch(
      /Labs/
    );
  });

  it("points part-scoped issues to Materials", () => {
    expect(
      validationIssueWhereHint(
        issue({ code: "rough_less_than_finished", message: "x", source: "sanity", partId: "p1" })
      )
    ).toMatch(/Materials/);
  });
});
