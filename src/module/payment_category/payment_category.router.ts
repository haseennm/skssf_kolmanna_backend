import { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import PaymentCategoryController from "./payment_category.controller";
import {
  CreatePaymentCategoryBody,
  FetchPaymentCategoryBody,
  EditPaymentCategoryBody,
  DeletePaymentCategoryBody
} from "./payment_category.types";

export async function paymentCategoryRouter(app: FastifyInstance) {
  const controller = new PaymentCategoryController();

  // Create Payment Category
  app.post<{ Body: CreatePaymentCategoryBody }>(
    "/create",
    {
      schema: {
        body: {
          type: "object",
          required: ["name", "action_by","active_year_id"],
          properties: {
            name: { type: "string", minLength: 2, maxLength: 150 },
            active_year_id: { type: "number" },
            note: { type: ["string", "null"] },
            action_by: { type: ["string", "number"] },
          }
        }
      }
    },
    async (request: FastifyRequest<{ Body: CreatePaymentCategoryBody }>, reply: FastifyReply) => {
      const data = await controller.createPaymentCategory(request.body);
      return reply.code(201).send({
        status: "Success",
        message: data
      });
    }
  );

  // Fetch Payment Categories with pagination & optional search
  app.post<{ Body: FetchPaymentCategoryBody }>(
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
    async (request: FastifyRequest<{ Body: FetchPaymentCategoryBody }>, reply: FastifyReply) => {
      const { page = 1, limit = 10, ...filters } = request.body;

      const data = await controller.fetchPaymentCategory({
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

  // Edit Payment Category
  app.post<{ Body: EditPaymentCategoryBody }>(
    "/edit",
    {
      schema: {
        body: {
          type: "object",
          required: ["id", "action_by","active_year_id"],
          properties: {
            active_year_id: { type: "number" },
            id: { type: "number" },
            name: { type: "string", minLength: 2, maxLength: 150 },
            note: { type: ["string", "null"] },
            action_by: { type: ["string", "number"] },
          }
        }
      }
    },
    async (request: FastifyRequest<{ Body: EditPaymentCategoryBody }>, reply: FastifyReply) => {
      const data = await controller.editPaymentCategory(request.body);
      return reply.code(200).send({
        status: "Success",
        message: data
      });
    }
  );

  // Delete Payment Category
  app.post<{ Body: DeletePaymentCategoryBody }>(
    "/delete",
    {
      schema: {
        body: {
          type: "object",
          required: ["r_id", "action_by","active_year_id"],
          properties: {
            active_year_id: { type: "number" },
            r_id: { type: "number" },
            action_by: { type: ["string", "number"] },
          }
        }
      }
    },
    async (request: FastifyRequest<{ Body: DeletePaymentCategoryBody }>, reply: FastifyReply) => {
      const data = await controller.deletePaymentCategory(request.body);
      return reply.code(200).send({
        status: "Success",
        message: data
      });
    }
  );
}