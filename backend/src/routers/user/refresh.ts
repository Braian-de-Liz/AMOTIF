import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox';
import { schema_refresh } from '../../schemas/user_schema/schema_refresh.js';
import { rotateRefreshToken } from '../../services/refreshToken.js';
import { secure_state, sameSite_state } from '../../lib/config.enviriment.js';
import { limite_refresh } from '../../lib/rate_limits.js';

const ACCESS_TOKEN_MAX_AGE = 4 * 60 * 60;
const REFRESH_TOKEN_MAX_AGE = 7 * 24 * 60 * 60;

const COOKIE_OPTIONS = {
    secure: secure_state,
    httpOnly: true,
    sameSite: sameSite_state,
    path: '/',
};

const refresh_token: FastifyPluginAsyncTypebox = async (Fastify) => {

    Fastify.post("/usuario/refresh", { ...schema_refresh, config: limite_refresh }, async (request, reply) => {

        const refreshToken = request.cookies?.refresh_token;

        if (!refreshToken) {
            return reply.status(401).send({
                status: "erro",
                mensagem: "Refresh token não fornecido"
            });
        }

        const result = await rotateRefreshToken(Fastify, refreshToken);

        if (result.kind === 'concurrent') {
            // Outra requisição (ex.: outra aba) acabou de rotacionar este token e vai definir os cookies novos.
            // Não limpamos os cookies aqui para não sobrescrever os que o vencedor da corrida enviou.
            return reply.status(409).send({
                status: "erro",
                mensagem: "Renovação já em andamento"
            });
        }

        if (result.kind === 'invalid') {
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
            maxAge: ACCESS_TOKEN_MAX_AGE
        });

        reply.setCookie('refresh_token', result.token, {
            ...COOKIE_OPTIONS,
            maxAge: REFRESH_TOKEN_MAX_AGE
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
