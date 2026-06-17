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
                },
                likes: {
                    where: { userId },
                    select: { id: true }
                },
                favoritos: {
                    where: { userId },
                    select: { id: true }
                }
            },
            orderBy: { createdAt: 'desc' },
            take: 30
        });

        const projetos = projetosRaw.map(({ id, titulo, bpm, genero, escala, descricao, createdAt, autor, _count, likes, favoritos }) => ({
            id,
            titulo,
            bpm,
            genero,
            escala,
            descricao,
            createdAt: createdAt.toISOString(),
            autor,
            _count,
            userHasLiked: likes.length > 0,
            userHasFavorited: favoritos.length > 0,
        }));

        return reply.status(200).send({
            status: "sucesso",
            resultados: projetos
        });

    });
}

export { search_project };
