import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox';
import { autenticarJWT } from "../../hooks/JWT_verific.js";
import { deletar_comentario_schema } from "../../schemas/comentarios/comentarios.schema.js";
import { contextoDaCamada } from "../../lib/permissoes.js";

const deletar_comentario: FastifyPluginAsyncTypebox = async (Fastify) => {
    Fastify.addHook("onRequest", autenticarJWT);

    Fastify.delete("/comentarios/:id", deletar_comentario_schema, async (request, reply) => {
        const { id } = request.params;
        const userId = request.user.id;

        const atual = await Fastify.prisma.comentario.findUnique({
            where: { id },
            select: { camadaId: true, autorId: true }
        });
        const ctx = atual && await contextoDaCamada(Fastify, atual.camadaId, userId);

        if (!atual || !ctx || !ctx.papel) {
            return reply.status(404).send({ status: "erro", mensagem: "Comentário não encontrado." });
        }

        if (atual.autorId !== userId && ctx.papel !== "DONO") {
            return reply.status(403).send({ status: "erro", mensagem: "Ação negada: só o autor do comentário ou o dono do projeto pode removê-lo." });
        }

        await Fastify.prisma.comentario.delete({ where: { id } });

        return reply.status(200).send({ status: "sucesso", mensagem: "Comentário removido." });
    });
};

export { deletar_comentario };
