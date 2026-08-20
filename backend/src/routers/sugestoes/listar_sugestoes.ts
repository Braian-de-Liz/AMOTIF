import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox';
import { autenticarJWT } from "../../hooks/JWT_verific.js";
import { listar_sugestoes_schema } from "../../schemas/sugestoes/listar_sugestoes.schema.js";

const listar_sugestoes: FastifyPluginAsyncTypebox = async (Fastify) => {
    Fastify.addHook("onRequest", autenticarJWT);

    Fastify.get("/projetos/:id/sugestoes", listar_sugestoes_schema, async (request, reply) => {
        const { id: projetoId } = request.params;
        const { status, cursor, limit: rawLimit } = request.query as { status?: string; cursor?: string; limit?: string };
        const limit = Math.min(Math.max(parseInt(rawLimit || '20', 10) || 20, 1), 100);

        const projeto = await Fastify.prisma.projeto.findUnique({
            where: { id: projetoId }
        });

        if (!projeto) {
            return reply.status(404).send({
                status: "error",
                mensagem: "Projeto não encontrado"
            });
        }

        const where: Record<string, unknown> = { projetoId };
        if (status) {
            where.status = status;
        }
        if (cursor) {
            where.createdAt = { lt: new Date(cursor) };
        }

        const sugestoes = await Fastify.prisma.sugestao.findMany({
            where,
            include: {
                autor: {
                    select: {
                        id: true,
                        nome_completo: true,
                        avatar_url: true
                    }
                }
            },
            orderBy: { createdAt: 'desc' },
            take: limit + 1
        });

        const hasMore = sugestoes.length > limit;
        const items = hasMore ? sugestoes.slice(0, limit) : sugestoes;
        const nextCursor = hasMore ? items[items.length - 1].createdAt.toISOString() : null;

        return reply.status(200).send({
            status: "success",
            mensagem: "Sugestões listadas com sucesso",
            sugestoes: items.map(s => ({
                id: s.id,
                titulo: s.titulo,
                descricao: s.descricao,
                status: s.status,
                autor: s.autor,
                criado_em: s.createdAt.toISOString(),
                atualizado_em: s.updatedAt.toISOString()
            })),
            nextCursor
        });
    });
};

export { listar_sugestoes };
