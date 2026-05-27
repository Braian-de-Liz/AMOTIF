import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox';
import { autenticarJWT } from "../../hooks/JWT_verific.js";
import { verificar_permissao } from "../../hooks/verificar_permissao.js";
import { mural_schema } from "../../schemas/projetos/mural.schema.js";

const mural_project: FastifyPluginAsyncTypebox = async (Fastify) => {
    Fastify.addHook("onRequest", autenticarJWT);
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
                mural: {
                    id: mural.id,
                    conteudo: mural.conteudo,
                    projetoId: mural.projetoId,
                    autorId: mural.autorId,
                    createdAt: mural.createdAt.toISOString()
                }
            });
    });
}

export { mural_project };
