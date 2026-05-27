import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox';
import { autenticarJWT } from "../../hooks/JWT_verific.js";
import { get_user_with_counts_schema } from "../../schemas/user_schema/get_user_with_counts_schema.js";

const Get_user_with_counts: FastifyPluginAsyncTypebox = async (Fastify) => {
    Fastify.addHook("onRequest", autenticarJWT);

    Fastify.get("/usuario/:id/completo", get_user_with_counts_schema, async (request, reply) => {

        const { id } = request.params;
        const usuarioLogadoId = request.user.id;

        const check_user = await Fastify.prisma.user.findUnique({
            where: { id },
            select: {
                id: true,
                nome_completo: true,
                email: true,
                bio: true,
                instrumentos: true,
                avatar_url: true,
                createdAt: true,
                _count: {
                    select: {
                        seguidores: true,
                        seguindo: true
                    }
                }
            }
        });

        if (!check_user) {
            Fastify.log.error("usuário não encontrado");

            return reply.status(404).send({
                status: 'erro',
                mensagem: 'usuário não encontrado'
            });
        }

        let isFollowing = false;
        if (usuarioLogadoId !== id) {
            const follow = await Fastify.prisma.follows.findUnique({
                where: {
                    followerId_followingId: {
                        followerId: usuarioLogadoId,
                        followingId: id
                    }
                }
            });
            isFollowing = !!follow;
        }

        return reply.status(200).send({
            status: 'sucesso',
            usuario: {
                id: check_user.id,
                nome_completo: check_user.nome_completo,
                email: check_user.email,
                bio: check_user.bio,
                instrumentos: check_user.instrumentos,
                avatar_url: check_user.avatar_url,
                createdAt: check_user.createdAt.toISOString(),
                _count: check_user._count,
                isFollowing
            } as any
        });

    });
}

export { Get_user_with_counts };
