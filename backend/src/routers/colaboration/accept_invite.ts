import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox';
import { autenticarJWT } from "../../hooks/JWT_verific.js";
import { aceitar_convite_schema } from "../../schemas/colaboration/accept_invite.schema.js";

const Accept_invite: FastifyPluginAsyncTypebox = async (Fastify) => {
    Fastify.addHook("onRequest", autenticarJWT);

    Fastify.post("/colaboration/:id/accept", aceitar_convite_schema, async (request, reply) => {
        const { id: projetoId } = request.params;
        const { token_convite } = request.body;
        const userId = request.user.id;

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

        if (conviteExistente.email_destinatario !== request.user.email) {
            return reply.status(403).send({
                status: 'erro',
                mensagem: 'Este convite não é destinado a você.'
            });
        }

        if (new Date() > conviteExistente.expira_em) {
            return reply.status(410).send({
                status: 'erro',
                mensagem: 'Este convite já expirou'
            });
        }

        const jaColaborador = await Fastify.prisma.colaborador.findUnique({
            where: {
                userId_projetoId: { userId, projetoId }
            }
        });

        if (jaColaborador) {
            return reply.status(409).send({
                status: 'erro',
                mensagem: 'Você já é colaborador deste projeto.'
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

    });
}

export { Accept_invite };
