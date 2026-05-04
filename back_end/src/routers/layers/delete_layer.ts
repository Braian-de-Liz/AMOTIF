import { FastifyPluginAsyncZod } from "fastify-type-provider-zod";
import { autenticarJWT } from "../../hooks/JWT_verific.js";
import { delete_lay_schema } from "../../schemas/layers/delete_a_layer.js";


const delete_layer: FastifyPluginAsyncZod = async (Fastify) => {
    Fastify.addHook("preValidation", autenticarJWT);

    Fastify.delete("/layer/:id", delete_lay_schema, async (request, reply) => {

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
    });
};

export { delete_layer };
