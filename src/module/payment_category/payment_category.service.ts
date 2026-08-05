import { PoolClient } from "pg";
import { executeInTransaction, query, transaction } from "../../config/db";
import { AppError } from "../../utils/AppError";

import {
  CreatePaymentCategoryBody,
  DeletePaymentCategoryBody,
  CountResult,
  FetchPaymentCategoryParams,
  FetchDbPaymentCategory,
  EditPaymentCategoryBody
} from "./payment_category.types";

export default class PaymentCategoryService {

  // Create payment category
  async createPaymentCategory(data: CreatePaymentCategoryBody, client?: PoolClient) {
    const { name, note } = data;

    const runCreate = async (txClient: any) => {
      const queryText = `
        INSERT INTO payment_category (
          name,
          note
        )
        VALUES ($1, $2)
        RETURNING *;
      `;

      const values = [name, note ?? null];
      const { rows } = await executeInTransaction(txClient, queryText, values);
      return rows[0];
    };

    if (client) return runCreate(client);
    return transaction(runCreate);
  }

  // Read (with paginated filter support)
  async fetchPaymentCategory(data: FetchPaymentCategoryParams) {
    const { filters, offset } = data;

    let where: string[] = [];
    let values: any[] = [];

    if (filters?.search) {
      values.push(`%${filters.search}%`);
      const index = values.length;
      where.push(`(name ILIKE $${index} OR note ILIKE $${index})`);
    }

    if (filters?.id) {
      values.push(filters.id);
      where.push(`id = $${values.length}`);
    }

    const whereClause = where.length ? `WHERE ${where.join(" AND ")}` : "";

    const categoryQuery = `
      SELECT *
      FROM payment_category
      ${whereClause}
      ORDER BY name ASC
      LIMIT $${values.length + 1}
      OFFSET $${values.length + 2}
    `;

    const countQuery = `
      SELECT COUNT(*)
      FROM payment_category
      ${whereClause}
    `;

    const categories = await query<FetchDbPaymentCategory>(
      categoryQuery,
      [...values, filters.limit, offset]
    );

    const total = await query<CountResult>(countQuery, values);

    return {
      categories,
      pagination: {
        page: filters.page,
        limit: filters.limit,
        total: Number(total[0].count),
        totalPages: Math.ceil(Number(total[0].count) / filters.limit),
      },
    };
  }

  // Update payment category
  async updatePaymentCategory(data: EditPaymentCategoryBody, client?: any) {
    const { id, name, note } = data;

    const runUpdate = async (txClient: any) => {
      // Validate category existence
      const isExist = await executeInTransaction(txClient,
        `SELECT * FROM payment_category WHERE id = $1`,
        [id]
      );

      if (isExist.rowCount === 0) {
        throw new AppError("Payment category not found", 404);
      }

      const queryText = `
        UPDATE payment_category
        SET
          name = $1,
          note = $2
        WHERE id = $3
        RETURNING *;
      `;

      const values = [
        name ?? isExist.rows[0].name,
        note !== undefined ? note : isExist.rows[0].note,
        id
      ];

      const { rows } = await executeInTransaction(txClient, queryText, values);
      return { data: rows[0] };
    };

    if (client) return runUpdate(client);
    return transaction(runUpdate);
  }

  // Delete payment category
  async deletePaymentCategory(data: DeletePaymentCategoryBody, client?: any) {
    const { r_id } = data;

    const runDelete = async (txClient: any) => {
      // Validate category existence
      const isExist = await executeInTransaction(txClient,
        `SELECT * FROM payment_category WHERE id = $1`,
        [r_id]
      );

      if (isExist.rowCount === 0) {
        throw new AppError("Payment category not found or already deleted", 404);
      }

      const queryText = `
        DELETE FROM payment_category
        WHERE id = $1
        RETURNING *;
      `;

      const { rows } = await executeInTransaction(txClient, queryText, [r_id]);
      return rows[0];
    };

    if (client) return runDelete(client);
    return transaction(runDelete);
  }
}