import { FastifyPluginAsyncZod } from "fastify-type-provider-zod";
import { unfollow_schema } from "../../schemas/follows/unfollow_user_schema.js";

const Unfollow_route: FastifyPluginAsyncZod = async (Fastify) => {

    Fastify.delete("/follow/:id", unfollow_schema, async (request, reply) => {
        const { id } = request.params;
        const IdUser = request.user.id;

        try {
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

        }
        catch (erro) {
            Fastify.log.error(erro);
            
            return  reply.status(500).send({
                status: 'erro',
                mensagem: 'erro interno de servidor'
            });
        }

    });
}

export { Unfollow_route };