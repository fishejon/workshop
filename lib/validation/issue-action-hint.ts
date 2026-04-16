import type { ValidationIssue } from "@/lib/validation/types";

/**
 * Short “where to fix it” line for blocking/warning lists (tab names match AppShellTabs).
 */
export function validationIssueWhereHint(issue: ValidationIssue): string {
  if (issue.partId) {
    return "Where: Materials tab — find this part in the source parts table (Edit row).";
  }
  switch (issue.code) {
    case "invalid_opening_budget":
    case "drawer_box_wider_than_opening":
      return "Where: Plan tab — open the dresser (or current preset) section and adjust openings, rails, or overall height.";
    case "rough_less_than_finished":
      return "Where: Materials tab — edit the part; rough must be ≥ finished on each axis (or mark rough manual).";
    case "tenon_too_long_for_part":
    case "joinery_axis_direction_conflict":
    case "joinery_repeated_axis_adjustment":
      return "Where: Labs (`/labs`) — Joinery & stick layout (main cut list still ignores joinery until folded into the product path).";
    default:
      break;
  }
  if (issue.source === "joinery") {
    return "Where: Labs (`/labs`) — Joinery & stick layout.";
  }
  return "Where: Materials tab — source parts table, or Plan tab if the issue is preset geometry.";
}
