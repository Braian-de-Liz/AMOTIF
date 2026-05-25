import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox';
import { autenticarJWT } from "../../hooks/JWT_verific.js";
import { search_instrumento } from "../../schemas/search/search_by_instrument_schema.js";
import type { Prisma } from '@prisma/client'

const search_user_by_instruments: FastifyPluginAsyncTypebox = async (Fastify) => {
    Fastify.addHook("preValidation", autenticarJWT);

    Fastify.get("/search/user", search_instrumento, async (request, reply) => {

        const { instrumento, query, limite, pagina } = request.query;
        const usuarioLogadoId = request.user.id;

        const take = limite || 20;
        const skip = ((pagina || 1) - 1) * take;

        const where: Prisma.UserWhereInput = {};

        if (instrumento) {
            where.instrumentos = { has: instrumento };
        }

        if (query) {
            where.nome_completo = { contains: query, mode: 'insensitive' };
        }

        if (!instrumento && !query) {
            return reply.status(400).send({
                status: "erro",
                mensagem: "Informe um instrumento ou nome para buscar."
            });
        }

        const usuarios = await Fastify.prisma.user.findMany({
            where,
            select: {
                id: true,
                nome_completo: true,
                avatar_url: true,
                instrumentos: true,
                bio: true,
                _count: {
                    select: {
                        seguidores: true,
                        projetos_criados: true
                    }
                }
            },
            take,
            skip,
            orderBy: {
                createdAt: 'desc'
            }
        });

        const resultados = await Promise.all(usuarios.map(async (user) => {
            let isFollowing = false;
            if (usuarioLogadoId !== user.id) {
                const follow = await Fastify.prisma.follows.findUnique({
                    where: {
                        followerId_followingId: {
                            followerId: usuarioLogadoId,
                            followingId: user.id
                        }
                    }
                });
                isFollowing = !!follow;
            }
            return { ...user, isFollowing } as typeof user & { isFollowing: boolean };
        }));

        return reply.status(200).send({
            status: "sucesso",
            resultados
        });

    });

}

export { search_user_by_instruments };