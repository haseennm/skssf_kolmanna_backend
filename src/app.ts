import Fastify from 'fastify';
import cors from '@fastify/cors';
import fastifyRateLimit from '@fastify/rate-limit';
import registerRoutes from './registerRoutes';
import { registerErrorHandler } from './middleware/errorMiddlware';
import { cns } from './utils/extra';

export const app = Fastify({
  logger: false,
});

app.register(cors, {
  origin: '*',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
});

app.register(fastifyRateLimit, {
  max: 100,
  timeWindow: '1 minute',
});

app.addHook('preHandler', async (request) => {
  cns(request.url, request.body as object);
});

// Register routes with /api prefix
app.register(registerRoutes, { prefix: '/api' });

registerErrorHandler(app);