import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox';

const health_route: FastifyPluginAsyncTypebox = async (Fastify) => {

    Fastify.get("/health",  async (request, reply) => {

        return reply.status(200).send("ping");
    });

};

export { health_route };
