import { PoolClient } from "pg";
import { executeInTransaction, query } from "../../../config/db";
import { AppError } from "../../../utils/AppError";
import {
  CreateSahachariUserBody,
  DeleteSahachariUserBody,
  CountResult,
  FetchSahachariUserParams,
  SahachariUser,
  EditSahachariUserBody
} from "./sahachariUser.types";

export default class SahachariUserService {

  // Create Sahachari User
  async createUser(data: CreateSahachariUserBody, client: PoolClient) {
    const { name, address, identification_name } = data;

    const queryText = `
      INSERT INTO sahachari_users (
        name,
        address,
        identification_name
      )
      VALUES ($1, $2, $3)
      RETURNING *;
    `;

    const values = [
      name,
      address ?? null,
      identification_name
    ];

    const { rows } = await executeInTransaction(client, queryText, values);
    return rows[0];
  }

  // Fetch Sahachari Users with search and pagination
  async fetchUser(data: FetchSahachariUserParams) {
    const { filters, offset } = data;

    const where: string[] = [];
    const values: any[] = [];

    // Search filter across name, address, and identification_name
    if (filters?.search) {
      values.push(`%${filters.search}%`);
      const index = values.length;
      where.push(`(su.name ILIKE $${index} OR su.address ILIKE $${index} OR su.identification_name ILIKE $${index})`);
    }

    // ID filter
    if (filters?.id) {
      values.push(filters.id);
      where.push(`su.id = $${values.length}`);
    }

    const whereClause = where.length ? `WHERE ${where.join(" AND ")}` : "";

    const userQuery = `
      SELECT su.*
      FROM sahachari_users su
      ${whereClause}
      ORDER BY su.id DESC
      LIMIT $${values.length + 1}
      OFFSET $${values.length + 2}
    `;

    const countQuery = `
      SELECT COUNT(*) AS count
      FROM sahachari_users su
      ${whereClause}
    `;

    const users = await query<SahachariUser>(
      userQuery,
      [...values, filters.limit ?? 10, offset]
    );

    const total = await query<CountResult>(countQuery, values);

    return {
      users,
      pagination: {
        page: filters.page ?? 1,
        limit: filters.limit ?? 10,
        total: Number(total[0]?.count || 0),
        totalPages: Math.ceil(Number(total[0]?.count || 0) / (filters.limit ?? 10)),
      },
    };
  }

  // Update Sahachari User
  async updateUser(data: EditSahachariUserBody, client: PoolClient) {
    const { id, name, address, identification_name } = data;

    const checkQuery = `SELECT * FROM sahachari_users WHERE id = $1 LIMIT 1;`;
    const { rows: existingRows } = await executeInTransaction(client, checkQuery, [id]);

    if (existingRows.length === 0) {
      throw new AppError("Sahachari user not found", 404);
    }

    const isExist = existingRows[0];

    const queryText = `
      UPDATE sahachari_users
      SET
        name = $1,
        address = $2,
        identification_name = $3,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $4
      RETURNING *;
    `;

    const values = [
      name ?? isExist.name,
      address !== undefined ? address : isExist.address,
      identification_name ?? isExist.identification_name,
      id
    ];

    const { rows } = await executeInTransaction(client, queryText, values);
    return { data: rows[0] };
  }

  // Delete Sahachari User
  async deleteUser(data: DeleteSahachariUserBody, client: PoolClient) {
    const { r_id } = data;

    const checkQuery = `SELECT * FROM sahachari_users WHERE id = $1 LIMIT 1;`;
    const { rows: existingRows } = await executeInTransaction(client, checkQuery, [r_id]);

    if (existingRows.length === 0) {
      throw new AppError("Sahachari user not found or already deleted", 404);
    }

    const queryText = `
      DELETE FROM sahachari_users
      WHERE id = $1
      RETURNING *;
    `;

    const { rows } = await executeInTransaction(client, queryText, [r_id]);
    return rows[0];
  }
}