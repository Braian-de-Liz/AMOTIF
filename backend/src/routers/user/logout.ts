import { FastifyPluginAsyncTypebox, Type } from '@fastify/type-provider-typebox';

const logout_user: FastifyPluginAsyncTypebox = async (Fastify) => {

    const security_schema = {
        schema: {
            tags: ['Testes'],
            security: [{ bearerAuth: [] }]
        }
    }

    Fastify.post("/usuario/logout", security_schema, async (request, reply) => {

        reply.clearCookie('token', {
            path: '/',
            sameSite: 'none',
            secure: true,
            httpOnly: true
        });

        return reply.status(200).send({
            status: "sucesso",
            mensagem: "Logout realizado com sucesso"
        });

    });
}

export { logout_user };