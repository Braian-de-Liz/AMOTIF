// back_end\src\routers\deletar_user.ts
import { FastifyPluginAsyncZod } from "fastify-type-provider-zod";
import argon2 from "argon2";
import { autenticarJWT } from "../../hooks/JWT_verific.js";
import { Schema_del_user } from "../../schemas/user_schema/delete_user_schema.js";

const Deletar_user: FastifyPluginAsyncZod = async (Fastify) => {
    Fastify.addHook("preValidation", autenticarJWT);

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