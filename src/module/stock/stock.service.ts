import { PoolClient } from "pg";
import { executeInTransaction, query } from "../../config/db";
import { AppError } from "../../utils/AppError";
import {
  CreateStockBody,
  DeleteStockBody,
  CountResult,
  FetchStockParams,
  FetchDbStock,
  EditStockBody
} from "./stock.types";

export default class StockService {

  // Create Stock Entry
  async createStock(data: CreateStockBody, client: PoolClient) {
    const { item_id, quantity, note } = data;

    // Check if the item exists
    const itemCheck = await executeInTransaction(
      client,
      `SELECT id FROM items WHERE id = $1 LIMIT 1`,
      [item_id]
    );

    if (itemCheck.rowCount === 0) {
      throw new AppError("Item not found.", 404);
    }

    const queryText = `
      INSERT INTO stock (
        item_id,
        quantity,
        note
      )
      VALUES ($1, $2, $3)
      RETURNING *;
    `;

    const values = [
      item_id,
      quantity,
      note ?? null
    ];

    const { rows } = await executeInTransaction(client, queryText, values);
    return rows[0];
  }

  // Fetch Paginated Stock Entries
  async fetchStock(data: FetchStockParams) {
    const { filters, offset } = data;

    let where: string[] = [];
    let values: any[] = [];

    if (filters?.search) {
      values.push(`%${filters.search}%`);
      const index = values.length;
      where.push(`(i.name ILIKE $${index} OR s.note ILIKE $${index})`);
    }

    if (filters?.id) {
      values.push(filters.id);
      where.push(`s.id = $${values.length}`);
    }

    if (filters?.item_id) {
      values.push(filters.item_id);
      where.push(`s.item_id = $${values.length}`);
    }

    const whereClause = where.length ? `WHERE ${where.join(" AND ")}` : "";

    const stockQuery = `
      SELECT s.id, s.item_id, i.name as item_name, s.quantity, s.note, s.created_at
      FROM stock s
      JOIN items i ON s.item_id = i.id
      ${whereClause}
      ORDER BY s.id DESC
      LIMIT $${values.length + 1}
      OFFSET $${values.length + 2}
    `;

    const countQuery = `
      SELECT COUNT(*)
      FROM stock s
      JOIN items i ON s.item_id = i.id
      ${whereClause}
    `;

    const stocks = await query<FetchDbStock>(
      stockQuery,
      [...values, filters.limit, offset]
    );

    const total = await query<CountResult>(countQuery, values);

    return {
      stocks,
      pagination: {
        page: filters.page,
        limit: filters.limit,
        total: Number(total[0].count),
        totalPages: Math.ceil(Number(total[0].count) / filters.limit),
      },
    };
  }

  // Update Stock Entry
  async updateStock(data: EditStockBody, client: PoolClient) {
    const { id, item_id, quantity, note } = data;

    // Check existing record directly by ID (no active_year_id in stock table)
    const existingResult = await executeInTransaction(
      client,
      `SELECT * FROM stock WHERE id = $1 LIMIT 1`,
      [id]
    );

    if (existingResult.rowCount === 0) {
      throw new AppError("Stock record not found.", 404);
    }

    const existingStock = existingResult.rows[0];

    const queryText = `
      UPDATE stock
      SET
        item_id = $1,
        quantity = $2,
        note = $3,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $4
      RETURNING *;
    `;

    const values = [
      item_id ?? existingStock.item_id,
      quantity ?? existingStock.quantity,
      note !== undefined ? note : existingStock.note,
      id
    ];

    const { rows } = await executeInTransaction(client, queryText, values);
    return { data: rows[0] };
  }

  // Delete Stock Entry
  async deleteStock(data: DeleteStockBody, client: PoolClient) {
    const { r_id } = data;

    const existingResult = await executeInTransaction(
      client,
      `SELECT * FROM stock WHERE id = $1 LIMIT 1`,
      [r_id]
    );

    if (existingResult.rowCount === 0) {
      throw new AppError("Stock record not found or already deleted.", 404);
    }

    const queryText = `
      DELETE FROM stock
      WHERE id = $1
      RETURNING *;
    `;

    const { rows } = await executeInTransaction(client, queryText, [r_id]);
    return rows[0];
  }
}