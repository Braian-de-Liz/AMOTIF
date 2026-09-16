import { PrismaClient } from "@prisma/client";

const NOTIFICATION_TTL_DAYS = 7;

async function limparConvitesExpirados(prisma: PrismaClient) {
    const { count } = await prisma.convite.deleteMany({
        where: {
            expira_em: { lt: new Date() }
        }
    });

    return count;
}

async function limparNotificacoesLidas(prisma: PrismaClient) {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - NOTIFICATION_TTL_DAYS);

    const { count } = await prisma.notification.deleteMany({
        where: {
            lida: true,
            createdAt: { lt: cutoff }
        }
    });

    return count;
}

async function executarLimpeza(prisma: PrismaClient) {
    const [convitesRemovidos, notificacoesRemovidas] = await prisma.$transaction([
        prisma.convite.deleteMany({
            where: { expira_em: { lt: new Date() } }
        }),
        prisma.notification.deleteMany({
            where: {
                lida: true,
                createdAt: { lt: (() => { const d = new Date(); d.setDate(d.getDate() - NOTIFICATION_TTL_DAYS); return d; })() }
            }
        })
    ]);

    return {
        convitesRemovidos: convitesRemovidos.count,
        notificacoesRemovidas: notificacoesRemovidas.count
    };
}

export { limparConvitesExpirados, limparNotificacoesLidas, executarLimpeza };
