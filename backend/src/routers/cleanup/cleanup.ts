import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox';
import { verificar_cleanup_secret } from "../../hooks/verificar_cleanup_secret.js";
import { cleanup_schema } from "../../schemas/cleanup/cleanup_schema.js";
import { executarLimpeza } from "../../services/cleanupService.js";

const cleanup_route: FastifyPluginAsyncTypebox = async (Fastify) => {
    // Rota de manutenção para cron: exige o header `x-cleanup-secret` (não usa JWT de usuário).
    Fastify.addHook("onRequest", verificar_cleanup_secret);

    Fastify.post("/cleanup", cleanup_schema, async (request, reply) => {
        const resultado = await executarLimpeza(Fastify.prisma);

        return reply.status(200).send({
            status: "sucesso",
            mensagem: "Limpeza executada com sucesso",
            convitesRemovidos: resultado.convitesRemovidos,
            notificacoesRemovidas: resultado.notificacoesRemovidas
        });
    });
};

export { cleanup_route };
