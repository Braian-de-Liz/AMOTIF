import { FastifyPluginAsyncZod } from "fastify-type-provider-zod";
import { unfollow_schema } from "../../schemas/follows/unfollow_user_schema.js";

const Unfollow_route: FastifyPluginAsyncZod = async (Fastify) => {

    Fastify.delete("/follow/:id", unfollow_schema, async (request, reply) => {
        const { id } = request.params;
        const IdUser = request.user.id;

        await Fastify.prisma.follows.delete({
            where: {
                followerId_followingId: {
                    followerId: IdUser,
                    followingId: id
                }
            }
        });

        return reply.status(200).send({
            status: "sucesso",
            mensagem: "Você deixou de seguir este músico."
        });

    });
}

export { Unfollow_route };
