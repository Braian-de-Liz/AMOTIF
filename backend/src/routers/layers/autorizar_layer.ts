import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox';
import { autenticarJWT } from "../../hooks/JWT_verific.js";
import { schema_auth_layer } from "../../schemas/layers/auth_layer.js";
import { papelNoProjeto, pode } from "../../lib/permissoes.js";

const patch_layer_status: FastifyPluginAsyncTypebox = async (Fastify) => {
    Fastify.addHook("onRequest", autenticarJWT);

    Fastify.patch("/layer/:layerId/status", schema_auth_layer, async (request, reply) => {
        const { layerId } = request.params;
        const { aprovada } = request.body;
        const usuarioLogadoId = request.user.id;

        const camada = await Fastify.prisma.camada.findUnique({
            where: { id: layerId },
            select: {
                deletedAt: true,
                projeto: {
                    select: { id: true, userId: true, deletedAt: true }
                }
            }
        });

        if (!camada || camada.deletedAt || camada.projeto.deletedAt) return reply.status(404).send({
            status: 'erro',
            mensagem: "Camada não encontrada"
        });

        // Dono do projeto e produtores decidem o que entra no mix oficial.
        const papel = await papelNoProjeto(Fastify, camada.projeto, usuarioLogadoId);
        if (!pode(papel, "aprovarCamada")) {
            return reply.status(403).send({
                status: 'erro',
                mensagem: "Ação negada: apenas o dono do projeto ou um produtor pode aprovar camadas."
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
    });
};

export { patch_layer_status };
