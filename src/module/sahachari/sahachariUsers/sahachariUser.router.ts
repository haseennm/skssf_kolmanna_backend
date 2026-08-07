import { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import SahachariUserController from "./sahachariUser.controller";
import {
  CreateSahachariUserBody,
  FetchSahachariUserBody,
  EditSahachariUserBody,
  DeleteSahachariUserBody
} from "./sahachariUser.types";

export async function sahachariUserRouter(app: FastifyInstance) {
  const controller = new SahachariUserController();

  // Create User
  app.post<{ Body: CreateSahachariUserBody }>(
    "/create",
    {
      schema: {
        body: {
          type: "object",
          required: ["identification_name", "name","action_by"],
          properties: {
            name: { type: "string", minLength: 1 },
            address: { type: ["string", "null"] },
            identification_name: { type: "string", minLength: 1 },
            action_by: { type: ["string", "number"] }
          }
        }
      }
    },
    async (request: FastifyRequest<{ Body: CreateSahachariUserBody }>, reply: FastifyReply) => {
      const data = await controller.createUser(request.body);
      return reply.code(201).send({
        status: "Success",
        message: data
      });
    }
  );

  // Fetch Users
  app.post<{ Body: FetchSahachariUserBody }>(
    "/get",
    {
      schema: {
        body: {
          type: "object",
          properties: {
            page: { type: "number", minimum: 1 },
            limit: { type: "number", minimum: 1 },
            id: { type: "number" },
            search: { type: ["string", "null"] }
          }
        }
      }
    },
    async (request: FastifyRequest<{ Body: FetchSahachariUserBody }>, reply: FastifyReply) => {
      const { page = 1, limit = 10, ...filters } = request.body || {};

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
  app.post<{ Body: EditSahachariUserBody }>(
    "/edit",
    {
      schema: {
        body: {
          type: "object",
          required: ["id", "action_by"],
          properties: {
            id: { type: "number" },
            name: { type: "string", minLength: 1 },
            address: { type: ["string", "null"] },
            identification_name: { type: "string", minLength: 1 },
            action_by: { type: ["string", "number"] }
          }
        }
      }
    },
    async (request: FastifyRequest<{ Body: EditSahachariUserBody }>, reply: FastifyReply) => {
      const data = await controller.editUser(request.body);
      return reply.code(200).send({
        status: "Success",
        message: data
      });
    }
  );

  // Delete User
  app.post<{ Body: DeleteSahachariUserBody }>(
    "/delete",
    {
      schema: {
        body: {
          type: "object",
          required: ["r_id", "action_by"],
          properties: {
            r_id: { type: "number" },
            action_by: { type: ["string", "number"] }
          }
        }
      }
    },
    async (request: FastifyRequest<{ Body: DeleteSahachariUserBody }>, reply: FastifyReply) => {
      const data = await controller.deleteUser(request.body);
      return reply.code(200).send({
        status: "Success",
        message: data
      });
    }
  );
}