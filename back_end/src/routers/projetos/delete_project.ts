import { FastifyPluginAsyncZod } from "fastify-type-provider-zod";
import { autenticarJWT } from "../../hooks/JWT_verific.js";
import { Schema_del_project } from "../../schemas/projetos/del_project.schema.js";
import argon2 from "argon2";

const del_project: FastifyPluginAsyncZod = async (Fastify) => {
    Fastify.addHook("preValidation", autenticarJWT);

    Fastify.delete("/projetos/:id", Schema_del_project, async (request, reply) => {

        const { id } = request.params; 
        const { senha } = request.body;
        const usuarioLogadoId = request.user.id;

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

    });
}

export { del_project };