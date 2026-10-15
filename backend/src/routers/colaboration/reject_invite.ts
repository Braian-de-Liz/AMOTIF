import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox';
import { autenticarJWT } from "../../hooks/JWT_verific.js";
import { reject_schema_invite } from "../../schemas/colaboration/reject_invite_schema.js";
import { emailIgual } from "../../lib/normalizar_email.js";

const Reject_Invite: FastifyPluginAsyncTypebox = async (Fastify) => {
    Fastify.addHook("onRequest", autenticarJWT);

    // Recusa os convites pendentes deste projeto endereçados ao e-mail de quem está logado.
    // Não mexe em Colaborador: quem já participa do projeto continua participando.
    Fastify.delete("/colaboration/:projetoId/reject", reject_schema_invite, async (request, reply) => {
        const { projetoId } = request.params;
        const userId = request.user.id;

        const convite = await Fastify.prisma.convite.findFirst({
            where: { projetoId, email_destinatario: emailIgual(request.user.email) },
            select: {
                projeto: { select: { userId: true, titulo: true } }
            }
        });

        if (!convite) {
            return reply.status(404).send({
                status: "erro",
                mensagem: "Convite não encontrado ou já processado."
            });
        }

        // Pode haver convites repetidos para o mesmo e-mail: recusar vale para todos.
        await Fastify.prisma.convite.deleteMany({
            where: { projetoId, email_destinatario: emailIgual(request.user.email) }
        });

        try {
            await Fastify.prisma.notification.create({
                data: {
                    userId: convite.projeto.userId,
                    actorId: userId,
                    projetoId,
                    tipo: "PROJECT_REJECT",
                    mensagem: `${request.user.nome} recusou o convite para o projeto ${convite.projeto.titulo}.`
                }
            });
        } catch (err) {
            Fastify.log.error("Falha ao notificar recusa de convite: " + err);
        }

        return reply.status(200).send({
            status: "sucesso",
            mensagem: "Convite recusado com sucesso."
        });
    });
}

export { Reject_Invite };
