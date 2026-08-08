import {
  FastifyInstance,
  FastifyReply,
  FastifyRequest,
} from "fastify";

import { OTPController } from "./otp.controller";
import {
  GenerateOTPPayload,
  DeleteOTPPayload,
} from "./otp.types";

export async function otpRouter(app: FastifyInstance) {
  const controller = new OTPController();


  // Verify OTP
 

  // Delete OTP
  app.delete<{ Body: DeleteOTPPayload }>(
    "/delete",
    {
      schema: {
        body: {
          type: "object",
          required: ["user_id"],
          properties: {
            user_id: {
              type: ["string", "number"],
            },
          },
        },
      },
    },
    async (
      request: FastifyRequest<{ Body: DeleteOTPPayload }>,
      reply: FastifyReply
    ) => {
      const data = await controller.deleteOTP(request.body.user_id);

      return reply.code(200).send({
        status: "Success",
        message: "OTP deleted successfully.",
        data,
      });
    }
  );
}