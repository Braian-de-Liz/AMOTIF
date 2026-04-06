import { FastifyPluginAsyncZod } from "fastify-type-provider-zod";
import { get_user_with_counts_schema } from "../../schemas/user_schema/get_user_with_counts_schema.js";

const Get_user_with_counts: FastifyPluginAsyncZod = async (Fastify) => {

    Fastify.get("/usuario/:id/completo", get_user_with_counts_schema, async (request, reply) => {

        const { id } = request.params;

        const check_user = await Fastify.prisma.user.findUnique({
            where: { id },
            select: {
                id: true,
                nome_completo: true,
                email: true,
                bio: true,
                instrumentos: true,
                avatar_url: true,
                createdAt: true,
                _count: {
                    select: {
                        seguidores: true,
                        seguindo: true
                    }
                }
            }
        });

        if (!check_user) {
            Fastify.log.error("usuário não encontrado");

            return reply.status(404).send({
                status: 'erro',
                mensagem: 'usuário não encontrado'
            });
        }

        return reply.status(200).send({
            status: 'sucesso',
            usuario: check_user
        });

    });
}

export { Get_user_with_counts };
