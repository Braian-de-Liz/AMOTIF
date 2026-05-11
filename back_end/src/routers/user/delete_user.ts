import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox';
import argon2 from "argon2";
import { autenticarJWT } from "../../hooks/JWT_verific.js";
import { verificar_permissao } from "../../hooks/verificar_permissao.js";
import { Schema_del_user } from "../../schemas/user_schema/delete_user_schema.js";

const Deletar_user: FastifyPluginAsyncTypebox = async (Fastify) => {
    Fastify.addHook("preValidation", autenticarJWT);
    Fastify.addHook("preHandler", verificar_permissao);

    Fastify.delete("/usuario/:id", Schema_del_user, async (request, reply) => {
        const { id } = request.params;
        const { senha } = request.body;

        const encontrar_user = await Fastify.prisma.user.findUnique({ where: { id } });

        if (!encontrar_user) {
            Fastify.log.error("usuário não encontrado");

            return reply.status(404).send({
                status: 'erro',
                mensagem: 'usuário não encontrado'
            });
        }

        const senha_true = await argon2.verify(encontrar_user.senha, senha);

        if (!senha_true) {
            Fastify.log.error("senha incorreta");

            return reply.status(400).send({
                status: 'erro',
                mensagem: 'senha incorreta'
            });
        }

        await Fastify.prisma.user.delete({ where: { id } });

        return reply.status(202).send({
            status: 'sucesso',
            mensagem: 'usuário deletado com sucesso'
        });
    });
}

export { Deletar_user };