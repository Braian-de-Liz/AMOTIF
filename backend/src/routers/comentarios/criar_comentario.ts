import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox';
import { autenticarJWT } from "../../hooks/JWT_verific.js";
import { criar_comentario_schema } from "../../schemas/comentarios/comentarios.schema.js";
import { contextoDaCamada, pode } from "../../lib/permissoes.js";
import { SELECT_COMENTARIO, serializarComentario } from "./comum.js";

function formatarTempo(segundos: number) {
    const total = Math.floor(segundos);
    return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, "0")}`;
}

const criar_comentario: FastifyPluginAsyncTypebox = async (Fastify) => {
    Fastify.addHook("onRequest", autenticarJWT);

    Fastify.post("/layer/:id/comentarios", criar_comentario_schema, async (request, reply) => {
        const { id } = request.params;
        const { segundos } = request.body;
        const texto = request.body.texto.trim();
        const userId = request.user.id;

        if (!texto) {
            return reply.status(400).send({ status: "erro", mensagem: "O comentário não pode ficar vazio." });
        }

        const ctx = await contextoDaCamada(Fastify, id, userId);
        if (!ctx) {
            return reply.status(404).send({ status: "erro", mensagem: "Camada não encontrada." });
        }

        if (!pode(ctx.papel, "comentar")) {
            return reply.status(403).send({ status: "erro", mensagem: "Ação negada: apenas participantes do projeto podem comentar." });
        }

        const comentario = await Fastify.prisma.comentario.create({
            data: {
                camadaId: id,
                autorId: userId,
                segundos,
                texto,
                versaoNumero: ctx.camada.currentVersion?.versionNumber ?? null
            },
            select: SELECT_COMENTARIO
        });

        // Avisa o autor da camada, a não ser que ele mesmo tenha comentado.
        if (ctx.camada.userId !== userId) {
            try {
                await Fastify.prisma.notification.create({
                    data: {
                        userId: ctx.camada.userId,
                        actorId: userId,
                        projetoId: ctx.camada.projeto.id,
                        tipo: "NEW_COMMENT",
                        mensagem: `${request.user.nome} comentou em ${formatarTempo(segundos)} da sua camada "${ctx.camada.nome_trilha}".`
                    }
                });
            } catch (err) {
                Fastify.log.error("Falha ao gerar notificação de comentário: " + err);
            }
        }

        return reply.status(201).send({
            status: "sucesso",
            mensagem: "Comentário adicionado.",
            comentario: serializarComentario(comentario)
        });
    });
};

export { criar_comentario };
