export type ValidationIssueSeverity = "high" | "warning";

export type ValidationIssueSource = "sanity" | "joinery";

export type ValidationIssueCode =
  | "drawer_box_wider_than_opening"
  | "tenon_too_long_for_part"
  | "rough_less_than_finished"
  | "invalid_opening_budget"
  | "joinery_axis_direction_conflict"
  | "joinery_repeated_axis_adjustment";

export type ValidationIssue = {
  id: string;
  severity: ValidationIssueSeverity;
  code: ValidationIssueCode;
  message: string;
  partId?: string;
  ruleIds?: string[];
  source: ValidationIssueSource;
};

export type ValidationIssueDraft = Omit<ValidationIssue, "id">;
