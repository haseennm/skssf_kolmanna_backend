import { PoolClient } from "pg";
import { executeInTransaction, query } from "../../../config/db";
import { AppError } from "../../../utils/AppError";
import { getRecord, getStatusCode } from "../../../utils/extra";

import {
    CreateSahachariBody,
    ReturnSahachariBody,
    CountResult,
    FetchSahachariParams,
    FetchDbSahachari
} from "./sahachari.types";

export default class SahachariService {
    private async validateUser(userId: number) {
        const res = await query('SELECT id FROM sahachari_users WHERE id = $1', [userId]);
        return res;
    }

    // Validate if item exists
    private async validateItem(itemId: number) {
        const res = await query('SELECT id FROM sahachari_items WHERE id = $1', [itemId]);
        return res;
    }
    private async sahachariItemStatusChange(itemId: number, status: string, client: PoolClient) {
        console.log(status, "item", itemId)
        const queryText = `
      UPDATE sahachari_items
      SET
        status = $1
      WHERE id = $2
    `;

        const values = [
            getStatusCode(status),
            itemId
        ];

        const { rows } = await executeInTransaction(client, queryText, values);
        return rows[0];
    }
    private async validateIssue(issueId: number, client: PoolClient) {
        const res = await executeInTransaction(client, 'SELECT id, item_id,issue_date FROM sahachari_issues WHERE id = $1', [issueId]);
        return res;
    }
    // Create issue record with item and user validation
    async createIssue(data: CreateSahachariBody, client: PoolClient) {
        const { user_id, item_id, issue_date, action_by } = data;

        // Validate User exists
        const userExist = await this.validateUser(user_id);
        if (!userExist) {
            throw new AppError("Target user record not found within this Active Year context", 404);
        }

        // Validate Item exists
        const itemExist = await this.validateItem(item_id);
        if (!itemExist) {
            throw new AppError("Target item record not found within this Active Year context", 404);
        }

        // Check if item is already currently issued
        const checkActiveQuery = `
      SELECT id FROM sahachari_items 
      WHERE id = $1 AND status = $2
    `;
        const activeIssue = await executeInTransaction(client, checkActiveQuery, [item_id, getStatusCode("Issued")]);
        if (activeIssue.rows.length > 0) {
            throw new AppError("This item is currently issued and has not been returned yet", 400);
        }

        const queryText = `
      INSERT INTO sahachari_issues (
        user_id,
        item_id,
        issue_date,
        issued_by,
        status
      )
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *;
    `;

        const values = [user_id, item_id, issue_date, action_by, getStatusCode("Issued")];
        const { rows } = await executeInTransaction(client, queryText, values);
        await this.sahachariItemStatusChange(item_id, "Issued", client)
        return rows[0];
    }

    // Process return of issued item
    async returnIssue(data: ReturnSahachariBody, client: PoolClient) {
        const { id, return_date, action_by } = data;

        // Verify issue record exists
        const isIssueExistRes = await this.validateIssue(id, client);
        const isIssueExist = isIssueExistRes.rows[0]
        if (!isIssueExist) {
            throw new AppError("Sahachari issue record not found", 404);
        }

        if (isIssueExist.status === getStatusCode("Returned")) {
            throw new AppError("This item has already been marked as returned", 400);
        }
        const issueDate = new Date(isIssueExist.issue_date);
        const returnDateObj = new Date(return_date);

        // Check if the return date is valid
        if (isNaN(returnDateObj.getTime())) {
            throw new AppError("Invalid return date.", 400);
        }

        // Return date cannot be before issue date
        if (returnDateObj < issueDate) {
            throw new AppError(
                "Return date cannot be earlier than the issue date.",
                400
            );
        }
        const queryText = `
      UPDATE sahachari_issues
      SET
        return_date = $1,
        return_by = $2,
        status = $3
      WHERE id = $4 
      RETURNING *;
    `;

        const values = [return_date, action_by, getStatusCode("Returned"), id];
        const { rows } = await executeInTransaction(client, queryText, values);
        console.log(isIssueExist)
        await this.sahachariItemStatusChange(isIssueExist.item_id, "Available", client)
        return rows[0];
    }

    // Fetch issue records with filters, search by user/item name, and pagination
    async fetchIssues(data: FetchSahachariParams) {
        const { filters, offset } = data;

        const where: string[] = [];
        const values: any[] = [];

        // Search by User Name or Item Name
        if (filters?.search) {
            values.push(`%${filters.search}%`);
            const index = values.length;
            where.push(`(u.name ILIKE $${index} OR i.name ILIKE $${index})`);
        }

        // Specific Record ID
        if (filters?.id) {
            values.push(filters.id);
            where.push(`s.id = $${values.length}`);
        }

        // Filter by User ID
        if (filters?.user_id) {
            values.push(filters.user_id);
            where.push(`s.user_id = $${values.length}`);
        }

        // Filter by Item ID
        if (filters?.item_id) {
            values.push(filters.item_id);
            where.push(`s.item_id = $${values.length}`);
        }

        // Status & Overdue Filters
        const issuedStatus = getStatusCode("Issued");
        const returnedStatus = getStatusCode("Returned");

        if (filters?.filter) {
            if (filters.filter === "issued") {
                where.push(`s.status = ${issuedStatus}`);
            } else if (filters.filter === "returned") {
                where.push(`s.status = ${returnedStatus}`);
            } else if (filters.filter === "overdue_3_months") {
                where.push(
                    `s.status = ${issuedStatus} AND s.issue_date <= (CURRENT_DATE - INTERVAL '3 months')`
                );
            }
        }

        // Custom Date Range
        if (filters?.start_date) {
            values.push(filters.start_date);
            where.push(`s.issue_date >= $${values.length}::date`);
        }

        if (filters?.end_date) {
            values.push(filters.end_date);
            where.push(`s.issue_date <= $${values.length}::date`);
        }

        const whereClause = where.length ? `WHERE ${where.join(" AND ")}` : "";

        const dataQuery = `
      SELECT
        s.*,
        u.name AS user_name,
        i.name AS item_name,
        ib.name AS issued_by_name,
        rb.name AS return_by_name
      FROM sahachari_issues s
      JOIN sahachari_users u ON u.id = s.user_id
      JOIN sahachari_items i ON i.id = s.item_id
      JOIN "user" ib ON ib.id = s.issued_by
      LEFT JOIN "user" rb ON rb.id = s.return_by
      ${whereClause}
      ORDER BY s.id DESC
      LIMIT $${values.length + 1}
      OFFSET $${values.length + 2}
    `;

        const countQuery = `
      SELECT COUNT(*) AS count
      FROM sahachari_issues s
      JOIN sahachari_users u ON u.id = s.user_id
      JOIN sahachari_items i ON i.id = s.item_id
      ${whereClause}
    `;

        const issues = await query<FetchDbSahachari>(dataQuery, [
            ...values,
            filters.limit,
            offset
        ]);

        const total = await query<CountResult>(countQuery, values);

        return {
            issues,
            pagination: {
                page: filters.page,
                limit: filters.limit,
                total: Number(total[0].count),
                totalPages: Math.ceil(Number(total[0].count) / filters.limit)
            }
        };
    }
}