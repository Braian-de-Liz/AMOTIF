import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox';
import { autenticarJWT } from "../../hooks/JWT_verific.js";
import { List_invite_schema } from "../../schemas/colaboration/list_invite.js";
import { verificar_dono_projeto } from "../../hooks/verificar_dono_projeto.js";

const list_invite: FastifyPluginAsyncTypebox = async (Fastify) => {
    Fastify.addHook("onRequest", autenticarJWT);
    // `:id` é o ID do projeto: somente o dono lista os convites pendentes.
    Fastify.addHook("preHandler", verificar_dono_projeto('id'));

    Fastify.get("/colaboration/:id/invite", List_invite_schema, async (request, reply) => {

        const { id } = request.params;
        const { cursor, limit: rawLimit } = request.query as { cursor?: string; limit?: string };
        const limit = Math.min(Math.max(parseInt(rawLimit || '20', 10) || 20, 1), 100);

        const Check_invites = await Fastify.prisma.convite.findMany({
            where: {
                projetoId: id,
                ...(cursor ? { createdAt: { lt: new Date(cursor) } } : {})
            },
            orderBy: { createdAt: 'desc' },
            take: limit + 1,
            select: {
                id: true,
                projetoId: true,
                cargo: true,
                email_destinatario: true,
                mensagem: true,
                expira_em: true,
                createdAt: true
            }
        });

        const hasMore = Check_invites.length > limit;
        const items = hasMore ? Check_invites.slice(0, limit) : Check_invites;
        const nextCursor = hasMore ? items[items.length - 1].createdAt.toISOString() : null;

        const convites = items.map(c => ({
            id: c.id,
            projetoId: c.projetoId,
            cargo: c.cargo,
            email_destinatario: c.email_destinatario,
            mensagem: c.mensagem,
            expira_em: c.expira_em.toISOString()
        }));

        return reply.status(200).send({
            status: 'sucesso',
            convites,
            nextCursor
        });
    });
}

export { list_invite };
