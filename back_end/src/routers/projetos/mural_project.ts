import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";
import { autenticarJWT } from "../../hooks/JWT_verific.js";
import { verificar_permissao } from "../../hooks/verificar_permissao.js";
import { mural_schema } from "../../schemas/projetos/mural.schema.js";

const mural_project: FastifyPluginAsyncZod = async (Fastify) => {
    Fastify.addHook("preValidation", autenticarJWT);
    Fastify.addHook("preHandler", verificar_permissao);

    Fastify.post("/projetos/:id/mural", mural_schema, async (request, reply) => {

        const autorId = request.user.id;
        const { projeto_id } = request.params;
        const { conteudo } = request.body;

        

            const mural = await Fastify.prisma.muralPost.create({
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
    });
}

export { mural_project };