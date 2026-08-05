import { PoolClient } from "pg";
import { executeInTransaction, query, transaction } from "../../config/db";
import { AppError } from "../../utils/AppError";
import { getRecord, getStatusCode } from "../../utils/extra"; // Reusable getRecord helper is imported here[cite: 1, 4]

import {
  CreateProgramBody,
  DeleteProgramBody,
  CountResult,
  FetchProgramParams,
  FetchDbProgram,
  EditProgramBody
} from "./programs.types";

export default class ProgramService {

  // Create standard program record
  async createProgram(data: CreateProgramBody, client: PoolClient) {
    const { title, wing, date, active_year_id } = data;


      const queryText = `
        INSERT INTO program (
          title,
          wing,
          date,
          active_year_id
        )
        VALUES ($1, $2, $3, $4)
        RETURNING *;
      `;

      const values = [title, wing, date, active_year_id];
      const { rows } = await executeInTransaction(client, queryText, values);
      return rows[0];
    };


  // Fetch program records with server-side query filters and pagination
  async fetchProgram(data: FetchProgramParams) {
  const { filters, offset } = data;

  const where: string[] = [];
  const values: any[] = [];

  // Search
  if (filters?.search) {
    values.push(`%${filters.search}%`);
    const index = values.length;
    where.push(`(p.title ILIKE $${index} OR p.wing ILIKE $${index})`);
  }

  // Program ID
  if (filters?.id) {
    values.push(filters.id);
    where.push(`p.id = $${values.length}`);
  }

  // Active Year
  if (filters?.active_year_id) {
    values.push(filters.active_year_id);
    where.push(`p.active_year_id = $${values.length}`);
  }

  // Start date (defaults to active_year.start_date)
  values.push(filters?.start_date ?? null);
  where.push(
    `p.date >= COALESCE($${values.length}::date, ay.start_date)`
  );

  // End date (defaults to CURRENT_DATE)
  values.push(filters?.end_date ?? null);
  where.push(
    `p.date <= COALESCE($${values.length}::date, CURRENT_DATE)`
  );

  const whereClause = where.length
    ? `WHERE ${where.join(" AND ")}`
    : "";

  const programQuery = `
    SELECT
      p.*,
      ay.year_title,
      ay.start_date,
      ay.end_date
    FROM program p
    JOIN active_year ay
      ON ay.id = p.active_year_id
    ${whereClause}
    ORDER BY p.id DESC
    LIMIT $${values.length + 1}
    OFFSET $${values.length + 2}
  `;

  const countQuery = `
    SELECT COUNT(*) AS count
    FROM program p
    JOIN active_year ay
      ON ay.id = p.active_year_id
    ${whereClause}
  `;

  const programs = await query<FetchDbProgram>(
    programQuery,
    [...values, filters.limit, offset]
  );

  const total = await query<CountResult>(countQuery, values);

  return {
    programs,
    pagination: {
      page: filters.page,
      limit: filters.limit,
      total: Number(total[0].count),
      totalPages: Math.ceil(Number(total[0].count) / filters.limit),
    },
  };
}

  // Update logic utilizing reusable 'getRecord' helper[cite: 1, 4]
  async updateProgram(data: EditProgramBody, client: PoolClient) {
    const { id, active_year_id, title, wing, date } = data;


      // Reusable helper verifies if the record exists within the scope[cite: 1]
      const isProgramExist = await getRecord(id, "program", active_year_id, client);

      if (!isProgramExist) {
        throw new AppError("Program record not found within this Active Year context", 404);
      }

      const queryText = `
        UPDATE program
        SET
          title = $1,
          wing = $2,
          date = $3
        WHERE id = $4 AND active_year_id = $5
        RETURNING *;
      `;

      const values = [
        title ?? isProgramExist.title,
        wing ?? isProgramExist.wing,
        date ?? isProgramExist.date,
        id,
        active_year_id
      ];

      const { rows } = await executeInTransaction(client, queryText, values);
      return { data: rows[0] };
    };


  // Delete logic utilizing reusable 'getRecord' helper[cite: 1, 4]
  async deleteProgram(data: DeleteProgramBody, client: PoolClient) {
    const { r_id, active_year_id } = data;
 

      // Reusable helper verifies if the record exists within the scope[cite: 1]
      const isProgramExist = await getRecord(r_id, "program", active_year_id, client);

      if (!isProgramExist) {
        throw new AppError("Program record not found or already deleted", 404);
      }

      const queryText = `
        DELETE FROM program
        WHERE id = $1 AND active_year_id = $2
        RETURNING *;
      `;

      const values = [r_id, active_year_id];
      const { rows } = await executeInTransaction(client, queryText, values);
      return rows[0];
    };
}