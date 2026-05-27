import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox';
import { autenticarJWT } from "../../hooks/JWT_verific.js";
import { list_user_invites_schema } from "../../schemas/colaboration/list_user_invites_schema.js";

const list_user_invites: FastifyPluginAsyncTypebox = async (Fastify) => {
    Fastify.addHook("onRequest", autenticarJWT);

    Fastify.get("/convites", list_user_invites_schema, async (request, reply) => {
        const userEmail = request.user.email;

        const convites = await Fastify.prisma.convite.findMany({
            where: {
                email_destinatario: userEmail
            },
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

        const convitesFormatados = convites.map(convite => ({
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
            convites: convitesFormatados
        });
    });
}

export { list_user_invites };
