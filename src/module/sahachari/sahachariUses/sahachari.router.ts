import { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import SahachariController from "./sahachari.controller";
import {
    CreateSahachariBody,
    ReturnSahachariBody,
    FetchSahachariBody
} from "./sahachari.types";

export async function sahachariIssuesRouter(app: FastifyInstance) {
    const controller = new SahachariController();

    // Create Issue
    app.post<{ Body: CreateSahachariBody }>(
        "/create",
        {
            schema: {
                body: {
                    type: "object",
                    required: ["user_id", "item_id", "issue_date", "action_by"],
                    properties: {
                        user_id: { type: "number" },
                        item_id: { type: "number" },
                        issue_date: { type: "string" },
                        action_by: { type: ["string", "number"] }
                    }
                }
            }
        },
        async (request: FastifyRequest<{ Body: CreateSahachariBody }>, reply: FastifyReply) => {
            const data = await controller.createIssue(request.body);
            return reply.code(201).send({
                status: "Success",
                message: data
            });
        }
    );

    // Return Item
    app.post<{ Body: ReturnSahachariBody }>(
        "/return",
        {
            schema: {
                body: {
                    type: "object",
                    required: ["id", "return_date", "action_by"],
                    properties: {
                        id: { type: "number" },
                        return_date: { type: "string" },
                        action_by: { type: ["string", "number"] }
                    }
                }
            }
        },
        async (request: FastifyRequest<{ Body: ReturnSahachariBody }>, reply: FastifyReply) => {
            const data = await controller.returnIssue(request.body);
            return reply.code(200).send({
                status: "Success",
                message: data
            });
        }
    );

    // Fetch Sahachari Issues (With pagination, user/item search, and filters)
    app.post<{ Body: FetchSahachariBody }>(
        "/get",
        {
            schema: {
                body: {
                    type: "object",
                    properties: {
                        page: { type: "number", minimum: 1 },
                        limit: { type: "number", minimum: 1 },
                        id: { type: "number" },
                        user_id: { type: "number" },
                        item_id: { type: "number" },
                        start_date: { type: "string" },
                        end_date: { type: "string" },
                        filter: {
                            type: "string",
                            enum: ["all", "issued", "returned", "overdue_3_months"]
                        },
                        search: { type: ["string", "null"] }
                    }
                }
            }
        },
        async (request: FastifyRequest<{ Body: FetchSahachariBody }>, reply: FastifyReply) => {
            const { page = 1, limit = 10, filter = "all", ...filters } = request.body;

            const data = await controller.fetchIssues({
                offset: (page - 1) * limit,
                filters: {
                    ...filters,
                    filter,
                    page,
                    limit
                }
            });

            return reply.code(200).send(data);
        }
    );
}