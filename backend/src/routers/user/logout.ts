import { FastifyPluginAsyncTypebox, Type } from '@fastify/type-provider-typebox';
import { deleteRefreshToken } from '../../services/refreshToken.js';

const logout_user: FastifyPluginAsyncTypebox = async (Fastify) => {

    const security_schema = {
        schema: {
            tags: ['Testes'],
            security: [{ bearerAuth: [] }]
        }
    }

    Fastify.post("/usuario/logout", security_schema, async (request, reply) => {

        const refreshToken = request.cookies?.refresh_token;

        if (refreshToken) {
            await deleteRefreshToken(Fastify, refreshToken);
        }

        reply.clearCookie('token', {
            path: '/',
            sameSite: 'lax',
            secure: false,
            httpOnly: true
        });

        reply.clearCookie('refresh_token', {
            path: '/',
            sameSite: 'lax',
            secure: false,
            httpOnly: true
        });

        return reply.status(200).send({
            status: "sucesso",
            mensagem: "Logout realizado com sucesso"
        });

    });
}

export { logout_user };