import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox';
import { Type } from '@sinclair/typebox';

const health_route: FastifyPluginAsyncTypebox = async (Fastify) => {
    Fastify.get("/health", {
        schema: {
            response: {
                200: Type.Object({
                    status: Type.String(),
                    timestamp: Type.String(),
                    uptime: Type.Number()
                })
            }
        }
    }, async (request, reply) => {
        return reply.status(200).send({
            status: "ok",
            timestamp: new Date().toISOString(),
            uptime: process.uptime()
        });
    });
};

export { health_route };