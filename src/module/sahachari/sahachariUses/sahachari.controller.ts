import { transaction } from "../../../config/db";
import { validateUserRole } from "../../../middleware/authCheck";
import { getStatusText } from "../../../utils/extra";
import SahachariService from "./sahachari.service";
import {
  CreateSahachariBody,
  ReturnSahachariBody
} from "./sahachari.types";

export default class SahachariController {
  service = new SahachariService();

  async createIssue(data: CreateSahachariBody) {
    return transaction(async (client) => {
      await validateUserRole({
        action_by: data.action_by,
        role: ["all handle", "sahachari handle"],
        client: client
      });
      const issue = await this.service.createIssue(data, client);
      return issue;
    });
  }

async fetchIssues(data: any) {
  const issues_with_pagination = await this.service.fetchIssues(data);

  return {
    ...issues_with_pagination,
    issues: issues_with_pagination.issues.map(issue => ({
      ...issue,
      status: getStatusText(issue.status),
    })),
  };
}

  async returnIssue(data: ReturnSahachariBody) {
    return transaction(async (client) => {
      await validateUserRole({
        action_by: data.action_by,
        role: ["all handle", "sahachari handle"],
        client: client
      });
      const result = await this.service.returnIssue(data, client);
      return result;
    });
  }
}