import { FastifyPluginAsyncZod } from "fastify-type-provider-zod";
import { delete_lay_schema } from "../../schemas/layers/delete_a_layer.js";


const delete_layer: FastifyPluginAsyncZod = async (Fastify) => {

    Fastify.delete("/layer/:id", delete_lay_schema, async (request, reply) => {

        try {

            const { id } = request.params;
            const usuarioId = request.user.id;

            const camada = await Fastify.prisma.camada.findUnique({
                where: { id },
                include: { projeto: true }
            });

            if (!camada) return reply.status(404).send({
                status: "erro",
                mensagem: "Camada inexistente"
            });

            if (camada.userId !== usuarioId && camada.projeto.userId !== usuarioId) {
                Fastify.log.warn("usuário não autorizável");
                return reply.status(403).send({
                    status: "erro",
                    mensagem: "Sem permissão para deletar."
                });
            }

            await Fastify.prisma.camada.delete({ where: { id } });

            return reply.status(200).send({
                status: "sucesso",
                mensagem: "Camada removida"
            });
        }

        catch (erro) {
            Fastify.log.error(erro);

            return reply.status(500).send({
                status: 'erro',
                mensagem: 'erro interno de servidor'
            })
        }
    });
};

export { delete_layer };