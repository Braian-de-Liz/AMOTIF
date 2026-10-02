import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox';
import { autenticarJWT } from "../../hooks/JWT_verific.js";
import { search_project_schema } from "../../schemas/search/search_project.schema.js";

const search_project: FastifyPluginAsyncTypebox = async (Fastify) => {
    Fastify.addHook("onRequest", autenticarJWT);

    Fastify.get("/search/projects", search_project_schema, async (request, reply) => {
        const userId = request.user.id;
        const { query, escala, bpm_min, bpm_max, genero } = request.query;

        const projetosRaw = await Fastify.prisma.projeto.findMany({
            where: {
                AND: [
                    { deletedAt: null },

                    query ? {
                        OR: [
                            { titulo: { contains: query, mode: 'insensitive' } },
                            { descricao: { contains: query, mode: 'insensitive' } }
                        ]
                    } : {},

                    genero ? { genero: genero } : {},

                    escala ? { escala: { equals: escala, mode: 'insensitive' } } : {},

                    {
                        bpm: {
                            gte: bpm_min || 0,
                            lte: bpm_max || 999
                        }
                    }
                ]
            },
            select: {
                id: true,
                titulo: true,
                bpm: true,
                genero: true,
                escala: true,
                descricao: true,
                createdAt: true,
                autor: {
                    select: {
                        nome_completo: true,
                        avatar_url: true
                    }
                },
                _count: {
                    select: {
                        camadas: true,
                        colaboradores: true
                    }
                }
            },
            orderBy: { createdAt: 'desc' },
            take: 30
        });

        const projetoIds = projetosRaw.map((projeto) => projeto.id);
        const [userLikes, userFavorites] = await Promise.all([
            Fastify.prisma.like.findMany({
                where: { userId, projetoId: { in: projetoIds } },
                select: { projetoId: true }
            }),
            Fastify.prisma.favorite.findMany({
                where: { userId, projetoId: { in: projetoIds } },
                select: { projetoId: true }
            })
        ]);

        const likedSet = new Set(userLikes.map((like) => like.projetoId));
        const favoritedSet = new Set(userFavorites.map((favorite) => favorite.projetoId));

        const projetos = projetosRaw.map(({ id, titulo, bpm, genero, escala, descricao, createdAt, autor, _count }) => ({
            id,
            titulo,
            bpm,
            genero,
            escala,
            descricao,
            createdAt: createdAt.toISOString(),
            autor,
            _count,
            userHasLiked: likedSet.has(id),
            userHasFavorited: favoritedSet.has(id),
        }));

        return reply.status(200).send({
            status: "sucesso",
            resultados: projetos
        });

    });
}

export { search_project };
