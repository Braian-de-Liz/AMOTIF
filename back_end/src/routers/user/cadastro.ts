// back_end\src\routers\cadastro.ts
import { FastifyPluginAsyncZod } from "fastify-type-provider-zod";
import bcrypt from "bcrypt";
import { schema_register } from "../../schemas/user_schema/cadastroUSer_sche.js";

const User_register: FastifyPluginAsyncZod = async (Fastify, options) => {

    Fastify.post("/usuario", schema_register, async (request, reply) => {
        const { nome_completo, email, senha, cpf } = request.body;

        try {
            const check_user = await Fastify.prisma.user.findFirst({
                where: {
                    OR: [
                        { email: email },
                        { cpf: cpf }
                    ]
                }
            });

            if (check_user) {
                Fastify.log.warn("Tentativa de cadastro com email/cpf já existente");
                return reply.status(400).send({
                    status: 'erro',
                    mensagem: 'E-mail ou CPF já cadastrado no sistema'
                });
            }

            const senha_hash = await bcrypt.hash(senha, 6);

            const user = await Fastify.prisma.user.create({
                data: {
                    nome_completo,
                    email,
                    senha: senha_hash,
                    cpf
                }
            });

            return reply.status(201).send({
                status: 'sucesso',
                mensagem: 'Usuário criado com sucesso',
                userId: user.id
            });
        }
        catch (erro) {
            Fastify.log.error("Erro interno: " + erro);

            return reply.status(500).send({
                status: 'erro interno',
                mensagem: 'Erro do servidor ao realizar tarefa, tente mais tarde'
            });
        }
    });
}

export { User_register };