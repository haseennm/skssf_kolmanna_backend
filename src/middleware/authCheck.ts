import { PoolClient } from "pg";
import { executeInTransaction, query } from "../config/db";
import { AppError } from "../utils/AppError";
import { getStatusCode, mapRolesToNumbers } from "../utils/extra";

export interface CheckRoleData {
  active_year_id: number;
  action_by: number | string;
  role: string | string[]; // Accepts "ledger handle" or ["ledger handle", "program handle"]
}

export async function validateActiveYearAndRole({
  action_by,
  active_year_id,
  role,
  inputDate,
  client,
}: {
  action_by: number | string;
  active_year_id?: number | string;
  role: string | string[];
  inputDate?: string | Date;
  client?: PoolClient;
}): Promise<void> {
  if (!active_year_id) {
    throw new AppError("Active year is required.", 400);
  }

  if (!action_by) {
    throw new AppError("Action by user is required.", 400);
  }

  if (!role) {
    throw new AppError("Required role is required.", 400);
  }
  console.log(`active_year_id = ${active_year_id} and action_by ${action_by} and role = ${role}`)
  // Fetch active year
  let activeYear: {
    id: number;
    status: number;
    year_title: string;
  };

  if (client) {
    const result = await executeInTransaction(
      client,
      `SELECT id, status, year_title
       FROM active_year
       WHERE id = $1`,
      [active_year_id]
    );

    activeYear = result.rows[0];
  } else {
    const result = await query<{
      id: number;
      status: number;
      year_title: string;
    }>(
      `SELECT id, status, year_title
       FROM active_year
       WHERE id = $1
       LIMIT 1`,
      [active_year_id]
    );

    activeYear = result[0];
  }

  if (!activeYear) {
    throw new AppError("Active year is invalid.", 404);
  }

  if (activeYear.status !== getStatusCode("Open")) {
    throw new AppError(
      "The selected active year is closed or inactive.",
      400
    );
  }

  // Validate date (optional)
  if (inputDate) {
    const [start, end] = activeYear.year_title.split("-");

    if (!start || !end) {
      throw new AppError(
        "Invalid active year range format in database.",
        500
      );
    }

    const startYear = Number(start.trim());
    const endYear = Number(end.trim());

    let inputYear: number;

    if (typeof inputDate === "string") {
      const parsed = new Date(inputDate);
      inputYear = parsed.getFullYear();

      if (isNaN(inputYear)) {
        const match = inputDate.match(/\b\d{4}\b/);
        if (match) {
          inputYear = Number(match[0]);
        }
      }
    } else {
      inputYear = inputDate.getFullYear();
    }

    if (isNaN(inputYear)) {
      throw new AppError("Provided application date is invalid.", 400);
    }

    if (inputYear < startYear || inputYear > endYear) {
      throw new AppError(
        `The date provided does not fall within the active year period (${activeYear.year_title}).`,
        400
      );
    }
  }

  // Fetch user
  const users = await query<{ id: number; role: number[] }>(
    `SELECT id, role
     FROM "user"
     WHERE id = $1
       AND active_year_id = $2
     LIMIT 1`,
    [action_by, active_year_id]
  );

  if (users.length === 0) {
    throw new AppError("User not found in this active year.", 404);
  }

  const user = users[0];

  const requiredRoles = Array.isArray(role) ? role : [role];
  const requiredRoleIds = mapRolesToNumbers(requiredRoles);

  const hasRole = requiredRoleIds.some((roleId) =>
    user.role.includes(roleId)
  );

  if (!hasRole) {
    throw new AppError(
      "User does not have permission to perform this action.",
      403
    );
  }
}
export async function validateUserRole({
  action_by,
  role,
  client,
}: {
  action_by: number | string;
  role: string | string[];
  client?: PoolClient;
}): Promise<void> {
  if (!action_by) {
    throw new AppError("Action by user is required.", 400);
  }

  if (!role) {
    throw new AppError("Required role is required.", 400);
  }

  let user: {
    id: number;
    role: number[];
  };

  if (client) {
    const result = await executeInTransaction(
      client,
      `SELECT id, role
       FROM "user"
       WHERE id = $1
       LIMIT 1`,
      [action_by]
    );

    user = result.rows[0];
  } else {
    const result = await query<{
      id: number;
      role: number[];
    }>(
      `SELECT id, role
       FROM "user"
       WHERE id = $1
       LIMIT 1`,
      [action_by]
    );

    user = result[0];
  }

  if (!user) {
    throw new AppError("User not found.", 404);
  }

  const requiredRoles = Array.isArray(role) ? role : [role];
  const requiredRoleIds = mapRolesToNumbers(requiredRoles);
console.log(requiredRoleIds)
  const hasRole = requiredRoleIds.some((roleId) =>
    user.role.includes(roleId)
  );

  if (!hasRole) {
    throw new AppError(
      "User does not have permission to perform this action.",
      403
    );
  }
}