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
                    camadas: {
                        none: {
                            instrumento_tag: instrumentoFaltante,
                            esta_aprovada: true
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

        const projetos = projetosRaw.map((p) => ({
            id: p.id,
            titulo: p.titulo,
            genero: p.genero,
            bpm: p.bpm,
            escala: p.escala,
            descricao: p.descricao,
            audio_guia: p.audio_guia,
            createdAt: p.createdAt.toISOString(),
            autor: p.autor,
            _count: p._count,
            userHasLiked: p.likes.length > 0,
            userHasFavorited: p.favoritos.length > 0,
        }));

        return reply.status(200).send({
            status: 'sucesso',
            projetos
        });
    });
}

export { searth_feed };