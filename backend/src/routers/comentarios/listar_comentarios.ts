import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox';
import { autenticarJWT } from "../../hooks/JWT_verific.js";
import { listar_comentarios_schema } from "../../schemas/comentarios/comentarios.schema.js";
import { contextoDaCamada, pode } from "../../lib/permissoes.js";
import { SELECT_COMENTARIO, serializarComentario } from "./comum.js";

const listar_comentarios: FastifyPluginAsyncTypebox = async (Fastify) => {
    Fastify.addHook("onRequest", autenticarJWT);

    Fastify.get("/layer/:id/comentarios", listar_comentarios_schema, async (request, reply) => {
        const { id } = request.params;

        const ctx = await contextoDaCamada(Fastify, id, request.user.id);
        if (!ctx) {
            return reply.status(404).send({ status: "erro", mensagem: "Camada não encontrada." });
        }

        // Comentários são notas de trabalho: só quem participa do projeto vê.
        if (!pode(ctx.papel, "comentar")) {
            return reply.status(403).send({ status: "erro", mensagem: "Ação negada: apenas participantes do projeto veem os comentários." });
        }

        const comentarios = await Fastify.prisma.comentario.findMany({
            where: { camadaId: id },
            orderBy: [{ segundos: "asc" }, { createdAt: "asc" }],
            select: SELECT_COMENTARIO
        });

        return reply.status(200).send({
            status: "sucesso",
            comentarios: comentarios.map(serializarComentario)
        });
    });
};

export { listar_comentarios };
