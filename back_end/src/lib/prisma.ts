import fp from "fastify-plugin"
import { FastifyPluginAsync } from "fastify"
import { PrismaClient, NotificationType } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import pg from 'pg'

declare module 'fastify' {
    interface FastifyInstance {
        prisma: PrismaClient;
        notiType: typeof NotificationType;
    }
}

const prisma_plugin: FastifyPluginAsync = fp(async (Fastify) => {

    const databaseUrl = Bun.env.DATABASE_URL!;
    if (!databaseUrl) {
        console.error("ERRO FATAL: A variável de ambiente DATABASE_URL não foi definida.");
        process.exit(1);
    }

    const pool = new pg.Pool({
        connectionString: Bun.env.DATABASE_URL!,
        max: 50,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 10000,
    })

    const adapter = new PrismaPg(pool)

    const prisma = new PrismaClient({
        adapter,
        log: ['error', 'warn']
    })

    try {
        await prisma.$connect();

        Fastify.addHook('onClose', async (instance) => {
            await instance.prisma.$disconnect();
            await pool.end();
            console.log("Conexões com o banco encerradas com sucesso.");
        });

        Fastify.decorate('prisma', prisma);
        Fastify.decorate('notiType', NotificationType);

        console.log("NeonDB conectado");

    } catch (error) {
        console.error("Erro ao conectar no Prisma:", error);
        process.exit(1);
    }
});

export { prisma_plugin };