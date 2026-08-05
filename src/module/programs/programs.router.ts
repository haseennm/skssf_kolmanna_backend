import { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import ProgramController from "./programs.controller";
import {
  CreateProgramBody,
  FetchProgramBody,
  EditProgramBody,
  DeleteProgramBody
} from "./programs.types";

export async function programRouter(app: FastifyInstance) {
  const controller = new ProgramController();

  // Create Program
  app.post<{ Body: CreateProgramBody }>(
    "/create",
    {
      schema: {
        body: {
          type: "object",
          required: ["title", "wing", "date", "active_year_id", "action_by"],
          properties: {
            title: { type: "string", minLength: 2, maxLength: 150 },
            wing: { type: "string", minLength: 1 },
            date: { type: "string" },
            active_year_id: { type: "number" },
            action_by: { type: ["string", "number"] },
          }
        }
      }
    },
    async (request: FastifyRequest<{ Body: CreateProgramBody }>, reply: FastifyReply) => {
      const data = await controller.createProgram(request.body);
      return reply.code(201).send({
        status: "Success",
        message: data
      });
    }
  );

  // Fetch Programs (With pagination & search filters)
  app.post<{ Body: FetchProgramBody }>(
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
            start_date: { type: "string" },
            end_date: { type: "string" },
            search: { type: ["string", "null"] }
          }
        }
      }
    },
    async (request: FastifyRequest<{ Body: FetchProgramBody }>, reply: FastifyReply) => {
      const { page = 1, limit = 10, ...filters } = request.body;

      const data = await controller.fetchProgram({
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

  // Edit Program
  app.post<{ Body: EditProgramBody }>(
    "/edit",
    {
      schema: {
        body: {
          type: "object",
          required: ["id", "active_year_id", "action_by"],
          properties: {
            id: { type: "number" },
            active_year_id: { type: "number" },
            title: { type: "string", minLength: 2, maxLength: 150 },
            wing: { type: "string" },
            date: { type: "string" },
            action_by: { type: ["string", "number"] },
          }
        }
      }
    },
    async (request: FastifyRequest<{ Body: EditProgramBody }>, reply: FastifyReply) => {
      const data = await controller.editProgram(request.body);
      return reply.code(200).send({
        status: "Success",
        message: data
      });
    }
  );

  // Delete Program
  app.post<{ Body: DeleteProgramBody }>(
    "/delete",
    {
      schema: {
        body: {
          type: "object",
          required: ["r_id", "active_year_id", "action_by"],
          properties: {
            r_id: { type: "number" },
            active_year_id: { type: "number" },
            action_by: { type: ["string", "number"] },
          }
        }
      }
    },
    async (request: FastifyRequest<{ Body: DeleteProgramBody }>, reply: FastifyReply) => {
      const data = await controller.deleteProgram(request.body);
      return reply.code(200).send({
        status: "Success",
        message: data
      });
    }
  );
}