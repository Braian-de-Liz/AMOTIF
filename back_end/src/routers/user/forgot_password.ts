import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox';
import { autenticarJWT } from "../../hooks/JWT_verific.js";
import { recupere_senha_schema } from '../../schemas/user_schema/forgot_password.schema.js'


const Recuperar_senha: FastifyPluginAsyncTypebox = async (Fastify) => {
    Fastify.addHook("onRequest", autenticarJWT);

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

        const validate_senha = await Bun.password.verify(senha, user.senha);

        if (!validate_senha) {
            return reply.status(401).send({
                status: 'erro',
                mensagem: "Senha atual incorreta."
            });
        }


        const nova_senha_hash = await Bun.password.hash(nova_senha, {
            algorithm: "argon2id",
            timeCost: 2,
            memoryCost: 4096
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
