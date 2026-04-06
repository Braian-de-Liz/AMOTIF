import { FastifyPluginAsyncZod } from "fastify-type-provider-zod";
import { like_project_schema } from "../../schemas/likes/like.schema.js";

const Create_like: FastifyPluginAsyncZod = async (Fastify) => {

    Fastify.post("/like/:projetoId", like_project_schema, async (request, reply) => {

        const { projetoId } = request.params;
        const userId = request.user.id;

        try {

            const result = await Fastify.prisma.$transaction(async (ctx: any) => {

                const existingLike = await ctx.like.findUnique({
                    where: { userId_projetoId: { userId, projetoId } }
                });

                if (existingLike) {
                    await ctx.like.delete({
                        where: { id: existingLike.id }
                    });
                    
                    const count = await ctx.like.count({ where: { projetoId } });
                    return { liked: false, count };
                }

                await ctx.like.create({ 
                    data: { userId, projetoId } 
                });

                const projeto = await ctx.projeto.findUnique({ 
                    where: { id: projetoId } 
                });

                if (projeto && projeto.userId !== userId) {
                    await ctx.notification.create({
                        data: {
                            userId: projeto.userId,
                            actorId: userId,
                            tipo: Fastify.notiType.NEW_LIKE,
                            mensagem: `${request.user.nome} curtiu seu projeto ${projeto.titulo}!`
                        }
                    });
                }

                const count = await ctx.like.count({ where: { projetoId } });
                return { liked: true, count };
            });

            return reply.status(200).send({ 
                status: "sucesso", 
                liked: result.liked,
                count: result.count 
            });

        } catch (erro) {
            Fastify.log.error(erro);
            return reply.status(500).send({
                status: "erro",
                mensagem: "Erro ao processar o like."
            });
        }
    });
}

export { Create_like };