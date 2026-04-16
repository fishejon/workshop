import type { Project } from "@/lib/project-types";
import { getBlockingValidationIssues, getWarningValidationIssues, validateProject } from "@/lib/validation";

export class ValidationService {
  validate(project: Project) {
    const all = validateProject(project);
    return {
      all,
      blocking: getBlockingValidationIssues(all),
      warnings: getWarningValidationIssues(all),
    };
  }
}

export const validationService = new ValidationService();
