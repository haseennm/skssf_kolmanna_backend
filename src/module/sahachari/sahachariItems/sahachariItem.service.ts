import { PoolClient } from "pg";
import {
  CreateItemBody,
  DeleteItemBody,
  EditItemBody,
  FetchItemParams,
  SahachariItem,
  CountResult
} from "./sahachariItems.types";
import { getStatusCode } from "../../../utils/extra";
import { executeInTransaction, query } from "../../../config/db";
import { AppError } from "../../../utils/AppError";

export default class SahachariItemService {

  // Creates separate rows for each item_code in the array (e.g., ["WC01", "WC02"] -> 2 rows)
  async createItem(data: CreateItemBody, client: PoolClient) {
    const { name, description, item_code, amount } = data;
    const defaultStatus = getStatusCode("Available");
    const createdItems: SahachariItem[] = [];

    const queryText = `
      INSERT INTO sahachari_items (
        name,
        description,
        item_code,
        status,
        amount
      )
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *;
    `;

    for (const code of item_code) {
      const values = [
        name,
        description ?? null,
        code,
        defaultStatus,
        amount ?? null
      ];

      const { rows } = await executeInTransaction(client, queryText, values);
      createdItems.push(rows[0]);
    }

    return createdItems;
  }

  // Fetch items with pagination and search
  async fetchItem(data: FetchItemParams) {
    const { filters, offset } = data;

    const where: string[] = [];
    const values: any[] = [];

    if (filters?.search) {
      values.push(`%${filters.search}%`);
      const index = values.length;
      where.push(`(si.name ILIKE $${index} OR si.description ILIKE $${index} OR si.item_code ILIKE $${index})`);
    }

    if (filters?.id) {
      values.push(filters.id);
      where.push(`si.id = $${values.length}`);
    }

    if (filters?.status !== undefined) {
      values.push(filters.status);
      where.push(`si.status = $${values.length}`);
    }

    const whereClause = where.length ? `WHERE ${where.join(" AND ")}` : "";

    const itemQuery = `
      SELECT
        si.id,
        si.name,
        si.description,
        si.item_code,
        si.status,
        si.amount
      FROM sahachari_items si
      ${whereClause}
      ORDER BY si.id DESC
      LIMIT $${values.length + 1}
      OFFSET $${values.length + 2}
    `;

    const countQuery = `
      SELECT COUNT(*) AS count
      FROM sahachari_items si
      ${whereClause}
    `;

    const items = await query<SahachariItem>(
      itemQuery,
      [...values, filters.limit ?? 10, offset]
    );

    const total = await query<CountResult>(countQuery, values);

    return {
      items,
      pagination: {
        page: filters.page ?? 1,
        limit: filters.limit ?? 10,
        total: Number(total[0]?.count || 0),
        totalPages: Math.ceil(Number(total[0]?.count || 0) / (filters.limit ?? 10)),
      },
    };
  }

  // Update item details
  async updateItem(data: EditItemBody, client: PoolClient) {
    const { id, name, description, item_code, amount, status } = data;

    const checkQuery = `SELECT * FROM sahachari_items WHERE id = $1 LIMIT 1;`;
    const checkResult = await executeInTransaction(client, checkQuery, [id]);

    if (checkResult.rowCount === 0) {
      throw new AppError("Item not found", 404);
    }

    const existingItem = checkResult.rows[0];

    const queryText = `
      UPDATE sahachari_items
      SET
        name = $1,
        description = $2,
        item_code = $3,
        amount = $4,
        status = $5
      WHERE id = $6
      RETURNING *;
    `;

    const values = [
      name ?? existingItem.name,
      description !== undefined ? description : existingItem.description,
      item_code ?? existingItem.item_code,
      amount !== undefined ? amount : existingItem.amount,
      status ?? existingItem.status,
      id
    ];

    const { rows } = await executeInTransaction(client, queryText, values);
    return { data: rows[0] };
  }

  // Delete item record
  async deleteItem(data: DeleteItemBody, client: PoolClient) {
    const { r_id } = data;

    const checkQuery = `SELECT * FROM sahachari_items WHERE id = $1 LIMIT 1;`;
    const checkResult = await executeInTransaction(client, checkQuery, [r_id]);

    if (checkResult.rowCount === 0) {
      throw new AppError("Item not found or already deleted", 404);
    }

    const queryText = `
      DELETE FROM sahachari_items
      WHERE id = $1
      RETURNING *;
    `;

    const { rows } = await executeInTransaction(client, queryText, [r_id]);
    return rows[0];
  }
}