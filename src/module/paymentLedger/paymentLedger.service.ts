import { PoolClient } from "pg";
import { executeInTransaction, query } from "../../config/db";
import { AppError } from "../../utils/AppError";
import { getRecord, getStatusCode } from "../../utils/extra"; // Using your reusable helper hooks[cite: 1, 4]

import {
  CreatePaymentLedgerBody,
  DeletePaymentLedgerBody,
  CountResult,
  FetchPaymentLedgerParams,
  FetchDbPaymentLedger,
  EditPaymentLedgerBody
} from "./paymentLedger.types";

export default class PaymentLedgerService {
  private billStatus(final_amount: number, paid_amount: number) {
    if (paid_amount <= 0) {
      return getStatusCode("Unpaid");
    }
    if (paid_amount == final_amount) {
      return getStatusCode("Paid");
    }
    if (paid_amount > final_amount) {
      return getStatusCode("Over Pay");
    }
    return getStatusCode("Partial");
  }
  // Generates reference numbers dynamically (e.g., VOU-01, REC-12) based on past counts in the DB
  private async generateReferenceNumber(payment_flow: "In" | "Out", client: PoolClient): Promise<string> {
    const prefix = payment_flow === "Out" ? "VOU" : "REC";

    // Query past count of records matching the designated flow type
    const countQuery = `
      SELECT COUNT(*) as count 
      FROM payment_ledger 
      WHERE payment_flow = $1;
    `;
    const result = await executeInTransaction(client, countQuery, [payment_flow]);
    const nextNumber = parseInt(result.rows[0].count, 10) + 1;

    // Zero-pad numbers less than 10 (e.g., "01", "02")
    return `${prefix}-${String(nextNumber).padStart(2, "0")}`;
  }

  // Create Ledger Entry
  async createLedger(data: CreatePaymentLedgerBody, client: PoolClient) {
    const {
      program_id,
      total_amount,
      paid_amount,
      note,
      date,
      payment_overview,
      payment_flow,
      active_year_id,
      discount
    } = data;

    // 2. Validate linked Program ID (if provided)
    if (program_id) {
      const programExists = await getRecord(program_id, "program", active_year_id, client);
      if (!programExists) {
        throw new AppError("Referenced program was not found inside this Active Year", 404);
      }
    }

    // 3. Generate sequential reference number (VOU-XX or REC-XX)
    const reference_number = await this.generateReferenceNumber(payment_flow, client);
    for (const payment_category of payment_overview) {
      const is_payment_cat = await executeInTransaction(client,
        `SELECT * FROM payment_category WHERE id = $1`,
        [payment_category.payment_category_id]
      )
      if (is_payment_cat.rowCount === 0) {
        throw new AppError("Referenced payment category was not found inside this Active Year", 404);

      }
    }
    const queryText = `
        INSERT INTO payment_ledger (
          program_id,
          total_amount,
          paid_amount,
          note,
          date,
          payment_overview,
          payment_flow,
          status,
          reference_number,
          active_year_id,
          discount,
          sub_total
        )
        VALUES ($1, $2, $3, $4, $5, $6::jsonb, $7, $8, $9, $10,$11,$12)
        RETURNING *;
      `;

    const values = [
      program_id ?? null,
      total_amount,
      paid_amount,
      note ?? null,
      date,
      JSON.stringify(payment_overview), // Stringify payload safely to JSONB
      payment_flow,
      this.billStatus(total_amount, paid_amount),
      reference_number,
      active_year_id,
      discount,
      total_amount - discount
    ];

    const { rows } = await executeInTransaction(client, queryText, values);
    return rows[0];
  };

  // Fetch paginated ledger items with filters
  async fetchLedger(data: FetchPaymentLedgerParams) {
    const { filters, offset } = data;

    let where: string[] = [];
    let values: any[] = [];

    // --- 1. Resolve Start & End Date Defaults ---
    let startDate = filters?.start_date;
    let endDate = filters?.end_date || new Date().toISOString().split("T")[0]; // Defaults to current date (YYYY-MM-DD)

    // Fetch the start_date directly from the active_year table column if not provided in the payload
    if (!startDate && filters?.active_year_id) {
      const activeYearResult = await query<{ start_date: Date | string }>(
        `SELECT start_date FROM active_year WHERE id = $1`,
        [filters.active_year_id]
      );

      if (activeYearResult && activeYearResult.length > 0 && activeYearResult[0].start_date) {
        const rawStartDate = activeYearResult[0].start_date;

        // Convert the date safely to standard YYYY-MM-DD string format
        startDate = rawStartDate instanceof Date
          ? rawStartDate.toISOString().split("T")[0]
          : new Date(rawStartDate).toISOString().split("T")[0];
      }
    }

    // --- 2. Build Query Filters ---
    if (filters?.search) {
      values.push(`%${filters.search}%`);
      const index = values.length;
      where.push(`(payment_ledger.note ILIKE $${index} OR reference_number ILIKE $${index})`);
    }

    if (filters?.id) {
      values.push(filters.id);
      where.push(`payment_ledger.id = $${values.length}`);
    }

    if (filters?.program_id !== undefined) {
      values.push(filters.program_id);
      where.push(`payment_ledger.program_id = $${values.length}`);
    }

    if (filters.active_year_id) {
      values.push(filters.active_year_id);
      where.push(`payment_ledger.active_year_id = $${values.length}`);
    }

    if (filters?.payment_flow) {
      values.push(filters.payment_flow);
      where.push(`payment_ledger.payment_flow = $${values.length}`);
    }

    // Apply Date Range Filters if resolved
    if (startDate) {
      values.push(startDate);
      where.push(`payment_ledger.date >= $${values.length}`);
    }
    if (endDate) {
      values.push(endDate);
      where.push(`payment_ledger.date <= $${values.length}`);
    }
    const activeYear = await query<{
      start_date: Date;
      end_date: Date;
    }>(
      `
  SELECT start_date, end_date
  FROM active_year
  WHERE id = $1
  `,
      [filters.active_year_id]
    );

    let activeYearSummary = null;

    if (activeYear.length > 0) {
      const { start_date, end_date } = activeYear[0];

      const summary = await query<{
        income: string;
        expense: string;
      }>(
        `
   SELECT
    COALESCE(
        SUM(CASE WHEN payment_flow = 'In' THEN paid_amount ELSE 0 END),
        0
    ) AS income,
    COALESCE(
        SUM(CASE WHEN payment_flow = 'Out' THEN paid_amount ELSE 0 END),
        0
    ) AS expense
FROM payment_ledger
WHERE date BETWEEN $1 AND $2;
    `,
        [start_date, end_date]
      );

      activeYearSummary = {
        start_date,
        end_date,
        income: Number(summary[0].income),
        expense: Number(summary[0].expense),
      };
    }
    const whereClause = where.length ? `WHERE ${where.join(" AND ")}` : "";

    // --- 3. Execute Ledger Queries ---
    const ledgerQuery = `
  SELECT
    payment_ledger.*,
    program.title AS program_name,
    program.wing AS program_wing
  FROM payment_ledger
  LEFT JOIN program
    ON payment_ledger.program_id = program.id
  ${whereClause}
  ORDER BY payment_ledger.id DESC
  LIMIT $${values.length + 1}
  OFFSET $${values.length + 2}
`;

    const countQuery = `
      SELECT COUNT(*)
      FROM payment_ledger
      ${whereClause}
    `;

    const ledgers = await query<FetchDbPaymentLedger>(
      ledgerQuery,
      [...values, filters.limit || 50, offset]
    );

    const total = await query<CountResult>(countQuery, values);

    // --- 4. Map Payment Category Names into payment_overview ---
    const categories = await query<{ id: number; name: string }>(
      `SELECT id, name FROM payment_category`
    );

    const categoryMap = categories.reduce((map, cat) => {
      map[cat.id] = cat.name;
      return map;
    }, {} as Record<number, string>);

    // Parse and enrich payment_overview items with category names
    const enrichedLedgers = ledgers.map((ledger) => {
      let overview: any[] = [];

      if (typeof ledger.payment_overview === "string") {
        try {
          overview = JSON.parse(ledger.payment_overview);
        } catch {
          overview = [];
        }
      } else if (Array.isArray(ledger.payment_overview)) {
        overview = ledger.payment_overview;
      }

      const updatedOverview = overview.map((item: any) => ({
        ...item,
        payment_category_name: categoryMap[item.payment_category_id] || "Unknown Category"
      }));

      return {
        ...ledger,
        payment_overview: updatedOverview
      };
    });

    return {
      active_year: activeYearSummary,
      ledgers: enrichedLedgers,
      pagination: {
        page: filters.page,
        limit: filters.limit || 50,
        total: Number(total[0].count),
        totalPages: Math.ceil(Number(total[0].count) / (filters.limit || 50)),
      },
    };
  }

  // Update Ledger
  async updateLedger(data: EditPaymentLedgerBody, client: PoolClient) {
    const {
      id,
      active_year_id,
      program_id,
      total_amount,
      paid_amount,
      note,
      date,
      payment_overview,
      payment_flow,
      discount
    } = data;

    // 1. Fetch exact record to guarantee context ownership
    const existingRecord = await getRecord(id, "payment_ledger", active_year_id, client);
    if (!existingRecord) {
      throw new AppError("Ledger record not found within this Active Year context", 404);
    }
    if (program_id) {
      const existing_program_record = await getRecord(program_id, "program", active_year_id, client);
      if (!existing_program_record) {
        throw new AppError("Ledger record not found within this Active Year context", 404);
      }
    }

    // 3. Verify target program reference context if updated
    if (program_id) {
      const programExists = await getRecord(program_id, "program", active_year_id, client);
      if (!programExists) {
        throw new AppError("Referenced program was not found within this Active Year context", 404);
      }
    }

    // 4. Regenerate reference sequential code if payment flow switched direction
    let reference_number = existingRecord.reference_number;
    if (payment_flow && payment_flow !== existingRecord.payment_flow) {
      reference_number = await this.generateReferenceNumber(payment_flow, client);
    }

    const queryText = `
        UPDATE payment_ledger
        SET
          program_id = $1,
          total_amount = $2,
          paid_amount = $3,
          note = $4,
          date = $5,
          payment_overview = $6::jsonb,
          payment_flow = $7,
          status = $8,
          reference_number = $9,
          discount =$10
          sub_total =$11
        WHERE id = $12 AND active_year_id = $13
        RETURNING *;
      `;
    const final_total_amount = total_amount ?? existingRecord.total_amount
    const final_discount = discount ?? existingRecord.discount

    const values = [
      program_id !== undefined ? program_id : existingRecord.program_id,
      total_amount ?? existingRecord.total_amount,
      paid_amount ?? existingRecord.paid_amount,
      note !== undefined ? note : existingRecord.note,
      date ?? existingRecord.date,
      payment_overview ? JSON.stringify(payment_overview) : JSON.stringify(existingRecord.payment_overview),
      payment_flow ?? existingRecord.payment_flow,
      this.billStatus(total_amount || existingRecord.total_amount, paid_amount || existingRecord.paid_amount), ,
      reference_number,
      discount ?? existingRecord.discount,
      final_total_amount - final_discount,
      id,
      active_year_id
    ];

    const { rows } = await executeInTransaction(client, queryText, values);
    return { data: rows[0] };
  };


  // Delete Ledger
  async deleteLedger(data: DeletePaymentLedgerBody, client: PoolClient) {
    const { r_id, active_year_id } = data;

    // Fetch record to check for presence before execution
    const existingRecord = await getRecord(r_id, "payment_ledger", active_year_id, client);
    if (!existingRecord) {
      throw new AppError("Ledger record not found or already deleted", 404);
    }

    const queryText = `
        DELETE FROM payment_ledger
        WHERE id = $1 AND active_year_id = $2
        RETURNING *;
      `;

    const { rows } = await executeInTransaction(client, queryText, [r_id, active_year_id]);
    return rows[0];
  };

}