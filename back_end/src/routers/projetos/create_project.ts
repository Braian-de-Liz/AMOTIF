import { FastifyPluginAsyncZod } from "fastify-type-provider-zod";
import { schema_post_project } from "../../schemas/projetos/creat_project_schema.js";

const post_project: FastifyPluginAsyncZod = async (Fastify) => {

    Fastify.post("/projetos", schema_post_project, async (request, reply) => {

        

    }); 
}

export { post_project };