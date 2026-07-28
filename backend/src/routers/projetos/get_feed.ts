import { MusicGenre } from "@prisma/client";
import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox';
import { autenticarJWT } from "../../hooks/JWT_verific.js";
import { get_feed_schema } from "../../schemas/projetos/get_explorer.js";

const searth_feed: FastifyPluginAsyncTypebox = async (Fastify) => {
    Fastify.addHook("onRequest", autenticarJWT);

    Fastify.get("/projetos/feed", get_feed_schema, async (request, reply) => {
        const userId = request.user.id;
        const { genero, instrumentoFaltante, cursor } = request.query;

        const projetosRaw = await Fastify.prisma.projeto.findMany({
            where: {
                deletedAt: null,
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
            take: 51,
            ...(cursor && { cursor: { id: cursor }, skip: 1 }),
            orderBy: [
                { createdAt: 'desc' },
                { id: 'desc' }
            ],
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
            id, titulo, genero, bpm, escala, descricao, audio_guia,
            createdAt: createdAt.toISOString(),
            autor, _count,
            userHasLiked: likes.length > 0,
            userHasFavorited: favoritos.length > 0,
        }));

        const nextCursor = projetos.length > 50 ? projetos[49].id : null;
        if (nextCursor) projetos.length = 50;

        return reply.status(200).send({
            status: 'sucesso',
            nextCursor,
            projetos
        });
    });
}

export { searth_feed };