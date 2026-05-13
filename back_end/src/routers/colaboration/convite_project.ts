import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox';
import { autenticarJWT } from "../../hooks/JWT_verific.js";
import { schema_convite } from "../../schemas/colaboration/schema_convite.js";
import { verificar_dono_projeto } from "../../hooks/verificar_dono_projeto.js";

const convite_project: FastifyPluginAsyncTypebox = async (Fastify) => {
    Fastify.addHook("preValidation", autenticarJWT);
    Fastify.addHook("preHandler", verificar_dono_projeto);

    Fastify.post("/colaboration/:id/invite", schema_convite, async (request, reply) => {
        const { id } = request.params;
        const { email_destinatario, cargo, mensagem } = request.body

        const novoConvite = await Fastify.prisma.convite.create({
            data: {
                projetoId: id,
                remetenteId: request.user.id,
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
    });
}

export { convite_project };