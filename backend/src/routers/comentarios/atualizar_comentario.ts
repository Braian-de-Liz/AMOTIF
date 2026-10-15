import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox';
import { autenticarJWT } from "../../hooks/JWT_verific.js";
import { atualizar_comentario_schema } from "../../schemas/comentarios/comentarios.schema.js";
import { contextoDaCamada } from "../../lib/permissoes.js";
import { SELECT_COMENTARIO, serializarComentario } from "./comum.js";

const atualizar_comentario: FastifyPluginAsyncTypebox = async (Fastify) => {
    Fastify.addHook("onRequest", autenticarJWT);

    Fastify.patch("/comentarios/:id", atualizar_comentario_schema, async (request, reply) => {
        const { id } = request.params;
        const { resolvido } = request.body;
        const texto = request.body.texto?.trim();
        const userId = request.user.id;

        const atual = await Fastify.prisma.comentario.findUnique({
            where: { id },
            select: { camadaId: true, autorId: true }
        });
        const ctx = atual && await contextoDaCamada(Fastify, atual.camadaId, userId);

        if (!atual || !ctx || !ctx.papel) {
            return reply.status(404).send({ status: "erro", mensagem: "Comentário não encontrado." });
        }

        const eAutor = atual.autorId === userId;

        // Texto: só quem escreveu.
        if (texto !== undefined && !eAutor) {
            return reply.status(403).send({ status: "erro", mensagem: "Ação negada: só o autor pode editar o comentário." });
        }
        if (texto !== undefined && !texto) {
            return reply.status(400).send({ status: "erro", mensagem: "O comentário não pode ficar vazio." });
        }

        // Resolver: quem escreveu, o autor da camada, o dono ou um produtor.
        const podeResolver = eAutor || ctx.camada.userId === userId || ctx.papel === "DONO" || ctx.papel === "PRODUTOR";
        if (resolvido !== undefined && !podeResolver) {
            return reply.status(403).send({ status: "erro", mensagem: "Ação negada: você não pode resolver este comentário." });
        }

        const comentario = await Fastify.prisma.comentario.update({
            where: { id },
            data: {
                ...(texto !== undefined && { texto }),
                ...(resolvido !== undefined && { resolvido })
            },
            select: SELECT_COMENTARIO
        });

        return reply.status(200).send({
            status: "sucesso",
            mensagem: "Comentário atualizado.",
            comentario: serializarComentario(comentario)
        });
    });
};

export { atualizar_comentario };
