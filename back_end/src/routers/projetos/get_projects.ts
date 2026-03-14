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
                Fastify.log.error("erro usuário não possui projetos");

                return reply.status(404).send({
                    status: 'erro',
                    mensagem: 'usuário não possui projetos',
                    projetos: []
                })
            }

            return reply.status(200).send({
                status: 'sucesso',
                mensagem: 'projetos encontrado',
                projetos
            })

        }
        catch (erro) {
            console.log("\n ERRO DETECTADO NA ROTA GET_PROJECTS:");
            console.error(erro);
            console.log("------------------------------------------\n");
            Fastify.log.error(erro);

            return reply.status(500).send({
                status: "erro",
                mensagem: "Erro ao buscar projetos do usuário."
            });
        }
    });
}

export { Get_projects_user };