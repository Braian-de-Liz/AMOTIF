import fastify from 'fastify';
import type { TypeBoxTypeProvider } from '@fastify/type-provider-typebox';
import cors from "@fastify/cors";
import cookie from '@fastify/cookie';
import fastifyJwt from "@fastify/jwt";
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import multipart from '@fastify/multipart';
import rate_limite from '@fastify/rate-limit';

import { prisma_plugin } from './lib/prisma.js';
import { Upload_Service } from './lib/upload.js';
import { globalErrorHandler } from './lib/global_Error.js';
import { Plugin_Routes } from './routers/plugin_routes.js';
import { health_route } from './routers/health/health.js';

if (!Bun.env.JWT_PASSWORD) {
    console.error("ERRO FATAL: A variável de ambiente JWT_PASSWORD não foi definida.");
    process.exit(1);
}

const JWT_SECRET: string = Bun.env.JWT_PASSWORD;
const COOKIE_SECRET: string = Bun.env.COOKIE_SECRET || JWT_SECRET;

if (COOKIE_SECRET === JWT_SECRET && !Bun.env.COOKIE_SECRET) {
    console.warn("AVISO: COOKIE_SECRET não definido. Usando JWT_PASSWORD como fallback. Defina COOKIE_SECRET em produção.");
}

const Fastify = fastify({ logger: true }).withTypeProvider<TypeBoxTypeProvider>();


Fastify.get('/', async () => {
    return { status: "online", app: "AMOTIF API", docs: "/docs" };
});

// await Fastify.register(cors, {
//     origin: ["http://localhost:5173", "https://amotif-music.onrender.com/"],
//     methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
//     credentials: true
// });

await Fastify.register(swagger, {
    openapi: {
        info: {
            title: 'AMOTIF API',
            description: "Documentação da plataforma de colaboração musical AMOTIF",
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

await Fastify.register(swaggerUi, { routePrefix: '/docs' });

await Fastify.register(multipart, {
    limits: {
        fileSize: 40 * 1024 * 1024
    }
});

// await Fastify.register(rate_limite, { max: 100, timeWindow: '1 minute' });

Fastify.register(health_route);
await Fastify.register(prisma_plugin);

Fastify.setErrorHandler(globalErrorHandler);
await Fastify.register(Upload_Service);

await Fastify.register(cookie, {
    secret: COOKIE_SECRET,
    parseOptions: {
        sameSite: "none",
        secure: true
    }
});

await Fastify.register(fastifyJwt, {
    secret: JWT_SECRET,
    sign: { expiresIn: '4h', iss: 'amotif-api', aud: 'amotif-client' }
});


Fastify.register(Plugin_Routes, { prefix: "/api" });


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