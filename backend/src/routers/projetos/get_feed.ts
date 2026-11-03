import { MusicGenre, StatusProjeto } from "@prisma/client";
import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox';
import { autenticarJWT } from "../../hooks/JWT_verific.js";
import { get_feed_schema } from "../../schemas/projetos/get_explorer.js";
import { audioSigner } from "../../lib/signed_urls.js";
import { createFeedCache, FeedCache } from "../../lib/feed_cache.js";

type ProjetoFeed = {
    id: string;
    titulo: string;
    genero: MusicGenre;
    bpm: number;
    escala: string | null;
    descricao: string | null;
    status: StatusProjeto;
    audio_guia: string;
    createdAt: Date;
    autor: { id: string; nome_completo: string; avatar_url: string | null; instrumentos: string[] };
    _count: { likes: number; camadas: number; colaboradores: number };
};

type FeedCacheValue = { projetos: ProjetoFeed[]; nextCursor: string | null };

// Chave do cache: só o que muda o resultado compartilhado. "baixo" e "Baixo" caem na mesma entrada,
// porque a comparação de instrumento é insensível a maiúsculas.
function chaveFeed(genero?: string, status?: string, instrumentoFaltante?: string, cursor?: string): string {
    return JSON.stringify([
        genero ?? null,
        status ?? null,
        instrumentoFaltante ? instrumentoFaltante.trim().toLowerCase() : null,
        cursor ?? null,
    ]);
}

const searth_feed: FastifyPluginAsyncTypebox = async (Fastify) => {
    Fastify.addHook("onRequest", autenticarJWT);

    // Usa o cache global do Plugin_Routes quando existir; senão (ex.: testes com o plugin isolado) cria o seu.
    const cache: FeedCache<FeedCacheValue> = Fastify.hasDecorator("feedCache")
        ? (Fastify as any).feedCache
        : createFeedCache<FeedCacheValue>();

    Fastify.get("/projetos/feed", get_feed_schema, async (request, reply) => {
        const userId = request.user.id;
        const { genero, status, instrumentoFaltante, cursor } = request.query;

        const chave = chaveFeed(genero, status, instrumentoFaltante, cursor);
        let compartilhado = cache.get(chave);

        if (!compartilhado) {
            compartilhado = await buscarFeedCompartilhado(genero, status, instrumentoFaltante, cursor);
            cache.set(chave, compartilhado);
        }

        const { projetos: base, nextCursor } = compartilhado;
        const projetoIds = base.map(p => p.id);

        const [userLikes, userFavorites, sign] = await Promise.all([
            Fastify.prisma.like.findMany({
                where: { userId, projetoId: { in: projetoIds } },
                select: { projetoId: true }
            }),
            Fastify.prisma.favorite.findMany({
                where: { userId, projetoId: { in: projetoIds } },
                select: { projetoId: true }
            }),
            // Prévia de áudio no card: o guia precisa sair assinado, como no detalhe do projeto.
            audioSigner(Fastify.storage, base.map(p => p.audio_guia))
        ]);

        const likedSet = new Set(userLikes.map(l => l.projetoId));
        const favoritedSet = new Set(userFavorites.map(f => f.projetoId));

        const projetos = base.map(({ id, titulo, genero, bpm, escala, descricao, status, audio_guia, createdAt, autor, _count }) => ({
            id, titulo, genero, bpm, escala, descricao, status,
            audio_guia: sign(audio_guia),
            createdAt: createdAt.toISOString(),
            autor, _count,
            userHasLiked: likedSet.has(id),
            userHasFavorited: favoritedSet.has(id),
        }));

        return reply.status(200).send({
            status: 'sucesso',
            nextCursor,
            projetos
        });
    });

    async function buscarFeedCompartilhado(
        genero: string | undefined,
        status: string | undefined,
        instrumentoFaltante: string | undefined,
        cursor: string | undefined,
    ): Promise<FeedCacheValue> {
        const projetosRaw = await Fastify.prisma.projeto.findMany({
            where: {
                deletedAt: null,
                ...(genero && { genero: genero as MusicGenre }),
                ...(status && { status: status as StatusProjeto }),
                ...(instrumentoFaltante && {
                    camadas: {
                        none: {
                            // A tag é texto livre: "baixo" e "Baixo" são o mesmo instrumento.
                            instrumento_tag: { equals: instrumentoFaltante, mode: 'insensitive' },
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
                status: true,
                audio_guia: true,
                createdAt: true,
                autor: {
                    select: {
                        id: true,
                        nome_completo: true,
                        avatar_url: true,
                        instrumentos: true
                    }
                },
                _count: {
                    select: {
                        likes: true,
                        camadas: true,
                        colaboradores: true
                    }
                }
            }
        });

        const projetos: ProjetoFeed[] = projetosRaw;
        const nextCursor = projetos.length > 50 ? projetos[49].id : null;
        if (nextCursor) projetos.length = 50;

        return { projetos, nextCursor };
    }
}

export { searth_feed };