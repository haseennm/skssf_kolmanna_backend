import { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import ItemController from "./item.controller";
import {
  CreateItemBody,
  FetchItemBody,
  EditItemBody,
  DeleteItemBody
} from "./item.types";

export async function itemRouter(app: FastifyInstance) {
  const controller = new ItemController();

  // Create Item
  app.post<{ Body: CreateItemBody }>(
    "/create",
    {
      schema: {
        body: {
          type: "object",
          required: ["name", "active_year_id", "action_by"],
          properties: {
            name: { type: "string", minLength: 2, maxLength: 150 },
            note: { type: ["string", "null"] },
            active_year_id: { type: "number" },
            action_by: { type: ["string", "number"] }
          }
        }
      }
    },
    async (request: FastifyRequest<{ Body: CreateItemBody }>, reply: FastifyReply) => {
      const data = await controller.createItem(request.body);
      return reply.code(201).send({
        status: "Success",
        message: data
      });
    }
  );

  // Fetch Items
  app.post<{ Body: FetchItemBody }>(
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
    async (request: FastifyRequest<{ Body: FetchItemBody }>, reply: FastifyReply) => {
      const { page = 1, limit = 10, ...filters } = request.body;

      const data = await controller.fetchItem({
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

  // Edit Item
  app.post<{ Body: EditItemBody }>(
    "/edit",
    {
      schema: {
        body: {
          type: "object",
          required: ["id", "active_year_id", "action_by"],
          properties: {
            id: { type: "number" },
            active_year_id: { type: "number" },
            name: { type: "string", minLength: 2, maxLength: 150 },
            note: { type: ["string", "null"] },
            action_by: { type: ["string", "number"] }
          }
        }
      }
    },
    async (request: FastifyRequest<{ Body: EditItemBody }>, reply: FastifyReply) => {
      const data = await controller.editItem(request.body);
      return reply.code(200).send({
        status: "Success",
        message: data
      });
    }
  );

  // Delete Item
  app.post<{ Body: DeleteItemBody }>(
    "/delete",
    {
      schema: {
        body: {
          type: "object",
          required: ["r_id", "active_year_id", "action_by"],
          properties: {
            r_id: { type: "number" },
            active_year_id: { type: "number" },
            action_by: { type: ["string", "number"] }
          }
        }
      }
    },
    async (request: FastifyRequest<{ Body: DeleteItemBody }>, reply: FastifyReply) => {
      const data = await controller.deleteItem(request.body);
      return reply.code(200).send({
        status: "Success",
        message: data
      });
    }
  );
}