import type { FastifyPluginAsync } from "fastify";
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import { autenticarJWT } from "../hooks/JWT_verific.js";
import cookie from '@fastify/cookie';
import cors from '@fastify/cors'
import fastifyJwt from "@fastify/jwt";
import multipart from '@fastify/multipart';
import rate_limite from '@fastify/rate-limit';
import { COOKIE_SECRET, dev, secure_state, sameSite_state } from './config.enviriment.js';
import { health_route } from '../routers/health/health.js';
import { Dados_route } from '../routers/health/dados.js';
import { prisma_plugin, prisma, notiType } from './prisma.js';
import { Upload_Service } from './upload.js';
import { globalErrorHandler } from './global_Error.js';
import { Plugin_Routes } from "../routers/plugin_routes.js";

if (!Bun.env.JWT_PASSWORD) {
    console.error("ERRO FATAL: A variável de ambiente JWT_PASSWORD não foi definida.");
    process.exit(1);
}

const JWT_SECRET: string = Bun.env.JWT_PASSWORD;


const InfraPlugin: FastifyPluginAsync = async (Fastify) => {

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

    await Fastify.register(fastifyJwt, {
        secret: JWT_SECRET,
        sign: { expiresIn: '4h', iss: 'amotif-api', aud: 'amotif-client' }
    });

    Fastify.get('/', async () => {
        return { status: "online", app: "AMOTIF API", docs: "/docs" };
    });




    await Fastify.register(prisma_plugin);
    Fastify.decorate('prisma', prisma);
    Fastify.decorate('notiType', notiType);

    Fastify.setErrorHandler(globalErrorHandler);
    await Fastify.register(Upload_Service);

    await Fastify.register(cors, {
        origin: ["http://localhost:5173", "https://amotif-music.onrender.com", "https://amotif.onrender.com"],
        methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
        credentials: true
    });

    await Fastify.register(multipart, {
        limits: {
            fileSize: 40 * 1024 * 1024
        }
    });

    if (dev === false) {
        await Fastify.register(rate_limite, { max: 60, timeWindow: '1 minute' }); //só ativar em produção
    }


    await Fastify.register(cookie, {
        secret: COOKIE_SECRET,
        parseOptions: {
            sameSite: sameSite_state,
            secure: secure_state
        }
    });



    const DocsPlugin: FastifyPluginAsync = async (Fastify) => {
        Fastify.addHook("onRequest", autenticarJWT);
        await Fastify.register(swaggerUi, { routePrefix: '/docs' });
    };

    await Fastify.register(Dados_route);
    Fastify.register(health_route);
    await Fastify.register(Plugin_Routes, { prefix: '/api' });
    await Fastify.register(DocsPlugin);

}

export { InfraPlugin };