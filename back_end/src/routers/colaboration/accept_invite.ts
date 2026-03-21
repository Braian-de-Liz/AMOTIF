import { FastifyPluginAsyncZod } from "fastify-type-provider-zod";
import { aceitar_convite_schema } from "../../schemas/colaboration/accept_invite.schema.js";

const Accept_invite: FastifyPluginAsyncZod = async (Fastify) => {

    Fastify.post("/colaboration/:id/accept", aceitar_convite_schema, async (request, reply) => {
        const { id: projetoId } = request.params;
        const { token_convite } = request.body;
        const userId = request.user.id;

        try {
            const conviteExistente = await Fastify.prisma.convite.findFirst({
                where: {
                    token_convite,
                    projetoId
                }
            });

            if (!conviteExistente) {
                return reply.status(404).send({
                    status: 'erro',
                    mensagem: 'Convite não encontrado para este projeto'
                });
            }

            if (new Date() > conviteExistente.expira_em) {
                return reply.status(410).send({
                    status: 'erro',
                    mensagem: 'Este convite já expirou'
                });
            }

            await Fastify.prisma.$transaction([
                Fastify.prisma.colaborador.create({
                    data: {
                        userId: userId,
                        projetoId: projetoId,
                        cargo: conviteExistente.cargo
                    }
                }),
                Fastify.prisma.convite.delete({
                    where: { id: conviteExistente.id }
                })
            ]);

            return reply.status(201).send({
                status: 'sucesso',
                mensagem: 'Convite aceito com sucesso! Bem-vindo ao projeto.',
                projetoId: projetoId
            });

        }
        catch (erro) {
            Fastify.log.error(erro);

            return reply.status(500).send({
                status: 'erro',
                mensagem: 'Erro interno ao processar o aceite do convite'
            });
        }
    });
}

export { Accept_invite };