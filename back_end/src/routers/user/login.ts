import { FastifyPluginAsyncZod } from "fastify-type-provider-zod";
import bcrypt from "bcrypt";
import { schema_login } from "../../schemas/user_schema/schema_login.js";

const login_user: FastifyPluginAsyncZod = async (Fastify) => {

    Fastify.post("/usuario_login", schema_login, async (request, reply) => {

        const { email, senha } = request.body;

        try {
            const check_user = await Fastify.prisma.user.findUnique({ where: { email } });

            if (!check_user) {
                Fastify.log.error("usuário não encontrado");

                return reply.status(401).send({
                    status: 'erro',
                    mensagem: 'usuário, não encontrado'
                });
            }

            const senhaValida = await bcrypt.compare(senha, check_user.senha);

            if (!senhaValida) {
                Fastify.log.error("Dados incorretos");
                return reply.status(401).send({
                    status: "erro",
                    mensagem: "E-mail ou senha inválidos"
                });
            }

            const token = Fastify.jwt.sign({
                id: check_user.id,
                nome: check_user.nome_completo
            });

            return reply.status(200).send({
                status: "sucesso",
                token,
                usuario: {
                    id: check_user.id,
                    nome: check_user.nome_completo
                }
            });
        }

        catch (erro) {
            Fastify.log.warn("erro interno no servidor, ou validação negada" + erro);

            return reply.status(500).send({
                status: 'erro',
                mensagem: 'erro interno, ou dados inválidos'
            });
        }
    });
}

export { login_user };