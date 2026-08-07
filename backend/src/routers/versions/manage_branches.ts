import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox';
import { autenticarJWT } from "../../hooks/JWT_verific.js";
import { rollback_schema } from "../../schemas/versions/rollback_schema.js";
import { rollbackToVersion } from "../../services/versionService.js";

const rollback_route: FastifyPluginAsyncTypebox = async (Fastify) => {
    Fastify.addHook("onRequest", autenticarJWT);

    Fastify.post("/layer/:id/rollback/:versionId", rollback_schema, async (request, reply) => {
        const { id, versionId } = request.params;
        const userId = request.user.id;

        try {
            const versao = await rollbackToVersion(Fastify.prisma, id, versionId, userId);

            return reply.status(200).send({
                status: "sucesso",
                mensagem: `Rollback realizado com sucesso para a versão ${versao.versionNumber}`,
                versao: {
                    id: versao.id,
                    versionNumber: versao.versionNumber,
                    mensagem: versao.mensagem,
                    createdAt: versao.createdAt.toISOString()
                }
            });
        } catch (err) {
            const message = err instanceof Error ? err.message : "Erro ao realizar rollback";
            return reply.status(400).send({
                status: "erro",
                mensagem: message
            });
        }
    });
};

export { rollback_route };
