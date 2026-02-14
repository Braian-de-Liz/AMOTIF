import fp from "fastify-plugin"
import { FastifyPluginAsync } from "fastify"
import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import pg from 'pg'

const prisma_plugin: FastifyPluginAsync = fp(async (fastify) => {

    const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL })
    
    const adapter = new PrismaPg(pool)
    
    const prisma = new PrismaClient({ 
        adapter,
        log: ['error', 'warn'] 
    })

    try {
        await prisma.$connect();

        fastify.decorate('prisma', prisma);
        console.log("NeonDB conectado via Adapter (Prisma 7)!");

    } catch (error) {
        console.error("Erro:", error);
        process.exit(1);
    }
});

export default prisma_plugin;