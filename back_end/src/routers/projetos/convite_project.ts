import { FastifyPluginAsyncZod } from "fastify-type-provider-zod";
import { schema_convite } from "../../schemas/projetos/schema_convite.js";


const convite_project: FastifyPluginAsyncZod = async (Fastify) => {

    Fastify.post("/projects/:id/invite", schema_convite, async (request, reply) => {
        
    });
}

export { convite_project };