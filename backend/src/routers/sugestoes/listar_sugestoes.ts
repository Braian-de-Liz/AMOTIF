import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox';
import { autenticarJWT } from "../../hooks/JWT_verific.js";
import { listar_sugestoes_schema } from "../../schemas/sugestoes/listar_sugestoes.schema.js";

const listar_sugestoes: FastifyPluginAsyncTypebox = async (Fastify) => {
    Fastify.addHook("onRequest", autenticarJWT);

    Fastify.get("/projetos/:id/sugestoes", listar_sugestoes_schema, async (request, reply) => {
        const { id: projetoId } = request.params;
        const { status } = request.query as { status?: string };

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
            orderBy: { createdAt: 'desc' }
        });

        return reply.status(200).send({
            status: "success",
            mensagem: "Sugestões listadas com sucesso",
            sugestoes: sugestoes.map(s => ({
                id: s.id,
                titulo: s.titulo,
                descricao: s.descricao,
                status: s.status,
                autor: s.autor,
                criado_em: s.createdAt.toISOString(),
                atualizado_em: s.updatedAt.toISOString()
            }))
        });
    });
};

export { listar_sugestoes };
