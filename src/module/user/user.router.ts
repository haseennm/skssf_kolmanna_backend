import { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import UserController from "./user.controller";
import {
  CreateUserBody,
  FetchUserBody,
  EditUserBody,
  DeleteUserBody,
  LoginBody,
  MovetoCurrentActiveYear
} from "./user.types";

export async function userRouter(app: FastifyInstance) {
  const controller = new UserController();

  // Create User
  app.post<{ Body: CreateUserBody }>(
    "/create",
    {
      schema: {
        body: {
          type: "object",
          required: ["name", "username", "email", "password", "role", "active_year_id","action_by"],
          properties: {
            name: { type: "string", minLength: 2, maxLength: 100 },
            address: { type: ["string", "null"] },
            username: { type: "string", minLength: 3, maxLength: 50 },
            email: { type: "string", format: "email" },
            action_by: { type: ["string", "number"] },
            phone_number: { type: ["string", "null"] },
            password: { type: "string", minLength: 6 },
            active_year_id: { type: "number" },
            role: {
              type: "array",
              minItems: 1,
              items: {
                type: "string",
                enum: ["ledger handle", "program handle", "stock handle", "all handle"]
              }
            }
          }
        }
      }
    },
    async (request: FastifyRequest<{ Body: CreateUserBody }>, reply: FastifyReply) => {
      const data = await controller.createUser(request.body);
      return reply.code(201).send({
        status: "Success",
        message: data
      });
    }
  );

  // Fetch Users
  app.post<{ Body: FetchUserBody }>(
    "/get",
    {
      schema: {
        body: {
          type: "object",
          properties: {
            page: { type: "number", minimum: 1 },
            limit: { type: "number", minimum: 1 },
            id: { type: "number" },
            active_year_id: { type: "number" },
            search: { type: ["string", "null"] }
          }
        }
      }
    },
    async (request: FastifyRequest<{ Body: FetchUserBody }>, reply: FastifyReply) => {
      const { page = 1, limit = 10, ...filters } = request.body;

      const data = await controller.fetchUser({
        offset: (page - 1) * limit,
        filters: {
          ...filters,
          page,
          limit
        }
      });

      return reply.code(200).send(data);
    }
  );

  // Edit User
  app.post<{ Body: EditUserBody }>(
    "/edit",
    {
      schema: {
        body: {
          type: "object",
          required: ["id", "active_year_id","action_by"],
          properties: {
            id: { type: "number" },
            active_year_id: { type: "number" },
            name: { type: "string", minLength: 2 },
            address: { type: ["string", "null"] },
            username: { type: "string", minLength: 3 },
            email: { type: "string", format: "email" },
            phone_number: { type: ["string", "null"] },
            password: { type: "string", minLength: 6 },
            action_by: { type: ["string", "number"] },
            role: {
              type: "array",
              items: {
                type: "string",
                enum: ["ledger handle", "program handle", "stock handle", "all handle"]
              }
            }
          }
        }
      }
    },
    async (request: FastifyRequest<{ Body: EditUserBody }>, reply: FastifyReply) => {
      const data = await controller.editUser(request.body);
      return reply.code(200).send({
        status: "Success",
        message: data
      });
    }
  );

  app.post<{ Body: DeleteUserBody }>(
    "/delete",
    {
      schema: {
        body: {
          type: "object",
          required: ["r_id", "active_year_id","action_by"],
          properties: {
            r_id: { type: "number" },
            active_year_id: { type: "number" },
            action_by: { type: ["string", "number"] },
          }
        }
      }
    },
    async (request: FastifyRequest<{ Body: DeleteUserBody }>, reply: FastifyReply) => {
      const data = await controller.deleteUser(request.body);
      return reply.code(200).send({
        status: "Success",
        message: data
      });
    }
  );

  app.post<{ Body: LoginBody }>(
    "/login",
    {
      schema: {
        body: {
          type: "object",
          required: ["password"],
          anyOf: [
            { required: ["username"] },
            { required: ["email"] }
          ],
          properties: {
            username: { type: "string" },
            email: { type: "string" },
            password: { type: "string" }
          }
        }
      }
    },
    async (request: FastifyRequest<{ Body: LoginBody }>, reply: FastifyReply) => {
      const controller = new UserController();
      const result = await controller.login(request.body);
      return reply.code(200).send({
        status: "Success",
        ...result
      });
    }
  );
  app.post<{ Body: MovetoCurrentActiveYear }>(
    "/move/current/commitee",
    {
      schema: {
        body: {
          type: "object",
          required: ["user_id","action_by"],
          properties: {
            user_id: { type: "number" },
            action_by: { type: "number" }
          }
        }
      }
    },
    async (request: FastifyRequest<{ Body: MovetoCurrentActiveYear }>, reply: FastifyReply) => {
      const controller = new UserController();
      const result = await controller.movetoCurrentYear(request.body);
      return reply.code(200).send({
        status: "Success",
        ...result
      });
    }
  );
}