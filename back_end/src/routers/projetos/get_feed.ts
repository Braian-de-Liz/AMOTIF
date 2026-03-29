import { FastifyPluginAsyncZod } from "fastify-type-provider-zod";
import { get_feed_schema } from "../../schemas/projetos/get_explorer.js";

const searth_feed: FastifyPluginAsyncZod = async (Fastify) => {

    Fastify.get("/projetos/feed", get_feed_schema, async (request, reply) => {
        const userId = request.user.id;
        const { genero, instrumentoFaltante } = request.query;

        try {
            const projetosRaw = await Fastify.prisma.projeto.findMany({
                where: {
                    ...(genero && { genero: genero as any }),
                    ...(instrumentoFaltante && {
                        NOT: {
                            camadas: {
                                some: { 
                                    instrumento_tag: instrumentoFaltante, 
                                    esta_aprovada: true 
                                }
                            }
                        }
                    })
                },
                take: 20,
                orderBy: { createdAt: 'desc' },
                include: {
                    autor: {
                        select: {
                            nome_completo: true,
                            instrumentos: true
                        }
                    },
                    _count: {
                        select: {
                            likes: true,
                            camadas: true,
                            colaboradores: true
                        }
                    },
                    likes: {
                        where: { userId },
                        select: { id: true }
                    }
                }
            });

            const projetos = projetosRaw.map(projeto => ({
                ...projeto,
                userHasLiked: projeto.likes.length > 0,
                likes: undefined 
            }));

            return reply.status(200).send({
                status: 'sucesso',
                projetos
            });

        } catch (erro) {
            Fastify.log.error(erro);
            return reply.status(500).send({
                status: 'erro',
                mensagem: 'Erro ao carregar o feed de projetos.'
            });
        }
    });
}

export { searth_feed };