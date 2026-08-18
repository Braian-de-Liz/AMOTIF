import { FastifyInstance } from 'fastify';
import { randomUUID } from 'crypto';

const REFRESH_TOKEN_EXPIRY_DAYS = 7;

async function generateRefreshToken(Fastify: FastifyInstance, userId: string): Promise<string> {
    const token = randomUUID();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + REFRESH_TOKEN_EXPIRY_DAYS);

    await Fastify.prisma.refreshToken.create({
        data: {
            token,
            userId,
            expiresAt
        }
    });

    return token;
}

async function validateRefreshToken(Fastify: FastifyInstance, token: string) {
    const record = await Fastify.prisma.refreshToken.findUnique({
        where: { token },
        include: { user: { select: { id: true, nome_completo: true, email: true } } }
    });

    if (!record) return null;
    if (record.used) {
        await deleteRefreshTokensByUser(Fastify, record.userId);
        return null;
    }
    if (new Date() > record.expiresAt) {
        await Fastify.prisma.refreshToken.delete({ where: { id: record.id } });
        return null;
    }

    return record;
}

async function deleteRefreshToken(Fastify: FastifyInstance, token: string) {
    await Fastify.prisma.refreshToken.deleteMany({ where: { token } });
}

async function deleteRefreshTokensByUser(Fastify: FastifyInstance, userId: string) {
    await Fastify.prisma.refreshToken.deleteMany({ where: { userId } });
}

async function rotateRefreshToken(Fastify: FastifyInstance, oldToken: string) {
    const record = await validateRefreshToken(Fastify, oldToken);
    if (!record) return null;

    await Fastify.prisma.refreshToken.update({
        where: { id: record.id },
        data: { used: true }
    });

    const newToken = await generateRefreshToken(Fastify, record.userId);

    await Fastify.prisma.refreshToken.delete({ where: { id: record.id } });

    return { token: newToken, user: record.user };
}

export { generateRefreshToken, validateRefreshToken, deleteRefreshToken, deleteRefreshTokensByUser, rotateRefreshToken };
