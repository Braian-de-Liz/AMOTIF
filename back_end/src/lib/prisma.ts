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

const prisma_plugin: FastifyPluginAsync = fp(async (fastify) => {

    const pool = new pg.Pool({
        connectionString: process.env.DATABASE_URL,
        max: 10,              
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

        fastify.addHook('onClose', async (instance) => {
            await instance.prisma.$disconnect();
            await pool.end();
            console.log("Conexões com o banco encerradas com sucesso.");
        });

        fastify.decorate('prisma', prisma);
        fastify.decorate('notiType', NotificationType); 
        
        console.log("NeonDB conectado");

    } catch (error) {
        console.error("Erro ao conectar no Prisma:", error);
        process.exit(1);
    }
});

export default prisma_plugin;