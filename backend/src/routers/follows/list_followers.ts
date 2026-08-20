import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox';
import { autenticarJWT } from "../../hooks/JWT_verific.js";
import { list_followers_schema } from "../../schemas/follows/list_followers.schema.js";

const list_followers: FastifyPluginAsyncTypebox = async (Fastify) => {
    Fastify.addHook("onRequest", autenticarJWT);

    Fastify.get("/follows", list_followers_schema, async (request, reply) => {
        const UserId = request.user.id;
        const { cursor, limit: rawLimit } = request.query as { cursor?: string; limit?: string };
        const limit = Math.min(Math.max(parseInt(rawLimit || '20', 10) || 20, 1), 100);

        const rawFollows = await Fastify.prisma.follows.findMany({
            where: {
                followingId: UserId,
                ...(cursor ? { createdAt: { lt: new Date(cursor) } } : {})
            },
            orderBy: { createdAt: 'desc' },
            take: limit + 1,
            include: {
                follower: {
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

        const follows = items.map(f => ({
            ...f,
            createdAt: f.createdAt.toISOString()
        }));

        const followers_count = follows.length;

        return reply.status(200).send({
            status: "sucesso",
            mensagem: "Followers listados com sucesso",
            follows: follows,
            total: followers_count,
            nextCursor
        });

    });

}
export { list_followers };
