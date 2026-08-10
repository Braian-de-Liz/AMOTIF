import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox';
import { autenticarJWT } from "../../hooks/JWT_verific.js";
import { verificar_colaborador } from "../../hooks/verificar_colaborador.js";
import { get_mural_schema } from "../../schemas/projetos/get_mural.schema.js";

const get_mural: FastifyPluginAsyncTypebox = async (Fastify) => {
    Fastify.addHook("onRequest", autenticarJWT);
    Fastify.addHook("preHandler", verificar_colaborador);

    Fastify.get('/mural/:id', get_mural_schema, async (request, reply) => {

        const { id: projeto_id } = request.params;

        const mural = await Fastify.prisma.muralPost.findMany({
            where: {
                projetoId: projeto_id
            },
            include: {
                autor: {
                    select: {
                        id: true,
                        nome_completo: true,
                        avatar_url: true
                    }
                }
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
            mural: mural.map(({ id, conteudo, projetoId, autor, createdAt }) => ({
                id,
                conteudo,
                projetoId,
                autor,
                criado_em: createdAt.toISOString()
            }))
        });

    });

}

export { get_mural };
