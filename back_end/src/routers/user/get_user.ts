import { FastifyPluginAsyncZod } from "fastify-type-provider-zod";
import { schema_get_user } from "../../schemas/user_schema/get_user_schema.js";


const Get_user: FastifyPluginAsyncZod = async (Fastify) => {

    Fastify.get("/usuario/:id", schema_get_user, async (request, reply) => {

        const { id } = request.params;

        const check_user = await Fastify.prisma.user.findUnique({
            where: { id },
            select: {
                id: true,
                nome_completo: true,
                email: true,
                bio: true,
                instrumentos: true,
                createdAt: true,
            }
        });

        if (!check_user) {
            Fastify.log.error("usuário não enocntrado");

            return reply.status(404).send({
                status: 'erro',
                mensagem: 'usuário não enocntrado'
            });
        }

        return reply.status(200).send({
            status: 'sucesso',
            usuario: check_user
        });

    });
}

export { Get_user };