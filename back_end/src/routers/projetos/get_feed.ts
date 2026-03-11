import { FastifyPluginAsyncZod } from "fastify-type-provider-zod";
import { get_feed_schema } from "../../schemas/projetos/get_explorer.js";


const searth_feed: FastifyPluginAsyncZod = async (Fastify) => {

    Fastify.get("/projetos", get_feed_schema, async (request, reply) => {

        try {
            const projetos = await Fastify.prisma.projeto.findMany({
                take: 20,
                orderBy: {
                    createdAt: 'desc'
                },
                include: {
                    autor: {
                        select: {
                            nome_completo: true,
                            instrumentos: true
                        }
                    }
                }
            });

            return reply.status(200).send({
                status: 'sucesso',
                projetos
            });

        }

        catch (erro) {
            Fastify.log.error(erro);
            return reply.status(500).send({
                status: 'erro',
                mensagem: 'Erro ao carregar o feed de projetos.'
            });
        }

    });
}

export { searth_feed };