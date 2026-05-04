import { FastifyPluginAsyncZod } from "fastify-type-provider-zod";
import { autenticarJWT } from "../../hooks/JWT_verific.js";
import { get_notifications_schema } from "../../schemas/notification/get_a_notificarion.schema.js";

const get_notifications: FastifyPluginAsyncZod = async (Fastify) => {
    Fastify.addHook("preValidation", autenticarJWT);

    Fastify.get("/notifications", get_notifications_schema, async (request, reply) => {

        const userId = request.user.id;

        const notificacoes = await Fastify.prisma.notification.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
            take: 50,
            include: {
                origem: {
                    select: { nome_completo: true, avatar_url: true }
                }
            }
        });

        return reply.status(200).send({
            status: "sucesso",
            notificacoes
        });
        
    });
};

export { get_notifications };