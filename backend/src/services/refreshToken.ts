import { FastifyInstance } from 'fastify';
import { randomUUID } from 'crypto';

const REFRESH_TOKEN_EXPIRY_DAYS = 7;
const REFRESH_TOKEN_EXPIRY_MS = REFRESH_TOKEN_EXPIRY_DAYS * 24 * 60 * 60 * 1000;

// Duas abas renovando ao mesmo tempo apresentam o mesmo token. Dentro dessa janela o segundo uso
// é tratado como corrida legítima; fora dela, como token roubado.
const REUSE_GRACE_MS = 10_000;

type RotateResult =
    | { kind: 'rotated'; token: string; user: { id: string; nome_completo: string; email: string } }
    | { kind: 'concurrent' }
    | { kind: 'invalid' };

async function generateRefreshToken(Fastify: FastifyInstance, userId: string): Promise<string> {
    const token = randomUUID();
    const expiresAt = new Date(Date.now() + REFRESH_TOKEN_EXPIRY_MS);

    await Fastify.prisma.refreshToken.create({
        data: {
            token,
            userId,
            expiresAt
        }
    });

    return token;
}

async function deleteRefreshToken(Fastify: FastifyInstance, token: string) {
    await Fastify.prisma.refreshToken.deleteMany({ where: { token } });
}

async function deleteRefreshTokensByUser(Fastify: FastifyInstance, userId: string) {
    await Fastify.prisma.refreshToken.deleteMany({ where: { userId } });
}

async function rotateRefreshToken(Fastify: FastifyInstance, oldToken: string): Promise<RotateResult> {
    return await Fastify.prisma.$transaction(async (tx): Promise<RotateResult> => {
        const record = await tx.refreshToken.findUnique({
            where: { token: oldToken },
            include: { user: { select: { id: true, nome_completo: true, email: true } } }
        });

        if (!record) return { kind: 'invalid' };

        if (record.used) {
            const usadoHa = record.usedAt ? Date.now() - record.usedAt.getTime() : Infinity;
            if (usadoHa <= REUSE_GRACE_MS) return { kind: 'concurrent' };

            // Token já rotacionado reapresentado fora da janela: possível roubo, encerra todas as sessões.
            await tx.refreshToken.deleteMany({ where: { userId: record.userId } });
            return { kind: 'invalid' };
        }

        if (new Date() > record.expiresAt) {
            await tx.refreshToken.delete({ where: { id: record.id } });
            return { kind: 'invalid' };
        }

        // Reivindicação atômica: só uma requisição consegue virar used=true.
        const reivindicado = await tx.refreshToken.updateMany({
            where: { id: record.id, used: false },
            data: { used: true, usedAt: new Date() }
        });
        if (reivindicado.count === 0) return { kind: 'concurrent' };

        const newToken = randomUUID();

        await tx.refreshToken.create({
            data: {
                token: newToken,
                userId: record.userId,
                expiresAt: new Date(Date.now() + REFRESH_TOKEN_EXPIRY_MS)
            }
        });

        return { kind: 'rotated', token: newToken, user: record.user };
    });
}

export { generateRefreshToken, deleteRefreshToken, deleteRefreshTokensByUser, rotateRefreshToken, REFRESH_TOKEN_EXPIRY_DAYS };
export type { RotateResult };
