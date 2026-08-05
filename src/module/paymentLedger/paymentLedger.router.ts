import { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import PaymentLedgerController from "./paymentLedger.controller";
import {
  CreatePaymentLedgerBody,
  FetchPaymentLedgerBody,
  EditPaymentLedgerBody,
  DeletePaymentLedgerBody
} from "./paymentLedger.types";

export async function paymentLedgerRouter(app: FastifyInstance) {
  const controller = new PaymentLedgerController();

  // Create Ledger Record
  app.post<{ Body: CreatePaymentLedgerBody }>(
    "/create",
    {
      schema: {
        body: {
          type: "object",
          required: [
            "total_amount",
            "paid_amount",
            "date",
            "payment_overview",
            "payment_flow",
            "discount",
            "action_by",
            "active_year_id"
          ],
          properties: {
            program_id: { type: ["number", "null"] },
            total_amount: { type: "number", minimum: 0 },
            paid_amount: { type: "number", minimum: 0 },
            note: { type: ["string", "null"] },
            date: { type: "string" },
            payment_flow: { type: "string", enum: ["In", "Out"] },
            discount: { type: "number" },
            active_year_id: { type: "number" },
            action_by: { type: ["string", "number"] },
            payment_overview: {
              type: "array",
              minItems: 1,
              items: {
                type: "object",
                required: ["amount", "payment_category_id", "note"],
                properties: {
                  amount: { type: "number", minimum: 0 },
                  payment_category_id: { type: "number" },
                  note: { type: "string" }
                }
              }
            }
          }
        }
      }
    },
    async (request: FastifyRequest<{ Body: CreatePaymentLedgerBody }>, reply: FastifyReply) => {
      const data = await controller.createLedger(request.body);
      return reply.code(201).send({
        status: "Success",
        message: data
      });
    }
  );

  // Fetch Paginated Ledgers
  app.post<{ Body: FetchPaymentLedgerBody }>(
    "/get",
    {
      schema: {
        body: {
          type: "object",
          properties: {
            page: { type: "number", minimum: 1 },
            limit: { type: "number", minimum: 1 },
            id: { type: "number" },
            program_id: { type: ["number", "null"] },
            active_year_id: { type: "number" },
            payment_flow: { type: "string", enum: ["In", "Out"] },
            search: { type: ["string", "null"] },
            start_date: { type: "string" },
            end_date: { type: "string" },
          }
        }
      }
    },
    async (request: FastifyRequest<{ Body: FetchPaymentLedgerBody }>, reply: FastifyReply) => {
      const { page = 1, limit = 10, ...filters } = request.body;

      const data = await controller.fetchLedger({
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

  // Edit Ledger Record
  app.post<{ Body: EditPaymentLedgerBody }>(
    "/edit",
    {
      schema: {
        body: {
          type: "object",
          required: ["id", "active_year_id","action_by"],
          properties: {
            id: { type: "number" },
            active_year_id: { type: "number" },
            program_id: { type: ["number", "null"] },
            total_amount: { type: "number", minimum: 0 },
            paid_amount: { type: "number", minimum: 0 },
            note: { type: ["string", "null"] },
            date: { type: "string" },
            payment_flow: { type: "string", enum: ["In", "Out"] },
            status: { type: "string" },
            action_by: { type: ["string", "number"] },
            payment_overview: {
              type: "array",
              items: {
                type: "object",
                required: ["amount", "payment_category_id", "note"],
                properties: {
                  amount: { type: "number", minimum: 0 },
                  payment_category_id: { type: "number" },
                  note: { type: "string" }
                }
              }
            }
          }
        }
      }
    },
    async (request: FastifyRequest<{ Body: EditPaymentLedgerBody }>, reply: FastifyReply) => {
      const data = await controller.editLedger(request.body);
      return reply.code(200).send({
        status: "Success",
        message: data
      });
    }
  );

  // Delete Ledger Record
  app.post<{ Body: DeletePaymentLedgerBody }>(
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
    async (request: FastifyRequest<{ Body: DeletePaymentLedgerBody }>, reply: FastifyReply) => {
      const data = await controller.deleteLedger(request.body);
      return reply.code(200).send({
        status: "Success",
        message: data
      });
    }
  );
}