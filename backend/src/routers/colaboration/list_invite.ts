import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox';
import { autenticarJWT } from "../../hooks/JWT_verific.js";
import { List_invite_schema } from "../../schemas/colaboration/list_invite.js";
import { verificar_permissao } from "../../hooks/verificar_permissao.js";

const list_invite: FastifyPluginAsyncTypebox = async (Fastify) => {
    Fastify.addHook("onRequest", autenticarJWT);
    Fastify.addHook("preHandler", verificar_permissao);

    Fastify.get("/colaboration/:id/invite", List_invite_schema, async (request, reply) => {

        const { id } = request.params;

        const Check_invites = await Fastify.prisma.convite.findMany({
            where: {
                projetoId: id
            },
            select: {
                id: true,
                projetoId: true,
                cargo: true,
                email_destinatario: true,
                mensagem: true,
                expira_em: true
            }
        });

        const convites = Check_invites.map(c => ({
            id: c.id,
            projetoId: c.projetoId,
            cargo: c.cargo,
            email_destinatario: c.email_destinatario,
            mensagem: c.mensagem,
            expira_em: c.expira_em.toISOString()
        }));

        return reply.status(200).send({
            status: 'sucesso',
            convites
        });
    });
}

export { list_invite };
