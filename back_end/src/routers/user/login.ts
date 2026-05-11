import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox';
import argon2 from "argon2";
import { schema_login } from "../../schemas/user_schema/schema_login.js";

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

        const senhaValida = await argon2.verify(check_user.senha, senha);

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

        return reply.status(200).send({
            status: "sucesso",
            token,
            usuario: {
                id: check_user.id,
                nome: check_user.nome_completo,
                email: check_user.email
            }
        });
    });
}

export { login_user };