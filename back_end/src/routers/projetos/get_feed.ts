import { FastifyPluginAsyncZod } from "fastify-type-provider-zod";
import { get_feed_schema } from "../../schemas/projetos/get_explorer.js";

const searth_feed: FastifyPluginAsyncZod = async (Fastify) => {

    Fastify.get("/projetos/feed", get_feed_schema, async (request, reply) => {
        const userId = request.user.id;
        const { genero, instrumentoFaltante } = request.query;


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

        const projetos = projetosRaw.map((projeto: any) => ({
            ...projeto,
            userHasLiked: projeto.likes.length > 0,
            likes: undefined
        }));

        return reply.status(200).send({
            status: 'sucesso',
            projetos
        });

    });
}

export { searth_feed };