import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox';
import { autenticarJWT } from "../../hooks/JWT_verific.js";
import { list_following_schema } from "../../schemas/follows/list_following.schema.js";

const list_following: FastifyPluginAsyncTypebox = async (Fastify) => {
    Fastify.addHook("onRequest", autenticarJWT);

    Fastify.get("/following", list_following_schema, async (request, reply) => {
        const UserId = request.user.id;
        const { cursor, limit: rawLimit } = request.query as { cursor?: string; limit?: string };
        const limit = Math.min(Math.max(parseInt(rawLimit || '20', 10) || 20, 1), 100);

        const rawFollows = await Fastify.prisma.follows.findMany({
            where: {
                followerId: UserId,
                ...(cursor ? { createdAt: { lt: new Date(cursor) } } : {})
            },
            orderBy: { createdAt: 'desc' },
            take: limit + 1,
            include: {
                following: {
                    select: {
                        id: true,
                        nome_completo: true,
                        avatar_url: true,
                        bio: true
                    }
                }
            }
        });

        const hasMore = rawFollows.length > limit;
        const items = hasMore ? rawFollows.slice(0, limit) : rawFollows;
        const nextCursor = hasMore ? items[items.length - 1].createdAt.toISOString() : null;

        const following = items.map(f => ({
            followerId: f.followerId,
            followingId: f.followingId,
            createdAt: f.createdAt.toISOString(),
            following: f.following
        }));

        return reply.status(200).send({
            status: "sucesso",
            mensagem: "Seguindo listados com sucesso",
            following,
            total: following.length,
            nextCursor
        });

    });

}

export { list_following };
