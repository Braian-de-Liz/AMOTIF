import { FastifyPluginAsyncZod } from "fastify-type-provider-zod";
import { recupere_senha_schema } from '../../schemas/user_schema/forgot_password.schema.js'
import argon2 from "argon2";

const Recuperar_senha: FastifyPluginAsyncZod = async (Fastify) => {

    Fastify.patch("/forgot/password", recupere_senha_schema, async (request, reply) => {
        const { senha, nova_senha } = request.body;
        const userId = request.user.id;

        const user = await Fastify.prisma.user.findUnique({ where: { id: userId } });

        if (!user) {
            return reply.status(404).send({
                status: 'erro',
                mensagem: "Usuário não encontrado."
            });
        }

        const validate_senha = await argon2.verify(user.senha, senha);

        if (!validate_senha) {
            return reply.status(401).send({
                status: 'erro',
                mensagem: "Senha atual incorreta."
            });
        }


        const nova_senha_hash = await argon2.hash(nova_senha, {
            memoryCost: 2 ** 15,
            timeCost: 2,
            parallelism: 1
        });


        await Fastify.prisma.user.update({
            where: { id: userId },
            data: { senha: nova_senha_hash }
        });


        return reply.status(200).send({
            status: 'sucesso',
            mensagem: 'senha alterada com sucesso'
        });

    })
}

export { Recuperar_senha };