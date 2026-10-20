import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox';
import { schema_register } from "../../schemas/user_schema/cadastroUSer_sche.js";
import { encryptCPF, hashCPF } from "../../lib/cpf.js";
import { normalizarEmail, emailIgual } from "../../lib/normalizar_email.js";
import { limite_autenticacao } from "../../lib/rate_limits.js";

const User_register: FastifyPluginAsyncTypebox = async (Fastify) => {

    Fastify.post("/usuario", { ...schema_register, config: limite_autenticacao }, async (request, reply) => {

        const { nome_completo, senha, cpf } = request.body;
        const email = normalizarEmail(request.body.email);

        const cpfEncrypted = encryptCPF(cpf);
        const cpfHash = hashCPF(cpf);

        const check_user = await Fastify.prisma.user.findFirst({
            where: {
                OR: [
                    { email: emailIgual(email) },
                    { cpf_hash: cpfHash }
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

        const senha_hash = await Bun.password.hash(senha, {
            algorithm: "argon2id",
            memoryCost: 4096,
            timeCost: 2
        })

        const user = await Fastify.prisma.user.create({
            data: {
                nome_completo,
                email,
                senha: senha_hash,
                cpf: cpfEncrypted,
                cpf_hash: cpfHash
            }
        });

        return reply.status(201).send({
            status: 'sucesso',
            mensagem: 'Usuário criado com sucesso',
            userId: user.id
        });
    });
}

export { User_register };
