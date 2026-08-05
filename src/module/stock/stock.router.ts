import { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import StockController from "./stock.controller";
import {
  CreateStockBody,
  FetchStockBody,
  EditStockBody,
  DeleteStockBody
} from "./stock.types";

export async function stockRouter(app: FastifyInstance) {
  const controller = new StockController();

  // Create Stock Entry
  app.post<{ Body: CreateStockBody }>(
    "/create",
    {
      schema: {
        body: {
          type: "object",
          required: ["item_id", "quantity", "active_year_id", "action_by"],
          properties: {
            item_id: { type: "number" },
            quantity: { type: "number" },
            note: { type: ["string", "null"] },
            active_year_id: { type: "number" },
            action_by: { type: ["string", "number"] }
          }
        }
      }
    },
    async (request: FastifyRequest<{ Body: CreateStockBody }>, reply: FastifyReply) => {
      const data = await controller.createStock(request.body);
      return reply.code(201).send({
        status: "Success",
        message: data
      });
    }
  );

  // Fetch Stock Entries
  app.post<{ Body: FetchStockBody }>(
    "/get",
    {
      schema: {
        body: {
          type: "object",
          properties: {
            page: { type: "number", minimum: 1 },
            limit: { type: "number", minimum: 1 },
            id: { type: "number" },
            item_id: { type: "number" },
            search: { type: ["string", "null"] }
          }
        }
      }
    },
    async (request: FastifyRequest<{ Body: FetchStockBody }>, reply: FastifyReply) => {
      const { page = 1, limit = 10, ...filters } = request.body;

      const data = await controller.fetchStock({
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

  // Edit Stock Entry
  app.post<{ Body: EditStockBody }>(
    "/edit",
    {
      schema: {
        body: {
          type: "object",
          required: ["id", "active_year_id", "action_by"],
          properties: {
            id: { type: "number" },
            item_id: { type: "number" },
            quantity: { type: "number" },
            note: { type: ["string", "null"] },
            active_year_id: { type: "number" },
            action_by: { type: ["string", "number"] }
          }
        }
      }
    },
    async (request: FastifyRequest<{ Body: EditStockBody }>, reply: FastifyReply) => {
      const data = await controller.editStock(request.body);
      return reply.code(200).send({
        status: "Success",
        message: data
      });
    }
  );

  // Delete Stock Entry
  app.post<{ Body: DeleteStockBody }>(
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
    async (request: FastifyRequest<{ Body: DeleteStockBody }>, reply: FastifyReply) => {
      const data = await controller.deleteStock(request.body);
      return reply.code(200).send({
        status: "Success",
        message: data
      });
    }
  );
}