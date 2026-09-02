import fastify from 'fastify';
import type { TypeBoxTypeProvider } from '@fastify/type-provider-typebox';
import { prisma_plugin } from './lib/prisma.js';
import { InfraPlugin } from './lib/infra_plugins.js';

const Fastify = fastify({ logger: true }).withTypeProvider<TypeBoxTypeProvider>();

await Fastify.register(prisma_plugin);
Fastify.register(InfraPlugin);

const start = async () => {

    const port: number = Number(Bun.env.PORT || process.env.PORT) || 3333;
    const host = '0.0.0.0';

    try {
        await Fastify.ready();
        await Fastify.listen({ port, host });

        const usedMemory = process.memoryUsage();
        const heapUsedMB = (usedMemory.heapUsed / 1024 / 1024).toFixed(4);
        const rssMB = (usedMemory.rss / 1024 / 1024).toFixed(4);
        const bootTime = process.uptime().toFixed(3);

        console.log(`
            AMOTIF Back-end Online!
            -----------------------------------------
            URL: http://${host}:${port}
            port: http://localhost:${port}
            Runtime: ${process.versions.bun ? 'Bun ' + process.versions.bun : 'Node ' + process.version}
            Boot Time: ${bootTime}s
            -----------------------------------------
            Heap Used: ${heapUsedMB} MB
            RSS Memory: ${rssMB} MB
            -----------------------------------------
        `);

    }
    catch (erro) {
        Fastify.log.error("Erro fatal no servidor:");
        console.error(erro);
        process.exit(1);
    }
}

start();
