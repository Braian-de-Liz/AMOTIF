import { FastifyPluginAsyncZod } from "fastify-type-provider-zod";
import { list_followers_schema } from "../../schemas/follows/list_followers.schema.js";

const list_followers: FastifyPluginAsyncZod = async (Fastify) => {

    Fastify.get("/follows", list_followers_schema, async (request, reply) => {
        const UserId = request.user.id;



        const follows = await Fastify.prisma.follows.findMany({
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