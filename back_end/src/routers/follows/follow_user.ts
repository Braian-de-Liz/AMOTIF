import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox';
import { autenticarJWT } from "../../hooks/JWT_verific.js";
import { follow_schema } from "../../schemas/follows/follow_user_schema.js";

const follow_user: FastifyPluginAsyncTypebox = async (Fastify) => {
    Fastify.addHook("preValidation", autenticarJWT);

    Fastify.post("/follow/:followingId", follow_schema, async (request, reply) => {

        const { followingId } = request.params
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

            try {
                await Fastify.prisma.notification.create({
                    data: {
                        userId: followingId,
                        actorId: followerId,
                        tipo: "NEW_FOLLOWER",
                        mensagem: `${request.user.nome} começou a seguir você!`
                    }
                });
            } catch (notifError) {

                Fastify.log.error("Erro ao criar notificação de follow:" + notifError);
            }

            return reply.status(200).send({
                status: "sucesso",
                mensagem: "Agora você está seguindo este músico!",
                seguindo: true
            });

        } catch (notifError) {
            Fastify.log.error("Erro ao criar notificação de follow:" + notifError);
        }

    });
}

export { follow_user };