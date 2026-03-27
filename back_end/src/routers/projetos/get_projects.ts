import { FastifyPluginAsyncZod } from "fastify-type-provider-zod";
import { get_schemaPROJETC } from "../../schemas/projetos/get_schemaPROJETC.js";

const Get_projects_user: FastifyPluginAsyncZod = async (Fastify) => {

    Fastify.get("/projetos/:id/get", get_schemaPROJETC, async (request, reply) => {
        const { id } = request.params;

        try {
            const projetos = await Fastify.prisma.projeto.findMany({
                where: {
                    userId: id
                },
                orderBy: {
                    createdAt: 'desc'
                }
            });

            if (projetos.length === 0) {
                return reply.status(200).send({
                    status: 'sucesso',
                    mensagem: 'O usuário ainda não possui projetos.',
                    projetos: []
                });
            }

            return reply.status(200).send({
                status: 'sucesso',
                mensagem: 'Projetos encontrados com sucesso.',
                projetos
            });

        } catch (erro) {
            Fastify.log.error(erro);
            return reply.status(500).send({
                status: "erro",
                mensagem: "Erro ao buscar projetos do usuário."
            });
        }
    });
}

export { Get_projects_user };