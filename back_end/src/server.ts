// back_end\src\server.ts
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
import fastify from 'fastify';


import prisma_plugin from './lib/prisma.js';

// user routes user
import { User_register } from './routers/user/cadastro.js';
import { login_user } from './routers/user/login.js';
import { Deletar_user } from './routers/user/delete_user.js';
import { health_route } from './routers/health/health.js';
import { Get_user } from './routers/user/get_user.js';
import { Patch_bio } from './routers/user/post_bio.js';
import { Patch_Instrumentos } from './routers/user/instrumentos.js';

// projetos routes projects
import { post_project } from './routers/projetos/create_project.js';
import { del_project } from './routers/projetos/delete_project.js';
import { Get_projects_user } from './routers/projetos/get_projects.js';
import { searth_feed } from './routers/projetos/get_feed.js';

// layers routes
import { create_Layer } from './routers/layers/create_layer.js';

if (!process.env.JWT_PASSOWORD) {
    console.error("ERRO FATAL: A variável de ambiente JWT_PASSOWORD não foi definida.");
    process.exit(1);
}

const JWT_PASSOWORD: string = process.env.JWT_PASSOWORD;

const Fastify: FastifyInstance = fastify({ logger: true }).withTypeProvider<ZodTypeProvider>();

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

Fastify.register(swaggerUi, {
    routePrefix: '/docs',
});

Fastify.register(prisma_plugin);

Fastify.register(cors, { origin: true });
Fastify.register(fastifyJwt, { secret: JWT_PASSOWORD, sign: { expiresIn: '2d' } });

Fastify.register(User_register, { prefix: '/api' });
Fastify.register(login_user, { prefix: '/api' });
Fastify.register(Deletar_user, { prefix: '/api' });
Fastify.register(Get_user, { prefix: '/api' });
Fastify.register(Patch_bio, { prefix: '/api' });
Fastify.register(Patch_Instrumentos, { prefix: '/api' });

Fastify.register(health_route);

Fastify.register(post_project, { prefix: '/api' });
Fastify.register(del_project, { prefix: '/api' });
Fastify.register(Get_projects_user, { prefix: '/api' });
Fastify.register(searth_feed, { prefix: '/api' });

Fastify.register(create_Layer, { prefix: '/api' });

const start = async () => {

    const port: number = Number(process.env.PORT) || 3333;

    try {
        await Fastify.listen({ port: port, host: '0.0.0.0' });
        const memoriaUsada = process.memoryUsage().heapUsed / 1024 / 1024;
        console.log(`Server started on http://localhost:3333`);
        console.log("Server started on http://localhost:3333");
        console.log(`Uso de memória RAM: ${memoriaUsada.toFixed(2)} MB`);
    }

    catch (erro) {
        console.error("Erro no servidor: " + erro);
        process.exit(1);
    }
}

start();