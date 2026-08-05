import { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import LostStockController from "./lostStock.controller";
import {
  CreateLostStockBody,
  FetchLostStockBody,
  EditLostStockBody,
  DeleteLostStockBody
} from "./lostStock.types";

export async function lostStockRouter(app: FastifyInstance) {
  const controller = new LostStockController();

  // Create Lost Stock Record
  app.post<{ Body: CreateLostStockBody }>(
    "/create",
    {
      schema: {
        body: {
          type: "object",
          required: ["stock_id", "quantity", "active_year_id", "action_by"],
          properties: {
            stock_id: { type: "number" },
            quantity: { type: "number" },
            reason: { type: ["string", "null"] },
            active_year_id: { type: "number" },
            action_by: { type: ["string", "number"] }
          }
        }
      }
    },
    async (request: FastifyRequest<{ Body: CreateLostStockBody }>, reply: FastifyReply) => {
      const data = await controller.createLostStock(request.body);
      return reply.code(201).send({
        status: "Success",
        message: data
      });
    }
  );

  // Fetch Lost Stock Records
  app.post<{ Body: FetchLostStockBody }>(
    "/get",
    {
      schema: {
        body: {
          type: "object",
          properties: {
            page: { type: "number", minimum: 1 },
            limit: { type: "number", minimum: 1 },
            id: { type: "number" },
            stock_id: { type: "number" },
            active_year_id: { type: "number" },
            search: { type: ["string", "null"] }
          }
        }
      }
    },
    async (request: FastifyRequest<{ Body: FetchLostStockBody }>, reply: FastifyReply) => {
      const { page = 1, limit = 10, ...filters } = request.body;

      const data = await controller.fetchLostStock({
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

  // Edit Lost Stock Record
  app.post<{ Body: EditLostStockBody }>(
    "/edit",
    {
      schema: {
        body: {
          type: "object",
          required: ["id", "active_year_id", "action_by"],
          properties: {
            id: { type: "number" },
            stock_id: { type: "number" },
            quantity: { type: "number" },
            reason: { type: ["string", "null"] },
            active_year_id: { type: "number" },
            action_by: { type: ["string", "number"] }
          }
        }
      }
    },
    async (request: FastifyRequest<{ Body: EditLostStockBody }>, reply: FastifyReply) => {
      const data = await controller.editLostStock(request.body);
      return reply.code(200).send({
        status: "Success",
        message: data
      });
    }
  );

  // Delete Lost Stock Record
  app.post<{ Body: DeleteLostStockBody }>(
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
    async (request: FastifyRequest<{ Body: DeleteLostStockBody }>, reply: FastifyReply) => {
      const data = await controller.deleteLostStock(request.body);
      return reply.code(200).send({
        status: "Success",
        message: data
      });
    }
  );
}