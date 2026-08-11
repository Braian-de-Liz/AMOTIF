import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox';
import { autenticarJWT } from "../../hooks/JWT_verific.js";
import { read_notification_schema } from "../../schemas/notification/read_notification_schema.js";

const read_notification: FastifyPluginAsyncTypebox = async (Fastify) => {
    Fastify.addHook("onRequest", autenticarJWT);

    Fastify.patch("/notifications/:id/read", read_notification_schema, async (request, reply) => {
        const { id } = request.params;
        const userId = request.user.id;

        const notificacao = await Fastify.prisma.notification.findUnique({
            where: { id }
        });

        if (!notificacao || notificacao.userId !== userId) {
            return reply.status(404).send({
                status: 'erro',
                mensagem: 'Notificação não encontrada'
            });
        }

        await Fastify.prisma.notification.update({
            where: { id },
            data: { lida: true }
        });

        return reply.status(200).send({
            status: "sucesso"
        });
    });
};

export { read_notification };
