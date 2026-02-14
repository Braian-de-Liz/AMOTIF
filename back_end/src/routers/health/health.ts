import { FastifyPluginAsyncZod } from "fastify-type-provider-zod";
import { z } from "zod";

const health_route: FastifyPluginAsyncZod = async (Fastify) => {
    Fastify.get("/health", {
        schema: {
            response: {
                200: z.object({
                    status: z.string(),
                    timestamp: z.string(),
                    uptime: z.number()
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