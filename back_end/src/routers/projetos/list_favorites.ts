import type { FastifyPluginAsyncTypebox } from "@fastify/type-provider-typebox";
import { list_favorites_schema } from "../../schemas/projetos/favorites.schema.js";
import { autenticarJWT } from "../../hooks/JWT_verific.js";


const Favorites_plugin: FastifyPluginAsyncTypebox = async (Fastify) => {
    Fastify.addHook("preValidation", autenticarJWT);

    Fastify.get("/projetos/favoritos", list_favorites_schema, async (request, reply) => {
        
        const userId = request.user.id;

        const favoritos_raw = await Fastify.prisma.favorite.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
            select: {
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

        const Favotitos = favoritos_raw.map((f) => ({
            ...f.projeto,
            createdAt: f.projeto.createdAt.toISOString()
        }));

        return reply.status(200).send({
            status: 'sucesso',
            Favotitos,
            total: Favotitos.length
        });

    });
}

export { Favorites_plugin };