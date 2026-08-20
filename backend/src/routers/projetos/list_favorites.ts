import type { FastifyPluginAsyncTypebox } from "@fastify/type-provider-typebox";
import { list_favorites_schema } from "../../schemas/projetos/favorites.schema.js";
import { autenticarJWT } from "../../hooks/JWT_verific.js";


const Favorites_plugin: FastifyPluginAsyncTypebox = async (Fastify) => {
    Fastify.addHook("onRequest", autenticarJWT);

    Fastify.get("/projetos/favoritos", list_favorites_schema, async (request, reply) => {
        
        const userId = request.user.id;
        const { cursor, limit: rawLimit } = request.query as { cursor?: string; limit?: string };
        const limit = Math.min(Math.max(parseInt(rawLimit || '20', 10) || 20, 1), 100);

        const favoritos_raw = await Fastify.prisma.favorite.findMany({
            where: {
                userId,
                ...(cursor ? { createdAt: { lt: new Date(cursor) } } : {})
            },
            orderBy: { createdAt: 'desc' },
            take: limit + 1,
            select: {
                createdAt: true,
                projeto: {
                    select: {
                        id: true,
                        titulo: true,
                        genero: true,
                        bpm: true,
                        escala: true,
                        descricao: true,
                        audio_guia: true,
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
                    }
                }
            }
        });

        const hasMore = favoritos_raw.length > limit;
        const items = hasMore ? favoritos_raw.slice(0, limit) : favoritos_raw;
        const nextCursor = hasMore ? items[items.length - 1].createdAt.toISOString() : null;

        const Favotitos = items.map((f) => ({
            ...f.projeto,
            createdAt: f.projeto.createdAt.toISOString()
        }));

        return reply.status(200).send({
            status: 'sucesso',
            favoritos: Favotitos,
            total: Favotitos.length,
            nextCursor
        });

    });
}

export { Favorites_plugin };
