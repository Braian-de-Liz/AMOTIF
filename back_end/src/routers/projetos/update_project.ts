import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";
import { update_project_schema } from "../../schemas/projetos/update_project_schema.js";

const Update_project: FastifyPluginAsyncZod = async (Fastify) => {

    Fastify.patch("/projetos/:id", update_project_schema, async (request, reply) => {
        
        const { id } = request.params;
        const dadosAtualizados = request.body; 

        try {
     
            const projeto = await Fastify.prisma.projeto.update({
                where: { id },
                data: dadosAtualizados 
            });

            
            return reply.status(200).send({
                status: 'sucesso',
                mensagem: 'projeto atualizado com sucesso',
                projeto
            });
        }
        catch (erro) {
            Fastify.log.error("Erro ao atualizar projeto: " + erro);

            return reply.status(500).send({
                status: 'erro',
                mensagem: 'problema interno no servidor ao atualizar o projeto'
            });
        }
    });
}

export { Update_project };