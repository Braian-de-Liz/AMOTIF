// back_end\src\routers\deletar_user.ts
import { FastifyPluginAsyncZod } from "fastify-type-provider-zod";
import argon2 from "argon2"; 
import { Schema_del_user } from "../../schemas/user_schema/delete_user_schema.js";

const Deletar_user: FastifyPluginAsyncZod = async (Fastify) => {

    Fastify.delete("/usuario/:id", Schema_del_user, async (request, reply) => {
        const { id } = request.params;
        const { senha } = request.body;

        const usuarioLogadoId = request.user.id;

        if (id !== usuarioLogadoId) {
            return reply.status(403).send({
                status: 'erro',
                mensagem: 'Você não tem permissão para deletar esta conta.'
            });
        }

        try {
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
        }
        catch (erro) {
            Fastify.log.warn("problema interno no servidor ou na validação " + erro);

            return reply.status(500).send({
                status: 'erro',
                mensagem: 'problema interno no servidor ou na validação'
            })
        }
    });
}

export { Deletar_user };