import { PoolClient } from "pg";
import { executeInTransaction, query, transaction } from "../../config/db";
import { AppError } from "../../utils/AppError";
import {
  getRecord,
  getStatusCode,
  mapRolesToNumbers,
  mapNumbersToRoles,
} from "../../utils/extra";
import { hashPassword, verifyPassword, generateToken } from "../../utils/auth.util";
import {
  CreateUserBody,
  DeleteUserBody,
  CountResult,
  FetchUserParams,
  FetchDbUser,
  EditUserBody,
  LoginBody,
  MovetoCurrentActiveYear
} from "./user.types";

export default class UserService {

  // Create User
  async createUser(data: CreateUserBody, client: PoolClient) {
    const { name, address, username, email, phone_number, password, role, active_year_id } = data;

    // Unique checks for Email and Username
    const isUnique = await executeInTransaction(client,
      `SELECT id FROM "user" WHERE email = $1 OR username = $2`,
      [email, username]
    );

    if (isUnique.rowCount && isUnique.rowCount > 0) {
      throw new AppError("Username or Email already registered.", 400);
    }

    // Hash plain-text password using the utility hook
    const hashedPassword = await hashPassword(password);

    // Convert role string array (e.g., ["ledger handle"]) to numbers array (e.g., [1])
    const numericRoles = mapRolesToNumbers(role);

    const queryText = `
        INSERT INTO "user" (
          name,
          address,
          username,
          email,
          phone_number,
          password,
          role,
          active_year_id
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7::int[], $8)
        RETURNING id, name, address, username, email, phone_number, role, active_year_id;
      `;

    const values = [
      name,
      address ?? null,
      username,
      email,
      phone_number ?? null,
      hashedPassword,
      numericRoles,
      active_year_id
    ];

    const { rows } = await executeInTransaction(client, queryText, values);

    // Map roles back to string representation before returning payload
    const createdUser = rows[0];
    return {
      ...createdUser,
      role: mapNumbersToRoles(createdUser.role)
    };
  };


  // Fetch paginated list of users
  async fetchUser(data: FetchUserParams) {
    const { filters, offset } = data;

    let where: string[] = [];
    let values: any[] = [];

    if (filters?.search) {
      values.push(`%${filters.search}%`);
      const index = values.length;
      where.push(`(name ILIKE $${index} OR username ILIKE $${index} OR email ILIKE $${index})`);
    }

    if (filters?.id) {
      values.push(filters.id);
      where.push(`id = $${values.length}`);
    }

    if (filters?.active_year_id) {
      values.push(filters.active_year_id);
      where.push(`active_year_id = $${values.length}`);
    }

    const whereClause = where.length ? `WHERE ${where.join(" AND ")}` : "";

    const userQuery = `
      SELECT id, name, address, email, phone_number, role, active_year_id
      FROM "user"
      ${whereClause}
      ORDER BY name ASC
      LIMIT $${values.length + 1}
      OFFSET $${values.length + 2}
    `;

    const countQuery = `
      SELECT COUNT(*)
      FROM "user"
      ${whereClause}
    `;

    const rawUsers = await query<FetchDbUser>(
      userQuery,
      [...values, filters.limit, offset]
    );

    const total = await query<CountResult>(countQuery, values);

    // Map all raw numeric array roles back to their human-readable string formats
    const formattedUsers = rawUsers.map((user) => ({
      ...user,
      role: mapNumbersToRoles(user.role)
    }));

    return {
      users: formattedUsers,
      pagination: {
        page: filters.page,
        limit: filters.limit,
        total: Number(total[0].count),
        totalPages: Math.ceil(Number(total[0].count) / filters.limit),
      },
    };
  }

  // Update User profile
  async updateUser(data: EditUserBody, client: any) {
    const { id, active_year_id, name, address, username, email, phone_number, password, role } = data;

    // Validate user existence
    const existingUser = await getRecord(id, '"user"', active_year_id, client);
    if (!existingUser) {
      throw new AppError("User not found inside this Active Year scope.", 404);
    }

    // Hash password if updating it
    let finalPassword = existingUser.password;
    if (password) {
      finalPassword = await hashPassword(password);
    }

    // Handle role string array mapping
    let finalRoles = existingUser.role;
    if (role) {
      finalRoles = mapRolesToNumbers(role);
    }

    const queryText = `
        UPDATE "user"
        SET
          name = $1,
          address = $2,
          username = $3,
          email = $4,
          phone_number = $5,
          password = $6,
          role = $7::int[]
        WHERE id = $8 AND active_year_id = $9
        RETURNING id, name, address, username, email, phone_number, role, active_year_id;
      `;

    const values = [
      name ?? existingUser.name,
      address !== undefined ? address : existingUser.address,
      username ?? existingUser.username,
      email ?? existingUser.email,
      phone_number !== undefined ? phone_number : existingUser.phone_number,
      finalPassword,
      finalRoles,
      id,
      active_year_id
    ];

    const { rows } = await executeInTransaction(client, queryText, values);
    const updatedUser = rows[0];

    return {
      data: {
        ...updatedUser,
        role: mapNumbersToRoles(updatedUser.role)
      }
    };
  };


  // Delete User record
  async deleteUser(data: DeleteUserBody, client: any) {
    const { r_id, active_year_id } = data;
    const existingUser = await getRecord(r_id, "user", active_year_id, client);
    if (!existingUser) {
      throw new AppError("User not found or already deleted.", 404);
    }

    const queryText = `
        DELETE FROM "user"
        WHERE id = $1 AND active_year_id = $2
        RETURNING id, name, username, email;
      `;

    const { rows } = await executeInTransaction(client, queryText, [r_id, active_year_id]);
    return rows[0];
  };

  // Authenticate user & issue session JWT Token
  async login(data: LoginBody) {
    const { username, email, password } = data;

    // Search user by email or username
    const userResult = await query<any>(
      `SELECT * FROM "user" WHERE username = $1 OR email = $2`,
      [username || null, email || null]
    );

    const user = userResult[0];

    if (!user) {
      throw new AppError("Invalid login credentials provided.", 401);
    }

    // Verify Password match using auth utility
    const isValidPassword = await verifyPassword(password, user.password);
    if (!isValidPassword) {
      throw new AppError("Invalid password.", 401);
    }

    // Generate token with payload containing id and username
    const token = generateToken({
      id: String(user.id),
      username: user.username
    });

    return {
      token,
      user: {
        id: user.id,
        name: user.name,
        username: user.username,
        email: user.email,
        role: mapNumbersToRoles(user.role),
        active_year_id: user.active_year_id
      }
    };
  }
  async movetoCurrentYear(data: MovetoCurrentActiveYear, client: PoolClient) {
    const { user_id } = data;

    // Search user by email or username
    const active_year_Result = await query<any>(
      `SELECT * FROM "active_year" WHERE status = $1 `,
      [getStatusCode("Open")]
    );

    const active_year = active_year_Result[0];
    const userResult = await query<any>(
      `SELECT * FROM "user" WHERE id = $1 `,
      [user_id]
    );

    const user = userResult[0];

    if (!user) {
      throw new AppError("User not found.", 401);
    }

    const queryText = `
        UPDATE FROM "user" SET active_year_id = $1
        WHERE id = $1 
        RETURNING id, name, username, email;
      `;

    const { rows } = await executeInTransaction(client, queryText, [active_year.id, user_id]);
    return rows[0];
  }
}