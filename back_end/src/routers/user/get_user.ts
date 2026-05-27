import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox';
import { autenticarJWT } from "../../hooks/JWT_verific.js";
import { verificar_permissao } from "../../hooks/verificar_permissao.js";
import { schema_get_user } from "../../schemas/user_schema/get_user_schema.js";

const Get_user: FastifyPluginAsyncTypebox = async (Fastify) => {
    Fastify.addHook("onRequest", autenticarJWT);
    Fastify.addHook("preHandler", verificar_permissao);

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
            usuario: {
                id: check_user.id,
                nome_completo: check_user.nome_completo,
                email: check_user.email,
                bio: check_user.bio,
                instrumentos: check_user.instrumentos,
                createdAt: check_user.createdAt.toISOString()
            }
        });

    });
}

export { Get_user };
