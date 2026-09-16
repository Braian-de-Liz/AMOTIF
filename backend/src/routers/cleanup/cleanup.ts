import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox';
import { autenticarJWT } from "../../hooks/JWT_verific.js";
import { cleanup_schema } from "../../schemas/cleanup/cleanup_schema.js";
import { executarLimpeza } from "../../services/cleanupService.js";

const cleanup_route: FastifyPluginAsyncTypebox = async (Fastify) => {
    Fastify.addHook("onRequest", autenticarJWT);

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
