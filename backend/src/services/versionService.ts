import { PrismaClient } from "@prisma/client";

interface VersionData {
    audio_url: string;
    nome_trilha: string;
    instrumento_tag: string;
    delay_offset: number;
    volume_padrao: number;
}

async function getNextVersionNumber(prisma: PrismaClient, camadaId: string): Promise<number> {
    const lastVersion = await prisma.layerVersion.findFirst({
        where: { camadaId },
        orderBy: { versionNumber: 'desc' },
        select: { versionNumber: true }
    });
    return (lastVersion?.versionNumber ?? 0) + 1;
}

async function createInitialVersion(
    prisma: PrismaClient,
    camadaId: string,
    userId: string,
    data: VersionData
) {
    const version = await prisma.layerVersion.create({
        data: {
            camadaId,
            audio_url: data.audio_url,
            nome_trilha: data.nome_trilha,
            instrumento_tag: data.instrumento_tag,
            delay_offset: data.delay_offset,
            volume_padrao: data.volume_padrao,
            versionNumber: 1,
            mensagem: "Versão inicial",
            autorId: userId
        }
    });

    await prisma.camada.update({
        where: { id: camadaId },
        data: { currentVersionId: version.id }
    });

    return version;
}

async function createNewVersion(
    prisma: PrismaClient,
    camadaId: string,
    userId: string,
    data: VersionData,
    mensagem?: string
) {
    const camada = await prisma.camada.findUnique({
        where: { id: camadaId },
        select: { currentVersionId: true }
    });

    if (!camada) throw new Error("Camada não encontrada");

    const nextVersion = await getNextVersionNumber(prisma, camadaId);

    const version = await prisma.layerVersion.create({
        data: {
            camadaId,
            audio_url: data.audio_url,
            nome_trilha: data.nome_trilha,
            instrumento_tag: data.instrumento_tag,
            delay_offset: data.delay_offset,
            volume_padrao: data.volume_padrao,
            versionNumber: nextVersion,
            mensagem: mensagem || `Versão ${nextVersion}`,
            autorId: userId
        }
    });

    await prisma.camada.update({
        where: { id: camadaId },
        data: { currentVersionId: version.id }
    });

    return version;
}

async function rollbackToVersion(
    prisma: PrismaClient,
    camadaId: string,
    versionId: string,
    userId: string
) {
    const targetVersion = await prisma.layerVersion.findUnique({
        where: { id: versionId }
    });

    if (!targetVersion || targetVersion.camadaId !== camadaId) {
        throw new Error("Versão não encontrada nesta camada");
    }

    const nextVersion = await getNextVersionNumber(prisma, camadaId);

    const rollbackVersion = await prisma.layerVersion.create({
        data: {
            camadaId,
            audio_url: targetVersion.audio_url,
            nome_trilha: targetVersion.nome_trilha,
            instrumento_tag: targetVersion.instrumento_tag,
            delay_offset: targetVersion.delay_offset,
            volume_padrao: targetVersion.volume_padrao,
            versionNumber: nextVersion,
            mensagem: `Rollback para versão ${targetVersion.versionNumber}`,
            autorId: userId
        }
    });

    await prisma.camada.update({
        where: { id: camadaId },
        data: {
            currentVersionId: rollbackVersion.id,
            audio_url: targetVersion.audio_url,
            nome_trilha: targetVersion.nome_trilha,
            instrumento_tag: targetVersion.instrumento_tag,
            delay_offset: targetVersion.delay_offset,
            volume_padrao: targetVersion.volume_padrao
        }
    });

    return rollbackVersion;
}

export {
    createInitialVersion,
    createNewVersion,
    rollbackToVersion,
    getNextVersionNumber
};
