import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox';
import { autenticarJWT } from "../../hooks/JWT_verific.js";
import { atualizar_sugestao_schema } from "../../schemas/sugestoes/atualizar_sugestao.schema.js";

const atualizar_sugestao: FastifyPluginAsyncTypebox = async (Fastify) => {
    Fastify.addHook("onRequest", autenticarJWT);

    Fastify.patch("/sugestoes/:id", atualizar_sugestao_schema, async (request, reply) => {
        const userId = request.user.id;
        const { id: sugestaoId } = request.params;
        const { status } = request.body;

        const sugestao = await Fastify.prisma.sugestao.findUnique({
            where: { id: sugestaoId },
            include: {
                projeto: {
                    select: { userId: true }
                }
            }
        });

        if (!sugestao) {
            return reply.status(404).send({
                status: "error",
                mensagem: "Sugestão não encontrada"
            });
        }

        if (sugestao.projeto.userId !== userId) {
            return reply.status(403).send({
                status: "error",
                mensagem: "Apenas o dono do projeto pode alterar o status da sugestão"
            });
        }

        const atualizada = await Fastify.prisma.sugestao.update({
            where: { id: sugestaoId },
            data: { status }
        });

        return reply.status(200).send({
            status: "success",
            mensagem: "Status da sugestão atualizado com sucesso",
            sugestao: {
                id: atualizada.id,
                titulo: atualizada.titulo,
                descricao: atualizada.descricao,
                status: atualizada.status,
                atualizado_em: atualizada.updatedAt.toISOString()
            }
        });
    });
};

export { atualizar_sugestao };
