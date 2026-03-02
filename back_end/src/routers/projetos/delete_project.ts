import { FastifyPluginAsyncZod } from "fastify-type-provider-zod";
import { Schema_del_user } from "../../schemas/user_schema/delete_user_schema.js";
import argon2 from "argon2";

const del_project: FastifyPluginAsyncZod = async (Fastify) => {

    Fastify.delete("/projetos/:id/delete", Schema_del_user, async (request, reply) => {

        const { id } = request.params; 
        const { senha } = request.body;
        const usuarioLogadoId = request.user.id;

        try {
            const user = await Fastify.prisma.user.findUnique({
                where: { id: usuarioLogadoId }
            });

            if (!user) {
                return reply.status(404).send({ status: 'erro', mensagem: "Usuário não encontrado" });
            }

            const check_password = await argon2.verify(user.senha, senha);

            if (!check_password) {
                Fastify.log.error("erro au autenticar senha");
                
                return reply.status(400).send({
                    status: 'erro',
                    mensagem: "Senha incorreta"
                });
            }


            await Fastify.prisma.projeto.delete({
                where: { id }
            });

            return reply.status(202).send({ status: "sucesso", mensagem: "Projeto deletado" });

        }

        catch (erro) {
            Fastify.log.warn
            return reply.status(500).send({
                status: 'erro',
                mensagem: "Erro interno"
            });
        }
    });
}

export { del_project };