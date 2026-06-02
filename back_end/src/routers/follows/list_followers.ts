import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox';
import { autenticarJWT } from "../../hooks/JWT_verific.js";
import { list_followers_schema } from "../../schemas/follows/list_followers.schema.js";

const list_followers: FastifyPluginAsyncTypebox = async (Fastify) => {
    Fastify.addHook("onRequest", autenticarJWT);

    Fastify.get("/follows", list_followers_schema, async (request, reply) => {
        const UserId = request.user.id;

        const rawFollows = await Fastify.prisma.follows.findMany({
            where: {
                followingId: UserId
            },
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

        const follows = rawFollows.map(f => ({
            ...f,
            createdAt: f.createdAt.toISOString()
        }));

        const followers_count = follows.length;

        return reply.status(200).send({
            status: "sucesso",
            mensagem: "Followers listados com sucesso",
            follows: follows,
            total: followers_count
        });

    });

}
export { list_followers };
