import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox';
import { autenticarJWT } from "../../hooks/JWT_verific.js";
import { list_user_invites_schema } from "../../schemas/colaboration/list_user_invites_schema.js";

const list_user_invites: FastifyPluginAsyncTypebox = async (Fastify) => {
    Fastify.addHook("onRequest", autenticarJWT);

    Fastify.get("/convites", list_user_invites_schema, async (request, reply) => {
        const userEmail = request.user.email;
        const { cursor, limit: rawLimit } = request.query as { cursor?: string; limit?: string };
        const limit = Math.min(Math.max(parseInt(rawLimit || '20', 10) || 20, 1), 100);

        const convites = await Fastify.prisma.convite.findMany({
            where: {
                email_destinatario: userEmail,
                ...(cursor ? { createdAt: { lt: new Date(cursor) } } : {})
            },
            orderBy: { createdAt: 'desc' },
            take: limit + 1,
            include: {
                projeto: {
                    select: {
                        id: true,
                        titulo: true
                    }
                },
                remetente: {
                    select: {
                        id: true,
                        nome_completo: true
                    }
                }
            }
        });

        const hasMore = convites.length > limit;
        const items = hasMore ? convites.slice(0, limit) : convites;
        const nextCursor = hasMore ? items[items.length - 1].createdAt.toISOString() : null;

        const convitesFormatados = items.map(convite => ({
            id: convite.id,
            projetoId: convite.projetoId,
            projetoTitulo: convite.projeto.titulo,
            remetenteId: convite.remetenteId,
            remetenteNome: convite.remetente.nome_completo,
            cargo: convite.cargo,
            mensagem: convite.mensagem,
            token_convite: convite.token_convite,
            expira_em: convite.expira_em.toISOString()
        }));

        return reply.status(200).send({
            status: 'sucesso',
            convites: convitesFormatados,
            nextCursor
        });
    });
}

export { list_user_invites };
