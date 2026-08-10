import type { FastifyPluginAsyncTypebox } from "@fastify/type-provider-typebox";
import { schema_deleteMural } from "../../schemas/projetos/delete_postMural.schema.js";
import { autenticarJWT } from "../../hooks/JWT_verific.js";

const Deletar_Comentario: FastifyPluginAsyncTypebox = async (Fastify) => {
    Fastify.addHook("onRequest", autenticarJWT);

    Fastify.delete("/projetos/:projetoId/mural/:comentarioId", schema_deleteMural, async (request, reply) => {
        const userId = request.user.id;
        const { projetoId, comentarioId } = request.params;

        const comentario = await Fastify.prisma.muralPost.findUnique({
            where: { id: comentarioId },
            select: { autorId: true, projetoId: true }
        });

        if (!comentario || comentario.projetoId !== projetoId) {
            return reply.status(404).send({
                status: "erro",
                mensagem: "Comentário não encontrado"
            });
        }

        const isAutor = comentario.autorId === userId;

        if (!isAutor) {
            const projeto = await Fastify.prisma.projeto.findUnique({
                where: { id: projetoId },
                select: { userId: true }
            });

            if (!projeto || projeto.userId !== userId) {
                return reply.status(403).send({
                    status: "erro",
                    mensagem: "Você não tem permissão para excluir este comentário"
                });
            }
        }

        await Fastify.prisma.muralPost.delete({
            where: { id: comentarioId }
        });

        return reply.status(200).send({
            status: "sucesso",
            mensagem: "Comentário excluído com sucesso"
        });
    });
}

export { Deletar_Comentario };
