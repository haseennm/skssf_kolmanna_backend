import { PoolClient } from "pg"
import { executeInTransaction, pool, query } from "../config/db"
import { AppError } from "./AppError"

export const cns = (url: string, values: string | object) => {
  console.log(
    `\x1b[43m\x1b[30m ${url} \x1b[0m`,
    `\x1b[32m${JSON.stringify(values)}\x1b[0m`
  )
}
export const el = (errr: any) => {
  console.log(`\x1b[41m${errr}\x1b[0m`
  )
}

export const STATUS_MAP = {
  
  1: 'Open',
  2: 'Close',
  3: 'Unpaid',
  4: 'Partial',
  5: 'Paid',
  6: 'Good',
  7: 'Damaged',
  8: 'Miss',
  9: 'Soon',
} as const
export const STATUS_REVERSE_MAP = Object.fromEntries(
  Object.entries(STATUS_MAP).map(([key, value]) => [
    value.toLowerCase(),
    Number(key)
  ])
)
export function getStatusCode(status: string): number {
  const code = STATUS_REVERSE_MAP[status.toLowerCase()]
  if (code === undefined) {
    throw new Error(`Invalid status: ${status}`)
  }
  return code
}

export function getStatusText(code: number): string {
  return STATUS_MAP[code as keyof typeof STATUS_MAP] ?? 'Unknown'
}

export async function getRecord(id: number | string, table: string,  active_year_id: number | string, client: PoolClient) {
  console.log([id, table, active_year_id])
  const isrowExist = await executeInTransaction(client,
    `SELECT * FROM ${table} WHERE id = $1 AND active_year_id = $2`,
    [id, active_year_id]
  )
  return isrowExist.rows[0] || null;
}
// export async function validateDateInActiveYear(
//   inputDate: string | Date,
//   active_year_id: number | string,
//   client: PoolClient
// ): Promise<void> {
  
//   // 1. Fetch the active year record
//   const activeYearResult = await executeInTransaction(
//     client,
//     `SELECT * FROM active_year WHERE id = $1`,
//     [active_year_id]
//   );

//   const activeYear = activeYearResult.rows[0];

//   if (!activeYear) {
//     throw new AppError("Active year record not found.", 404);
//   }

//   // 2. Ensure the active year status is explicitly "Open"
//   if (activeYear.status !== getStatusCode("Open")) {
//     throw new AppError("The selected active year is closed or inactive.", 400);
//   }

//   // 3. Extract the start and end years from year_title (e.g., "2026-2028")
//   const yearTitle: string = activeYear.year_title; 
//   const yearParts = yearTitle.split("-");

//   if (yearParts.length !== 2) {
//     throw new AppError("Invalid active year range format in database. Expected 'YYYY-YYYY'.", 500);
//   }

//   const startYear = parseInt(yearParts[0].trim(), 10);
//   const endYear = parseInt(yearParts[1].trim(), 10);

//   // 4. Safely extract the year from the input date
//   let inputYear: number;
  
//   if (typeof inputDate === "string") {
//     const parsedDate = new Date(inputDate);
//     inputYear = parsedDate.getFullYear();

//     // Fallback regex cleanup if JS engine struggles parsing custom formats like "10/10/2026"
//     if (isNaN(inputYear)) {
//       const yearMatch = inputDate.match(/\b\d{4}\b/);
//       if (yearMatch) {
//         inputYear = parseInt(yearMatch[0], 10);
//       }
//     }
//   } else {
//     inputYear = inputDate.getFullYear();
//   }

//   if (isNaN(inputYear)) {
//     throw new AppError("Provided application date format is invalid.", 400);
//   }

//   // 5. Enforce boundaries check
//   if (inputYear < startYear || inputYear > endYear) {
//     throw new AppError(
//       `The date provided does not fall within the active year period (${yearTitle}).`,
//       400
//     );
//   }
  
//   // Validation passed successfully; program execution continues smoothly.
// }

export const ROLE_MAP: Record<string, number> = {
  "ledger handle": 1,
  "program handle": 2,
  "stock handle": 3,
  "all handle": 4,
  "user handle": 5
};

export const REVERSE_ROLE_MAP: Record<number, string> = {
  1: "ledger handle",
  2: "program handle",
  3: "stock handle",
  4: "all handle",
  5: "user handle"
};

export function mapRolesToNumbers(roles: string[]): number[] {
  return roles
    .map((role) => ROLE_MAP[role.toLowerCase().trim()])
    .filter((num): num is number => num !== undefined);
}

export function mapNumbersToRoles(nums: number[]): string[] {
  return nums
    .map((num) => REVERSE_ROLE_MAP[num])
    .filter((role): role is string => role !== undefined);
}