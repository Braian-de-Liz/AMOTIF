import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox';
import { autenticarJWT } from "../../hooks/JWT_verific.js";
import { read_all_notifications_schema } from "../../schemas/notification/read_all_notifications_schema.js";

const read_all_notifications: FastifyPluginAsyncTypebox = async (Fastify) => {
    Fastify.addHook("preValidation", autenticarJWT);

    Fastify.patch("/notifications/read-all", read_all_notifications_schema, async (request, reply) => {
        const userId = request.user.id;


        const { count } = await Fastify.prisma.notification.updateMany({
            where: {
                userId: userId,
                lida: false
            },
            data: {
                lida: true
            }
        });

        return reply.status(200).send({
            status: "sucesso",
            mensagem: "Todas as notificações foram marcadas como lidas.",
            atualizadas: count
        });
    });
};

export { read_all_notifications };