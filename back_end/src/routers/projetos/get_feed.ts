import { MusicGenre } from "@prisma/client";
import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox';
import { autenticarJWT } from "../../hooks/JWT_verific.js";
import { get_feed_schema } from "../../schemas/projetos/get_explorer.js";


const searth_feed: FastifyPluginAsyncTypebox = async (Fastify) => {
    Fastify.addHook("onRequest", autenticarJWT);

    Fastify.get("/projetos/feed", get_feed_schema, async (request, reply) => {
        const userId = request.user.id;
        const { genero, instrumentoFaltante } = request.query;

        const projetosRaw = await Fastify.prisma.projeto.findMany({
            where: {
                ...(genero && { genero: genero as MusicGenre }),
                ...(instrumentoFaltante && {
                    NOT: {
                        camadas: {
                            some: {
                                instrumento_tag: instrumentoFaltante,
                                esta_aprovada: true
                            }
                        }
                    }
                })
            },
            take: 20,
            orderBy: { createdAt: 'desc' },
            include: {
                autor: {
                    select: {
                        nome_completo: true,
                        instrumentos: true
                    }
                },
                _count: {
                    select: {
                        likes: true,
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
            }
        });

        const projetos = projetosRaw.map(({ id, titulo, genero, bpm, escala, descricao, audio_guia, createdAt, autor, _count, likes, favoritos }) => ({
            id,
            titulo,
            genero,
            bpm,
            escala,
            descricao,
            audio_guia,
            createdAt: createdAt.toISOString(),
            autor,
            _count,
            userHasLiked: likes.length > 0,
            userHasFavorited: favoritos.length > 0,
        }));

        return reply.status(200).send({
            status: 'sucesso',
            projetos
        });

    });
}

export { searth_feed };
