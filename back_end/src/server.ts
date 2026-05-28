import fastify from 'fastify';
import type { TypeBoxTypeProvider } from '@fastify/type-provider-typebox';
import cors from "@fastify/cors";
import fastifyJwt from "@fastify/jwt";
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';

import { prisma_plugin } from './lib/prisma.js';
import { globalErrorHandler } from './lib/global_Error.js';
import { Plugin_Routes } from './routers/plugin_routes.js';
import { health_route } from './routers/health/health.js';


if (!Bun.env.JWT_PASSOWORD) {
    console.error("ERRO FATAL: A variável de ambiente JWT_PASSOWORD não foi definida.");
    process.exit(1);
}

const JWT_PASSOWORD: string = Bun.env.JWT_PASSOWORD;

const Fastify = fastify(/* { logger: true } */).withTypeProvider<TypeBoxTypeProvider>();

await Fastify.register(swagger, {
    openapi: {
        info: {
            title: 'AMOTIF API',
            description: "Documentação da plataforma de colaboração musical AMOTIF, API documentada através do plugin oficial do Swagger para Fastify",
            version: '1.0.0',
        },
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT',
                },
            },
        },
    }
});

await Fastify.register(swaggerUi, { routePrefix: '/docs', });

await Fastify.register(prisma_plugin);

Fastify.setErrorHandler(globalErrorHandler);

await Fastify.register(cors, { origin: true });
await Fastify.register(fastifyJwt, { secret: JWT_PASSOWORD, sign: { expiresIn: '2d' } });

Fastify.register(Plugin_Routes);
Fastify.register(health_route);

const start = async () => {
    const port: number = Number(Bun.env.PORT) || 3333;

    try {
        await Fastify.ready();
        await Fastify.listen({ port: port, host: '0.0.0.0' });

        const usedMemory = process.memoryUsage();
        const heapUsedMB = (usedMemory.heapUsed / 1024 / 1024).toFixed(4);
        const rssMB = (usedMemory.rss / 1024 / 1024).toFixed(4);
        const bootTime = process.uptime().toFixed(3);

        console.log(`
            AMOTIF Back-end Online!
            -----------------------------------------
            URL: http://localhost:${port}
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

export { Fastify, start }; 