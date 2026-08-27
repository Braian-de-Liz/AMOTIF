// back_end\src\routers\dados.ts
import { FastifyPluginAsync } from "fastify";

const Dados_route: FastifyPluginAsync = async (Fastify) => {

    Fastify.get('/dados', async () => {
        const usedMemory = process.memoryUsage();
        return {
            heapUsedMB: (usedMemory.heapUsed / 1024 / 1024).toFixed(4),
            heapTotalMB: (usedMemory.heapTotal / 1024 / 1024).toFixed(4),
            rssMB: (usedMemory.rss / 1024 / 1024).toFixed(4),
            externalMB: (usedMemory.external / 1024 / 1024).toFixed(4),
            uptimeS: process.uptime().toFixed(3),
        };
    });
};

export { Dados_route };