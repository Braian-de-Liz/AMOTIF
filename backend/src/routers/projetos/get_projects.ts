import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox';
import { autenticarJWT } from "../../hooks/JWT_verific.js";
import { verificar_permissao } from "../../hooks/verificar_permissao.js";
import { get_schemaPROJETC } from "../../schemas/projetos/get_schemaPROJETC.js";

const Get_projects_user: FastifyPluginAsyncTypebox = async (Fastify) => {
    Fastify.addHook("onRequest", autenticarJWT);
    Fastify.addHook("preHandler", verificar_permissao);

    Fastify.get("/projetos/:id/get", get_schemaPROJETC, async (request, reply) => {
        const { id } = request.params;
        const { cursor, limit: rawLimit } = request.query as { cursor?: string; limit?: string };
        const limit = Math.min(Math.max(parseInt(rawLimit || '20', 10) || 20, 1), 100);

        const projetos = await Fastify.prisma.projeto.findMany({
            where: {
                userId: id,
                ...(cursor ? { createdAt: { lt: new Date(cursor) } } : {})
            },
            orderBy: {
                createdAt: 'desc'
            },
            take: limit + 1
        });

        const hasMore = projetos.length > limit;
        const items = hasMore ? projetos.slice(0, limit) : projetos;
        const nextCursor = hasMore ? items[items.length - 1].createdAt.toISOString() : null;

        if (items.length === 0) {
            return reply.status(200).send({
                status: 'sucesso',
                mensagem: 'O usuário ainda não possui projetos.',
                projetos: [],
                nextCursor: null
            });
        }

        return reply.status(200).send({
            status: 'sucesso',
            mensagem: 'Projetos encontrados com sucesso.',
            projetos: items.map(({ id, titulo, genero, descricao, bpm, escala, createdAt }) => ({
                id,
                titulo,
                genero,
                descricao,
                bpm,
                escala,
                createdAt: createdAt.toISOString()
            })),
            nextCursor
        });

    });
}

export { Get_projects_user };
