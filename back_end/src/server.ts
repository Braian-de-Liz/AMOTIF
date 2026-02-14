import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { serializerCompiler, validatorCompiler } from 'fastify-type-provider-zod';
import type { FastifyInstance } from 'fastify';
import cors from "@fastify/cors";
import fastifyJwt from "@fastify/jwt";
import dotenv from 'dotenv';
dotenv.config();
import fastify from 'fastify';

import prisma_plugin from './lib/prisma.js';

import { User_register } from './routers/user/cadastro.js';
import { login_user } from './routers/user/login.js';
import { health_route } from './routers/health/health.js';


if (!process.env.JWT_PASSOWORD) {
    console.error("ERRO FATAL: A variável de ambiente JWT_PASSOWORD não foi definida.");
    process.exit(1);
}

const JWT_PASSOWORD: string = process.env.JWT_PASSOWORD;

const Fastify: FastifyInstance = fastify().withTypeProvider<ZodTypeProvider>();

Fastify.setValidatorCompiler(validatorCompiler);
Fastify.setSerializerCompiler(serializerCompiler);

Fastify.register(prisma_plugin);

Fastify.register(cors, { origin: true });
Fastify.register(fastifyJwt, { secret: JWT_PASSOWORD });

Fastify.register(User_register, {prefix: '/api'});
Fastify.register(login_user, {prefix: '/api'});
Fastify.register(health_route)


const start = async () => {

    

    const port: number = Number(process.env.PORT) || 3333;

    try {
        await Fastify.listen({ port: port });
        console.log("Server started on http://localhost:3333");
    }
    catch (erro) {
        console.error("Erro no servidor: " + erro);
        process.exit(1);
    }
}

start();