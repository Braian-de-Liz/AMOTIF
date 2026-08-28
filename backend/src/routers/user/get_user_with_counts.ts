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
                },
                seguindo: {
                    where: { followerId: usuarioLogadoId },
                    select: { followingId: true }
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

        const isFollowing = usuarioLogadoId !== id ? (check_user.seguindo?.length ?? 0) > 0 : false;

        const { seguindo: _, ...userData } = check_user;

        return reply.status(200).send({
            status: 'sucesso',
            usuario: {
                ...userData,
                createdAt: check_user.createdAt.toISOString(),
                isFollowing
            } as any
        });

    });
}

export { Get_user_with_counts };
