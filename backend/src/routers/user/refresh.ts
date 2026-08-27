import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox';
import { schema_refresh } from '../../schemas/user_schema/schema_refresh.js';
import { rotateRefreshToken } from '../../services/refreshToken.js';

const COOKIE_OPTIONS = {
    secure: false,
    httpOnly: true,
    sameSite: 'lax' as const,
    path: '/',
};

const refresh_token: FastifyPluginAsyncTypebox = async (Fastify) => {

    Fastify.post("/usuario/refresh", schema_refresh, async (request, reply) => {

        const refreshToken = request.cookies?.refresh_token;

        if (!refreshToken) {
            return reply.status(401).send({
                status: "erro",
                mensagem: "Refresh token não fornecido"
            });
        }

        const result = await rotateRefreshToken(Fastify, refreshToken);

        if (!result) {
            reply.clearCookie('refresh_token', { path: '/' });
            reply.clearCookie('token', { path: '/' });

            return reply.status(401).send({
                status: "erro",
                mensagem: "Refresh token inválido ou expirado"
            });
        }

        const newAccessToken = Fastify.jwt.sign({
            id: result.user.id,
            nome: result.user.nome_completo,
            email: result.user.email
        });

        reply.setCookie('token', newAccessToken, {
            ...COOKIE_OPTIONS,
            maxAge: 4 * 60 * 60
        });

        reply.setCookie('refresh_token', result.token, {
            ...COOKIE_OPTIONS,
            maxAge: 7 * 24 * 60 * 60
        });

        return reply.status(200).send({
            status: "sucesso",
            usuario: {
                id: result.user.id,
                nome: result.user.nome_completo,
                email: result.user.email
            }
        });
    });
}

export { refresh_token };
