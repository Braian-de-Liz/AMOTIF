import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox';
import { autenticarJWT } from "../../hooks/JWT_verific.js";
import { get_me_schema } from "../../schemas/user_schema/get_me.schema.js"

const Get_me: FastifyPluginAsyncTypebox = async (Fastify) => {
    Fastify.addHook("onRequest", autenticarJWT);

    Fastify.get("/auth/me", get_me_schema, async (request, reply) => {
        const userId = request.user.id;

        const check_user = await Fastify.prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                nome_completo: true,
                email: true,
                bio: true,
                instrumentos: true,
                avatar_url: true,
            }
        });

        if (!check_user) {
            return reply.status(404).send({
                status: 'erro',
                mensagem: 'Usuário não encontrado'
            });
        }

        return reply.status(200).send({
            status: 'sucesso',
            usuario: check_user
        });
    });
};

export { Get_me };