import { FastifyPluginAsyncZod } from "fastify-type-provider-zod";
import { get_mural_schema } from "../../schemas/projetos/get_mural.schema.js";

const get_mural: FastifyPluginAsyncZod = async (Fastify) => {

    Fastify.get('/mural/:projeto_id', get_mural_schema, async (request, reply) => {
        
        const { projeto_id } = request.params;
        
        const mural = await Fastify.prisma.muralPost.findMany({
            where: {
                projetoId: projeto_id
            }
        });

        if (!mural) {
            return reply.status(404).send({
                status: "error",
                mensagem: "Mural não encontrado"
            });
        }
        
        return reply.status(200).send({
            status: "success",
            mensagem: "Mural encontrado",
            mural
        });

    });

}

export { get_mural };
