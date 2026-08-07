import { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import SahachariItemController from "./sahachariItem.controller";
import {
  CreateItemBody,
  DeleteItemBody,
  EditItemBody,
  FetchItemBody
} from "./sahachariItems.types";

export async function sahachariItemRouter(app: FastifyInstance) {
  const controller = new SahachariItemController();

  // Create Sahachari Item(s)
  app.post<{ Body: CreateItemBody }>(
    "/create",
    {
      schema: {
        body: {
          type: "object",
          required: ["name", "item_code","action_by"],
          properties: {
            name: { type: "string", minLength: 1 },
            description: { type: ["string", "null"] },
            item_code: {
              type: "array",
              minItems: 1,
              items: { type: "string" }
            },
            amount: { type: ["number", "null"] },
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

  // Fetch Sahachari Items
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
            search: { type: ["string", "null"] },
            status: { type: "number" }
          }
        }
      }
    },
    async (request: FastifyRequest<{ Body: FetchItemBody }>, reply: FastifyReply) => {
      const { page = 1, limit = 10, ...filters } = request.body || {};

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

  // Edit Sahachari Item
  app.post<{ Body: EditItemBody }>(
    "/edit",
    {
      schema: {
        body: {
          type: "object",
          required: ["id", "action_by"],
          properties: {
            id: { type: "number" },
            name: { type: "string" },
            description: { type: ["string", "null"] },
            item_code: { type: "string" },
            amount: { type: ["number", "null"] },
            status: { type: "number" },
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

  // Delete Sahachari Item
  app.post<{ Body: DeleteItemBody }>(
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
    async (request: FastifyRequest<{ Body: DeleteItemBody }>, reply: FastifyReply) => {
      const data = await controller.deleteItem(request.body);
      return reply.code(200).send({
        status: "Success",
        message: data
      });
    }
  );
}