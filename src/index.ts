import Fastify from 'fastify'
import cors from '@fastify/cors'
import { env } from './utils/env'
import registerRoutes from './registerRoutes';
import { registerErrorHandler } from './middleware/errorMiddlware';
import { cns } from './utils/extra';

const app = Fastify({
    logger: false,
})

app.register(cors, {
    origin: '*',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']

});

app.addHook('preHandler', async (request, reply) => {
    cns(request.url, request.body as object)
})

app.register(registerRoutes, { prefix: '/api' });

registerErrorHandler(app);

const start = async () => {
    try {
        await app.listen({
            port: Number(env.PORT),
            host: "0.0.0.0"
        })
        console.log(
            `\x1b[44m Server running on http://localhost:${env.PORT}.. \x1b[0m`
        )
    } catch (err) {
        console.log(err)
        process.exit(1)
    }
}

start()