import { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import ActiveYearController from "./activeYear.controller";

import {
    CreateActiveYearBody,
    FetchActiveYearBody,
    EditActiveYearBody,
    DeleteActiveYearBody,
    ChangeStatusYear
} from "./activeYear.types";

export async function activeYearRouter(app: FastifyInstance) {

    app.post<{ Body: CreateActiveYearBody }>(
        "/create",
        {
            schema: {
                body: {
                    type: "object",
                    required: ["year_title"],
                    properties: {
                        year_title: {
                            type: "string",
                            minLength: 9,             // Enforces exact YYYY-YYYY character length
                            maxLength: 9,
                            pattern: "^\\d{4}-\\d{4}$" // Enforces 4 digits, a hyphen, and 4 digits (e.g., 2026-2028)
                        },
                        status: {
                            type: "string",
                            enum: ["Soon","Open", "Close"]
                        },
                        created_by: {
                            type: "string"
                        }
                    }
                }
            }
        },
        async (request: FastifyRequest<{ Body: CreateActiveYearBody }>, reply: FastifyReply) => {
            const controller = new ActiveYearController();
            const data = await controller.createActiveYear(request.body);

            return reply.code(201).send({
                status: "Success",
                message: data
            });
        }
    );

    app.post<{ Body: FetchActiveYearBody }>(
        "/get",
        {
            schema: {
                body: {
                    type: "object",
                    properties: {
                        page: {
                            type: "number",
                            minimum: 1
                        },
                        limit: {
                            type: "number",
                            minimum: 1
                        },
                        id: {
                            type: "number"
                        },
                        search: {
                            type: ["string", "null"]
                        },
                        status: {
                            type: "number"
                        }
                    }
                }
            }
        },
        async (request: FastifyRequest<{ Body: FetchActiveYearBody }>, reply: FastifyReply) => {
            const { page = 1, limit = 10, ...filters } = request.body;

            const controller = new ActiveYearController();

            const data = await controller.fetchActiveYear({
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

    app.post<{ Body: EditActiveYearBody }>(
        "/edit",
        {
            schema: {
                body: {
                    type: "object",
                    required: ["id"],
                    properties: {
                        id: {
                            type: "number"
                        },
                        year_title: {
                            type: "string",
                            minLength: 9,             // Enforces exact YYYY-YYYY character length
                            maxLength: 9,
                            pattern: "^\\d{4}-\\d{4}$" // Enforces 4 digits, a hyphen, and 4 digits (e.g., 2026-2028)
                        },
                        status: {
                            type: "string",
                            enum: ["Open", "End"]
                        },
                        start_date: { type: "string" },
                        end_date: { type: "string" },
                        updated_by: {
                            type: "string"
                        }
                    }
                }
            }
        },
        async (request: FastifyRequest<{ Body: EditActiveYearBody }>, reply: FastifyReply) => {
            const controller = new ActiveYearController();
            const data = await controller.editActiveYear(request.body);
            return reply.code(200).send({
                status: "Success",
                message: data
            });
        }
    );

    app.post<{ Body: DeleteActiveYearBody }>(
        "/delete",
        {
            schema: {
                body: {
                    type: "object",
                    required: ["r_id","action_by"],
                    properties: {
                        r_id: {
                            type: "number"
                        },
                        action_by: {
                            type: "string"
                        }
                    }
                }
            }
        },
        async (request: FastifyRequest<{ Body: DeleteActiveYearBody }>, reply: FastifyReply) => {
            const controller = new ActiveYearController();
            const data = await controller.deleteActiveYear(request.body);

            return reply.code(200).send({
                status: "Success",
                message: data
            });
        }
    );
    app.post<{ Body: ChangeStatusYear }>(
        "/start/year",
        {
            schema: {
                body: {
                    type: "object",
                    required: ["id"],
                    properties: {
                        id: {
                            type: "number"
                        }
                    }
                }
            }
        },
        async (request: FastifyRequest<{ Body: ChangeStatusYear }>, reply: FastifyReply) => {
            const controller = new ActiveYearController();
            const data = await controller.startActiveYear(request.body);

            return reply.code(200).send({
                status: "Success",
                message: data
            });
        }
    );
    app.post<{ Body: ChangeStatusYear }>(
        "/end/year",
        {
            schema: {
                body: {
                    type: "object",
                    required: ["id"],
                    properties: {
                        id: {
                            type: "number"
                        }
                    }
                }
            }
        },
        async (request: FastifyRequest<{ Body: ChangeStatusYear }>, reply: FastifyReply) => {
            const controller = new ActiveYearController();
            const data = await controller.endActiveYear(request.body);

            return reply.code(200).send({
                status: "Success",
                message: data
            });
        }
    );

}