import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox';
import { autenticarJWT } from "../../hooks/JWT_verific.js";
import { deletar_sugestao_schema } from "../../schemas/sugestoes/deletar_sugestao.schema.js";

const deletar_sugestao: FastifyPluginAsyncTypebox = async (Fastify) => {
    Fastify.addHook("onRequest", autenticarJWT);

    Fastify.delete("/sugestoes/:id", deletar_sugestao_schema, async (request, reply) => {
        const userId = request.user.id;
        const { id: sugestaoId } = request.params;

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

        const isAutor = sugestao.autorId === userId;
        const isDonoProjeto = sugestao.projeto.userId === userId;

        if (!isAutor && !isDonoProjeto) {
            return reply.status(403).send({
                status: "error",
                mensagem: "Apenas o autor ou o dono do projeto pode deletar a sugestão"
            });
        }

        await Fastify.prisma.sugestao.delete({
            where: { id: sugestaoId }
        });

        return reply.status(200).send({
            status: "success",
            mensagem: "Sugestão deletada com sucesso"
        });
    });
};

export { deletar_sugestao };
