import { FastifyPluginAsyncZod } from "fastify-type-provider-zod";
import { schema_auth_layer } from "../../schemas/layers/auth_layer.js";

const patch_layer_status: FastifyPluginAsyncZod = async (Fastify) => {

    Fastify.patch("/layer/:layerId/status", schema_auth_layer, async (request, reply) => {
        const { layerId } = request.params;
        const { aprovada } = request.body;
        const usuarioLogadoId = request.user.id;

        try {

            const camada = await Fastify.prisma.camada.findUnique({
                where: { id: layerId },
                include: { projeto: true }
            });

            if (!camada) return reply.status(404).send({
                status: 'erro',
                mensagem: "Camada não encontrada"
            });

            if (camada.projeto.userId !== usuarioLogadoId) {
                return reply.status(403).send({
                    status: 'erro',
                    mensagem: "Ação negada: Você não é o dono deste projeto."
                });
            }

            await Fastify.prisma.camada.update({
                where: { id: layerId },
                data: { esta_aprovada: aprovada }
            });

            return reply.status(200).send({
                status: "sucesso",
                mensagem: aprovada ? "Camada aprovada!" : "Camada rejeitada."
            });
        }
        catch (erro) {
            Fastify.log.warn(erro);

            return reply.status(500).send({
                status: 'erro',
                mensagem: "Erro interno no servidor."
            })
        }

    });
};

export { patch_layer_status };