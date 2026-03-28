// back_end\src\server.ts
import fastify from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { serializerCompiler, validatorCompiler } from 'fastify-type-provider-zod';
import type { FastifyInstance } from 'fastify';
import cors from "@fastify/cors";
import fastifyJwt from "@fastify/jwt";
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import { jsonSchemaTransform } from 'fastify-type-provider-zod';
import dotenv from 'dotenv';
dotenv.config();

import prisma_plugin from './lib/prisma.js';
import { Plugin_Routes } from './routers/plugin_routes.js';
import { health_route } from './routers/health/health.js';


if (!process.env.JWT_PASSOWORD) {
    console.error("ERRO FATAL: A variável de ambiente JWT_PASSOWORD não foi definida.");
    process.exit(1);
}

const JWT_PASSOWORD: string = process.env.JWT_PASSOWORD;

const Fastify: FastifyInstance = fastify(/* { logger: true } */).withTypeProvider<ZodTypeProvider>();

Fastify.setValidatorCompiler(validatorCompiler);
Fastify.setSerializerCompiler(serializerCompiler);

Fastify.register(swagger, {
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
    },
    transform: jsonSchemaTransform,
});

Fastify.register(swaggerUi, { routePrefix: '/docs', });

Fastify.register(prisma_plugin);

Fastify.register(cors, { origin: true });
Fastify.register(fastifyJwt, { secret: JWT_PASSOWORD, sign: { expiresIn: '2d' } });

Fastify.register(Plugin_Routes);
Fastify.register(health_route);

import { monitorEventLoopDelay } from 'perf_hooks';

const start = async () => {
    const port: number = Number(process.env.PORT) || 3333;
    const environment = process.env.NODE_ENV || 'development';

    // Cria um monitor que amostra o delay do loop a cada 10ms
    const histogram = monitorEventLoopDelay({ resolution: 10 });
    histogram.enable();

    try {
        await Fastify.ready();
        await Fastify.listen({ port: port, host: '0.0.0.0' });

        const usedMemory = process.memoryUsage();
        const heapUsedMB = (usedMemory.heapUsed / 1024 / 1024).toFixed(2);
        const rssMB = (usedMemory.rss / 1024 / 1024).toFixed(2); 
        const bootTime = process.uptime().toFixed(2);

        console.log(`
            🚀 AMOTIF Back-end Online!
            -----------------------------------------
            URL: http://localhost:${port}
            Environment: ${environment}
            Runtime: ${process.versions.bun ? 'Bun ' + process.versions.bun : 'Node ' + process.version}
            Boot Time: ${bootTime}s
            -----------------------------------------
            Heap Used: ${heapUsedMB} MB
            RSS Memory: ${rssMB} MB
        
-----------------------------------------
        `);

        Fastify.log.info(`Servidor iniciado na porta ${port}`);

 

    } catch (erro) {
        Fastify.log.error("Erro fatal no servidor:");
        console.error(erro);
        process.exit(1);
    }
}

start();