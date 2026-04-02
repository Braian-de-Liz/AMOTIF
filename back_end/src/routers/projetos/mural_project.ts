import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";
import { mural_schema } from "../../schemas/projetos/mural.schema.js";
import { Fastify } from "../../server.js";

const mural_project: FastifyPluginAsyncZod = async (fastify) => {

    fastify.post("/projetos/:id/mural", mural_schema, async (request, reply) => {

        const autorId = request.user.id;
        const { projeto_id } = request.params;
        const { conteudo } = request.body;

        try {

            const mural = await fastify.prisma.muralPost.create({
                data: {
                    projetoId: projeto_id,
                    autorId: autorId,
                    conteudo: conteudo
                }
            });

            if (!mural) {
                Fastify.log.error("Erro ao criar mural");

                return reply.status(500).send({
                    status: "error",
                    mensagem: "Erro ao criar mural"
                });
            }

            return reply.status(201).send({
                status: "success",
                mensagem: "Mural criado com sucesso",
                mural
            });
        }

        catch (erro) {
            Fastify.log.error(erro);
            
            return reply.status(500).send({
                status: "error",
                mensagem: "Erro ao criar mural"
            });
        }

    });
}

export { mural_project };