import { FastifyPluginAsyncZod } from "fastify-type-provider-zod";
import { schema_convite } from "../../schemas/colaboration/schema_convite.js";


const convite_project: FastifyPluginAsyncZod = async (Fastify) => {

    Fastify.post("/colaboration/:id/invite", schema_convite, async (request, reply) => {
        const { id } = request.params;
        const { email_destinatario, cargo, mensagem } = request.body

        try {
            const novoConvite = await Fastify.prisma.convite.create({
                data: {
                    projetoId: id,
                    email_destinatario: email_destinatario,
                    cargo: cargo,
                    mensagem: mensagem,
                    expira_em: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
                }
            });

            if (!novoConvite) {
                Fastify.log.error("projeto não encontrado");

                return reply.status(404).send({
                    status: 'erro',
                    mensagem: 'erro ao criar projeto'
                });
            }

            return reply.status(201).send({
                status: "sucesso",
                mensagem: "Convite criado com sucesso",
                convite: {
                    id: novoConvite.id,
                    projeto_id: novoConvite.projetoId,
                    email_destinatario: novoConvite.email_destinatario,
                    token_convite: novoConvite.token_convite,
                    expira_em: novoConvite.expira_em.toISOString()
                }
            })
        }

        catch (erro) {
            Fastify.log.error(erro);

            return reply.status(500).send({
                status: 'erro',
                mensagem: 'erro interno de servidor'
            });
        }
    });
}

export { convite_project };