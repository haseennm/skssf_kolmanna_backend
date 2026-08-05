import { transaction } from "../../config/db";
import { validateUserRole } from "../../middleware/authCheck";
import { AppError } from "../../utils/AppError";
import { getStatusText } from "../../utils/extra";
import ActiveYearService from "./activeYear.service";
import {
    ChangeStatusYear,
    CreateActiveYearBody,
    DeleteActiveYearBody,
    EditActiveYearBody
} from "./activeYear.types";

export default class ActiveYearController {

    service = new ActiveYearService();
    private isValidYearRange(yearRange: string) {
        const regex = /^(\d{2}|\d{4})-(\d{2}|\d{4})$/;
        const match = yearRange.trim().match(regex);

        if (!match) {
            return false;
        }

        let start = Number(match[1]);
        let end = Number(match[2]);

        // Convert 2-digit years to 4-digit years
        if (start < 100) start += 2000;
        if (end < 100) end += 2000;

        return end > start;
    }
    async createActiveYear(data: CreateActiveYearBody) {
        return transaction(async (client) => {
              await validateUserRole({
                action_by: data.created_by,
                role: ["all handle"],
                client: client
            })
            if (this.isValidYearRange(data.year_title) === false) {
                throw new AppError(
                    "Invalid year format. Use formats like '2024-2026'.",
                    400
                );
            }

            const activeYear = await this.service.createActiveYear(data, client);
            return activeYear;
        });
    }

    async fetchActiveYear(data: any) {
        const activeYear_with_code = await this.service.fetchActiveYear(data);

        const activeYears = activeYear_with_code.activeYears.map((row) => ({
            ...row,
            status: getStatusText(row.status),
        }));

        return {
            activeYears,
            pagination: { ...activeYear_with_code.pagination }
        };
    }

    async editActiveYear(data: EditActiveYearBody) {
        return transaction(async (client) => {
            if (data.year_title) {
                if (this.isValidYearRange(data.year_title) === false) {
                    throw new AppError(
                        "Invalid year format. Use formats like '2024-2026'.",
                        400
                    );
                }
            }
            const result = await this.service.updateActiveYear(data, client);
            return result;
        });
    }

    async deleteActiveYear(data: DeleteActiveYearBody) {
        return transaction(async (client) => {
            const { action_by, ...rest } = data;

            const activeYear = await this.service.deleteActiveYear({
                ...rest,
                action_by
            }, client);

            return activeYear;
        });
    }
    async endActiveYear(data: ChangeStatusYear) {
        return transaction(async (client) => {
            await validateUserRole({
                action_by: data.action_by,
                role: ["all handle"],
                client: client
            })
            const activeYear = await this.service.endActiveYear(data.id, client);
            return activeYear;
        });
    }
    async startActiveYear(data: ChangeStatusYear) {
        return transaction(async (client) => {
            await validateUserRole({
                action_by: data.action_by,
                role: ["all handle"],
                client: client
            })
            const activeYear = await this.service.startActiveYear(data.id, client);
            return activeYear;
        });
    }

}