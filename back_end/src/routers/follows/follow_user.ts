import { FastifyPluginAsyncZod } from "fastify-type-provider-zod";
import { follow_schema } from "../../schemas/follows/follow_user_schema.js";

const follow_user: FastifyPluginAsyncZod = async (Fastify) => {

    Fastify.post("/follow/:id", follow_schema, async (request, reply) => {

        const { followingId } = request.params;
        const followerId = request.user.id;

        if (followerId === followingId) {
            return reply.status(400).send({
                status: "erro",
                mensagem: "Você não pode seguir a si mesmo."
            });
        }

        try {
            const existingFollow = await Fastify.prisma.follows.findUnique({
                where: {
                    followerId_followingId: {
                        followerId: followerId,
                        followingId: followingId
                    }
                }
            });

            if (existingFollow) {
                await Fastify.prisma.follows.delete({
                    where: {
                        followerId_followingId: {
                            followerId: followerId,
                            followingId: followingId
                        }
                    }
                });

                return reply.status(200).send({
                    status: "sucesso",
                    mensagem: "Deixou de seguir o músico",
                    seguindo: false
                });
            }

            await Fastify.prisma.follows.create({
                data: {
                    followerId: followerId,
                    followingId: followingId
                }
            });

            return reply.status(200).send({
                status: "sucesso",
                mensagem: "Agora você está seguindo este músico!",
                seguindo: true
            });

        }

        catch (erro) {
            Fastify.log.error(erro);

            return reply.status(500).send({
                status: "erro",
                mensagem: "Erro ao processar a ação de seguir."
            });
        }

    });

}

export { follow_user };