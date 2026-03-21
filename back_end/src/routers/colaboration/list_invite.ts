import { FastifyPluginAsyncZod } from "fastify-type-provider-zod";
import { List_invite_schema } from "../../schemas/colaboration/list_invite.js";

const list_invite: FastifyPluginAsyncZod = async (Fastify) => {

    Fastify.get("/colaboration/:id/invite", List_invite_schema, async (request, reply) => {
        
        const { id } = request.params;
        const idUsuarioLogado = request.user.id;

        try {
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
        } 
        
        catch (erro) {
            Fastify.log.error(erro);

            return reply.status(500).send({
                status: 'erro',
                mensagem: 'Erro interno ao listar os convites do projeto'
            });
        }
    });
}

export { list_invite };