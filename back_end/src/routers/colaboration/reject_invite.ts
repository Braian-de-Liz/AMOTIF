import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox';
import { autenticarJWT } from "../../hooks/JWT_verific.js";
import { reject_schema_invite } from "../../schemas/colaboration/reject_invite_schema.js";

const Reject_Invite: FastifyPluginAsyncTypebox = async (Fastify) => {
    Fastify.addHook("preValidation", autenticarJWT);

    Fastify.delete("/colaboration/:projetoId/reject", reject_schema_invite, async (request, reply) => {
        const { projetoId } = request.params;
        const userId = request.user.id;

        const convite = await Fastify.prisma.colaborador.findFirst({
            where: { projetoId, userId },
            include: {
                projeto: true
            }
        });

        if (!convite) {
            return reply.status(404).send({
                status: "erro",
                mensagem: "Convite não encontrado ou já processado."
            });
        }

        await Fastify.prisma.colaborador.delete({
            where: { id: convite.id }
        });


        await Fastify.prisma.notification.create({
            data: {
                userId: convite.projeto.userId,
                actorId: userId,
                tipo: "PROJECT_REJECT",
                mensagem: `${request.user.nome} recusou o convite para o projeto ${convite.projeto.titulo}.`
            }
        }).catch((e: any) => Fastify.log.error("Erro notif rejeição: " + e));

        return reply.status(200).send({
            status: "sucesso",
            mensagem: "Convite recusado com sucesso."
        });

    });
}

export { Reject_Invite };