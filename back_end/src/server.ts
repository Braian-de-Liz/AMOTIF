import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { serializerCompiler, validatorCompiler } from 'fastify-type-provider-zod';
import type { FastifyInstance } from 'fastify';
import dotenv from 'dotenv';
dotenv.config();
import fastify from 'fastify';

import prisma_plugin from './lib/prisma.js';


const Fastify: FastifyInstance = fastify().withTypeProvider<ZodTypeProvider>();

Fastify.setValidatorCompiler(validatorCompiler);
Fastify.setSerializerCompiler(serializerCompiler);

Fastify.register(prisma_plugin);



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