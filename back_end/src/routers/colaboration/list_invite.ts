import { FastifyPluginAsyncZod } from "fastify-type-provider-zod";
import { autenticarJWT } from "../../hooks/JWT_verific.js";
import { List_invite_schema } from "../../schemas/colaboration/list_invite.js";
import { verificar_permissao } from "../../hooks/verificar_permissao.js";


const list_invite: FastifyPluginAsyncZod = async (Fastify) => {
    Fastify.addHook("preValidation", autenticarJWT);
    Fastify.addHook("preHandler", verificar_permissao);

    Fastify.get("/colaboration/:id/invite", List_invite_schema, async (request, reply) => {
        
        const { id } = request.params;
        const idUsuarioLogado = request.user.id;

        const Check_invites = await Fastify.prisma.convite.findMany({
            where: { 
                projetoId: id 
            },
            include: {
                projeto: {
                    select: {
                        titulo: true
                    }
                }
            }
        });

        return reply.status(200).send({
            status: 'sucesso',
            convites: Check_invites
        });
    });
}

export { list_invite };
