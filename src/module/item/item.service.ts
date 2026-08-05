import { PoolClient } from "pg";
import { executeInTransaction, query } from "../../config/db";
import { AppError } from "../../utils/AppError";
import { getRecord } from "../../utils/extra";
import {
  CreateItemBody,
  DeleteItemBody,
  CountResult,
  FetchItemParams,
  FetchDbItem,
  EditItemBody
} from "./item.types";

export default class ItemService {

  // Create Item
  async createItem(data: CreateItemBody, client: PoolClient) {
    const { name, note } = data;

    const queryText = `
      INSERT INTO items (
        name,
        note
      )
      VALUES ($1, $2)
      RETURNING *;
    `;
    const values = [
      name,
      note ?? null
    ];

    const { rows } = await executeInTransaction(client, queryText, values);
    return rows[0];
  }

  // Fetch Paginated Items
  async fetchItem(data: FetchItemParams) {
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

    const itemQuery = `
      SELECT *
      FROM items
      ${whereClause}
      ORDER BY id DESC
      LIMIT $${values.length + 1}
      OFFSET $${values.length + 2}
    `;

    const countQuery = `
      SELECT COUNT(*)
      FROM items
      ${whereClause}
    `;

    const items = await query<FetchDbItem>(
      itemQuery,
      [...values, filters.limit, offset]
    );

    const total = await query<CountResult>(countQuery, values);

    return {
      items,
      pagination: {
        page: filters.page,
        limit: filters.limit,
        total: Number(total[0].count),
        totalPages: Math.ceil(Number(total[0].count) / filters.limit),
      },
    };
  }

  // Update Item
  async updateItem(data: EditItemBody, client: PoolClient) {
    const { id, name, note } = data;

    const existingItem = await executeInTransaction(client,
      `SELECT * FROM items WHERE id = $1`,
      [id]
    )

    if (existingItem.rowCount === 0) {
      throw new AppError("Active year record not found", 404);
    }

    const queryText = `
      UPDATE items
      SET
        name = $1,
        note = $2
      WHERE id = $3 
      RETURNING *;
    `;

    const values = [
      name ?? existingItem.rows[0].name,
      note !== undefined ? note : existingItem.rows[0].note,
      id
    ];

    const { rows } = await executeInTransaction(client, queryText, values);
    return { data: rows[0] };
  }

  // Delete Item
  async deleteItem(data: DeleteItemBody, client: PoolClient) {
    const { r_id } = data;

    const existingItem = await executeInTransaction(client,
      `SELECT * FROM items WHERE id = $1`,
      [r_id]
    )

    if (existingItem.rowCount === 0) {
      throw new AppError("Active year record not found", 404);
    }

    const queryText = `
      DELETE FROM items
      WHERE id = $1
      RETURNING *;
    `;

    const { rows } = await executeInTransaction(client, queryText, [r_id]);
    return rows[0];
  }
}