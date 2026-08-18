import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox';
import { schema_login } from "../../schemas/user_schema/schema_login.js";
import { generateRefreshToken } from '../../lib/refreshToken.js';

const ACCESS_TOKEN_MAX_AGE = 4 * 60 * 60;
const REFRESH_TOKEN_MAX_AGE = 7 * 24 * 60 * 60;

const login_user: FastifyPluginAsyncTypebox = async (Fastify) => {

    Fastify.post("/usuario/login", schema_login, async (request, reply) => {

        const { email, senha } = request.body;

        const check_user = await Fastify.prisma.user.findUnique({ where: { email } });

        if (!check_user) {
            Fastify.log.error("usuário não encontrado");

            return reply.status(401).send({
                status: 'erro',
                mensagem: 'usuário não encontrado'
            });
        }

        const senhaValida = await Bun.password.verify(senha, check_user.senha);

        if (!senhaValida) {
            Fastify.log.error("Dados incorretos");
            return reply.status(401).send({
                status: "erro",
                mensagem: "E-mail ou senha inválidos"
            });
        }

        const token = Fastify.jwt.sign({
            id: check_user.id,
            nome: check_user.nome_completo,
            email: check_user.email
        });

        const refreshToken = await generateRefreshToken(Fastify, check_user.id);

        reply.setCookie('token', token, {
            secure: true,
            httpOnly: true,
            sameSite: 'none',
            path: '/',
            maxAge: ACCESS_TOKEN_MAX_AGE
        });

        reply.setCookie('refresh_token', refreshToken, {
            secure: true,
            httpOnly: true,
            sameSite: 'none',
            path: '/',
            maxAge: REFRESH_TOKEN_MAX_AGE
        });

        return reply.status(200).send({
            status: "sucesso",
            usuario: {
                id: check_user.id,
                nome: check_user.nome_completo,
                email: check_user.email
            }
        });
    });
}

export { login_user };
