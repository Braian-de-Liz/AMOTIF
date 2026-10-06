import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox';
import { autenticarJWT } from "../../hooks/JWT_verific.js";
import { verificar_autor_ou_dono_layer } from '../../hooks/verificar_dono_layer.js';
import { restore_schema } from "../../schemas/versions/restore_schema.js";
import { restoreVersionInPlace } from "../../services/versionService.js";

const restore_route: FastifyPluginAsyncTypebox = async (Fastify) => {
    Fastify.addHook("onRequest", autenticarJWT);
    Fastify.addHook("preHandler", verificar_autor_ou_dono_layer);

    Fastify.patch("/layer/:id/restore/:versionId", restore_schema, async (request, reply) => {
        const { id, versionId } = request.params;
        const userId = request.user.id;

        try {
            const versao = await restoreVersionInPlace(Fastify.prisma, id, versionId, userId);

            return reply.status(200).send({
                status: "sucesso",
                mensagem: `Vers\u00e3o ${versao.versionNumber} restaurada (in-place)`,
                versao: {
                    id: versao.id,
                    versionNumber: versao.versionNumber,
                    mensagem: versao.mensagem,
                    createdAt: versao.createdAt.toISOString()
                }
            });
        } catch (err) {
            const message = err instanceof Error ? err.message : "Erro ao restaurar vers\u00e3o";
            return reply.status(400).send({
                status: "erro",
                mensagem: message
            });
        }
    });
};

export { restore_route };