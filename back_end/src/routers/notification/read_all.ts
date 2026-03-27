import { FastifyPluginAsyncZod } from "fastify-type-provider-zod";
import { read_all_notifications_schema } from "../../schemas/notification/read_all_notifications_schema.js";

const read_all_notifications: FastifyPluginAsyncZod = async (Fastify) => {
    
    Fastify.patch("/notifications/read-all", read_all_notifications_schema, async (request, reply) => {
        const userId = request.user.id;

        try {
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
        } catch (erro) {
            Fastify.log.error(erro);
            return reply.status(500).send({
                status: "erro",
                mensagem: "Erro ao atualizar notificações."
            });
        }
    });
};

export { read_all_notifications };