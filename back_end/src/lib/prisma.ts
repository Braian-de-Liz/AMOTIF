import fp from "fastify-plugin";
import { FastifyPluginAsync } from "fastify";
import { PrismaClient } from "@prisma/client";

declare module 'fastify' {
    interface FastifyInstance {
        prisma: PrismaClient
    }
}

const prisma_plugin: FastifyPluginAsync = fp(async (fastify) => {
    const prisma = new PrismaClient({
        log: ['error', 'warn'],
    });

    try {
        await prisma.$connect();

        fastify.decorate('prisma', prisma);

        fastify.addHook('onClose', async (instance) => {
            await instance.prisma.$disconnect();
        });

        console.log("NeonDB (Prisma) conectado com sucesso!");
    } catch (error) {
        console.error("Erro ao conectar no Prisma:", error);
        process.exit(1);
    }
});

export default prisma_plugin;