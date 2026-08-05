import { PoolClient } from "pg";
import { executeInTransaction, query } from "../../config/db";
import { AppError } from "../../utils/AppError";
import { getRecord } from "../../utils/extra";
import {
  CreateLostStockBody,
  DeleteLostStockBody,
  CountResult,
  FetchLostStockParams,
  FetchDbLostStock,
  EditLostStockBody
} from "./lostStock.types";

export default class LostStockService {

  // Create Lost Stock
  async createLostStock(data: CreateLostStockBody, client: PoolClient) {
    const { stock_id, quantity, reason, active_year_id } = data;

    // Check if the stock entry exists
    const stockCheck = await executeInTransaction(
      client,
      `SELECT id FROM stock WHERE id = $1 LIMIT 1`,
      [stock_id]
    );

    if (stockCheck.rowCount === 0) {
      throw new AppError("Stock entry not found.", 404);
    }
    if(stockCheck.rows[0].quantity <0){
      throw new AppError("Quantity cannot negative",400)
    }

    const queryText = `
      INSERT INTO lost_stock (
        stock_id,
        quantity,
        reason,
        active_year_id
      )
      VALUES ($1, $2, $3, $4)
      RETURNING *;
    `;

    const values = [
      stock_id,
      quantity,
      reason ?? null,
      active_year_id
    ];
    await executeInTransaction(client, `UPDATE stock set quantity = quantity- $1 WHERE id =$2`, [quantity, stock_id])
    const { rows } = await executeInTransaction(client, queryText, values);
    return rows[0];
  }

  // Fetch Paginated Lost Stock
  async fetchLostStock(data: FetchLostStockParams) {
    const { filters, offset } = data;

    let where: string[] = [];
    let values: any[] = [];

    if (filters?.search) {
      values.push(`%${filters.search}%`);
      const index = values.length;
      where.push(`(ls.reason ILIKE $${index} OR i.name ILIKE $${index})`);
    }

    if (filters?.id) {
      values.push(filters.id);
      where.push(`ls.id = $${values.length}`);
    }

    if (filters?.stock_id) {
      values.push(filters.stock_id);
      where.push(`ls.stock_id = $${values.length}`);
    }

    if (filters?.active_year_id) {
      values.push(filters.active_year_id);
      where.push(`ls.active_year_id = $${values.length}`);
    }

    const whereClause = where.length ? `WHERE ${where.join(" AND ")}` : "";

    const lostStockQuery = `
      SELECT 
        ls.id, 
        ls.stock_id, 
        ls.quantity, 
        ls.reason, 
        ls.active_year_id,
        s.item_id,
        i.name as item_name,
        ls.created_at
      FROM lost_stock ls
      LEFT JOIN stock s ON ls.stock_id = s.id
      LEFT JOIN items i ON s.item_id = i.id
      ${whereClause}
      ORDER BY ls.id DESC
      LIMIT $${values.length + 1}
      OFFSET $${values.length + 2}
    `;

    const countQuery = `
      SELECT COUNT(*)
      FROM lost_stock ls
      LEFT JOIN stock s ON ls.stock_id = s.id
      LEFT JOIN items i ON s.item_id = i.id
      ${whereClause}
    `;

    const lostStocks = await query<FetchDbLostStock>(
      lostStockQuery,
      [...values, filters.limit, offset]
    );

    const total = await query<CountResult>(countQuery, values);

    return {
      lost_stocks: lostStocks,
      pagination: {
        page: filters.page,
        limit: filters.limit,
        total: Number(total[0].count),
        totalPages: Math.ceil(Number(total[0].count) / filters.limit),
      },
    };
  }

  // Update Lost Stock Record
  async updateLostStock(data: EditLostStockBody, client: PoolClient) {
    const { id, active_year_id, stock_id, quantity, reason } = data;

    // Validate existence within active_year_id scope using getRecord
    const existingLostStock = await getRecord(id, "lost_stock", active_year_id, client);
    if (!existingLostStock) {
      throw new AppError("Lost stock record not found inside this Active Year scope.", 404);
    }

    const queryText = `
      UPDATE lost_stock
      SET
        stock_id = $1,
        quantity = $2,
        reason = $3
      WHERE id = $4 AND active_year_id = $5
      RETURNING *;
    `;

    const values = [
      stock_id ?? existingLostStock.stock_id,
      quantity ?? existingLostStock.quantity,
      reason !== undefined ? reason : existingLostStock.reason,
      id,
      active_year_id
    ];

    const { rows } = await executeInTransaction(client, queryText, values);
    return { data: rows[0] };
  }

  // Delete Lost Stock Record
  async deleteLostStock(data: DeleteLostStockBody, client: PoolClient) {
    const { r_id, active_year_id } = data;

    const existingLostStock = await getRecord(r_id, "lost_stock", active_year_id, client);
    if (!existingLostStock) {
      throw new AppError("Lost stock record not found or already deleted.", 404);
    }

    const queryText = `
      DELETE FROM lost_stock
      WHERE id = $1 AND active_year_id = $2
      RETURNING *;
    `;
await executeInTransaction(
  client,
  `UPDATE  stock set quantity = quantity+ $1 WHERE id =$2`,
  [existingLostStock.quantity, existingLostStock.stock_id]
);
    const { rows } = await executeInTransaction(client, queryText, [r_id, active_year_id]);
    return rows[0];
  }
}