import { PoolClient } from "pg";
import { executeInTransaction, query, transaction } from "../../config/db";
import { AppError } from "../../utils/AppError";
import { getRecord, getStatusCode } from "../../utils/extra";

import {
  CreateActiveYearBody,
  DeleteActiveYearBody,
  CountResult,
  FetchActiveYearParams,
  FetchDbActiveYear,
  EditActiveYearBody
} from "./activeYear.types";

export default class ActiveYearService {
  private async ensureNoOpenActiveYear(client: PoolClient): Promise<void> {
    const result = await executeInTransaction(
      client,
      `SELECT id, year_title
     FROM active_year
     WHERE status = $1
     LIMIT 1`,
      [getStatusCode("Open")]
    );

    const openYear = result.rows[0];

    if (openYear) {
      throw new AppError(
        `An active year is already open (${openYear.year_title}). Please close it before creating a new active year.`,
        400
      );
    }
  }
  async createActiveYear(data: CreateActiveYearBody, client: PoolClient) {
    const {
      year_title, status
    } = data;
    const queryText = `
        INSERT INTO active_year (
          year_title,
          status
        )
        VALUES ($1,$2)
        RETURNING *;
      `;
    if (status == "Open")await this.ensureNoOpenActiveYear(client)
    const values = [
      year_title, getStatusCode(status || "Soon")
    ];

    const { rows } = await executeInTransaction(client, queryText, values);
    return rows[0];
  }

  async fetchActiveYear(data: FetchActiveYearParams) {
    const { filters, offset } = data;

    let where: string[] = [];
    let values: any[] = [];

    if (filters?.search) {
      values.push(`%${filters.search}%`);
      const index = values.length;
      where.push(`
        (
          year_title ILIKE $${index}
        )
      `);
    }

    if (filters?.id) {
      values.push(filters.id);
      where.push(`id = $${values.length}`);
    }
    const whereClause = where.length ? `WHERE ${where.join(" AND ")}` : "";

    const activeYearQuery = `
      SELECT *
      FROM active_year
      ${whereClause}
      ORDER BY id DESC
      LIMIT $${values.length + 1}
      OFFSET $${values.length + 2}
    `;

    const countQuery = `
      SELECT COUNT(*)
      FROM active_year
      ${whereClause}
    `;

    const activeYears = await query<FetchDbActiveYear>(
      activeYearQuery,
      [...values, filters.limit, offset]
    );

    const total = await query<CountResult>(countQuery, values);

    return {
      activeYears,
      pagination: {
        page: filters.page,
        limit: filters.limit,
        total: Number(total[0].count),
        totalPages: Math.ceil(Number(total[0].count) / filters.limit),
      },
    };
  }

  async updateActiveYear(data: EditActiveYearBody, client: PoolClient) {
    const {
      id,
      year_title,
      end_date,
      start_date
    } = data;

    const isActiveYearExist = await executeInTransaction(client,
      `SELECT * FROM active_year WHERE id = $1`,
      [id]
    )

    if (isActiveYearExist.rowCount === 0) {
      throw new AppError("Active year record not found", 404);
    }

    const queryText = `
        UPDATE active_year
        SET
          year_title = $1,
          start_date = $3
          end_date = $4
        WHERE id = $5
        RETURNING *;
      `;

    const values = [
      year_title ?? isActiveYearExist.rows[0].year_title, start_date, end_date,
      id
    ];

    const { rows } = await executeInTransaction(client, queryText, values);
    const updatedActiveYear = rows[0];
    return { data: updatedActiveYear };
  };
  async endActiveYear(id: number, client: PoolClient) {

    const isActiveYearExist = await executeInTransaction(client,
      `SELECT * FROM active_year WHERE id = $1`,
      [id]
    )

    if (isActiveYearExist.rowCount === 0) {
      throw new AppError("Active year record not found", 404);
    }

    const queryText = `
        UPDATE active_year
        SET
          end_date = $1,
          status = $2
        WHERE id = $3
        RETURNING *;
      `;

    const values = [
      new Date().toISOString().split('T')[0],
      getStatusCode("Close"),
      id
    ];

    const { rows } = await executeInTransaction(client, queryText, values);
    const updatedActiveYear = rows[0];
    return { data: updatedActiveYear };
  };

  async startActiveYear(id: number, client: PoolClient) {

    await this.ensureNoOpenActiveYear(client)
    const isActiveYearExist = await executeInTransaction(client,
      `SELECT * FROM active_year WHERE id = $1 `,
      [id]
    )

    if (isActiveYearExist.rowCount === 0) {
      throw new AppError("Active year record not found", 404);
    }

    const queryText = `
        UPDATE active_year
        SET
          start_date = $1 ,
          status =$2
        WHERE id = $3
        RETURNING *;
      `;

    const values = [
      new Date().toISOString().split('T')[0],
      getStatusCode("Open"),
      id
    ];

    const { rows } = await executeInTransaction(client, queryText, values);
    const updatedActiveYear = rows[0];
    return { data: updatedActiveYear };
  };

  async deleteActiveYear(data: DeleteActiveYearBody, client: PoolClient) {
    const { r_id } = data;

    const isActiveYearExist = await executeInTransaction(client,
      `SELECT * FROM active_year WHERE id = $1`,
      [r_id]
    )

    if (!isActiveYearExist) {
      throw new AppError("Active year record not found or already deleted", 404);
    }

    const queryText = `
        DELETE FROM active_year
        WHERE id = $1
        RETURNING *;
      `;

    const values = [
      r_id
    ];

    const { rows } = await executeInTransaction(client, queryText, values);
    return rows[0];
  };

}