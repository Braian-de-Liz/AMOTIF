import { PrismaClient } from "@prisma/client";

interface VersionData {
    audio_url: string;
    nome_trilha: string;
    instrumento_tag: string;
    delay_offset: number;
    volume_padrao: number;
}

interface CreateVersionData extends VersionData {
    mensagem?: string;
    tag?: string;
}

async function getNextVersionNumber(prisma: PrismaClient, camadaId: string): Promise<number> {
    const lastVersion = await prisma.layerVersion.findFirst({
        where: { camadaId },
        orderBy: { versionNumber: 'desc' },
        select: { versionNumber: true }
    });
    return (lastVersion?.versionNumber ?? 0) + 1;
}

async function createVersion(
    prisma: PrismaClient,
    camadaId: string,
    userId: string,
    data: CreateVersionData,
    versionNumber: number
) {
    const version = await prisma.layerVersion.create({
        data: {
            camadaId,
            audio_url: data.audio_url,
            nome_trilha: data.nome_trilha,
            instrumento_tag: data.instrumento_tag,
            delay_offset: data.delay_offset,
            volume_padrao: data.volume_padrao,
            versionNumber,
            mensagem: data.mensagem || `Versão ${versionNumber}`,
            tag: data.tag,
            autorId: userId
        }
    });

    await prisma.camada.update({
        where: { id: camadaId },
        data: { currentVersionId: version.id }
    });

    return version;
}

async function createInitialVersion(
    prisma: PrismaClient,
    camadaId: string,
    userId: string,
    data: VersionData,
    tag?: string
) {
    const version = await createVersion(prisma, camadaId, userId, { ...data, tag }, 1);
    return version;
}

async function createNewVersion(
    prisma: PrismaClient,
    camadaId: string,
    userId: string,
    data: VersionData,
    mensagem?: string,
    tag?: string
) {
    const nextVersion = await getNextVersionNumber(prisma, camadaId);

    const version = await createVersion(prisma, camadaId, userId, { ...data, mensagem, tag }, nextVersion);

    return version;
}

async function restoreVersionInPlace(
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

    const camadaAtual = await prisma.camada.findUnique({
        where: { id: camadaId },
        select: { audio_url: true, esta_aprovada: true }
    });

    if (!camadaAtual) throw new Error("Camada não encontrada");

    const resetAprovacao = camadaAtual.esta_aprovada &&
        camadaAtual.audio_url !== targetVersion.audio_url;

    await prisma.camada.update({
        where: { id: camadaId },
        data: {
            currentVersionId: targetVersion.id,
            audio_url: targetVersion.audio_url,
            nome_trilha: targetVersion.nome_trilha,
            instrumento_tag: targetVersion.instrumento_tag,
            delay_offset: targetVersion.delay_offset,
            volume_padrao: targetVersion.volume_padrao,
            ...(resetAprovacao ? { esta_aprovada: false } : {})
        }
    });

    return targetVersion;
}

async function rollbackToVersion(prisma: PrismaClient, camadaId: string, versionId: string, userId: string) {
    
    const targetVersion = await prisma.layerVersion.findUnique({
        where: { id: versionId }
    });

    if (!targetVersion || targetVersion.camadaId !== camadaId) {
        throw new Error("Versão não encontrada nesta camada");
    }

    const camadaAtual = await prisma.camada.findUnique({
        where: { id: camadaId },
        select: { audio_url: true, esta_aprovada: true }
    });

    if (!camadaAtual) throw new Error("Camada não encontrada");

    // Voltar para um áudio diferente numa camada aprovada exige nova aprovação do dono do projeto.
    const resetAprovacao = camadaAtual.esta_aprovada && camadaAtual.audio_url !== targetVersion.audio_url;

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
            volume_padrao: targetVersion.volume_padrao,
            ...(resetAprovacao ? { esta_aprovada: false } : {})
        }
    });

    return rollbackVersion;
}

async function createManualVersion(
    prisma: PrismaClient,
    camadaId: string,
    userId: string,
    data: { mensagem?: string; tag?: string }
) {
    const camada = await prisma.camada.findUnique({
        where: { id: camadaId },
        select: { 
            audio_url: true, 
            nome_trilha: true, 
            instrumento_tag: true, 
            delay_offset: true, 
            volume_padrao: true,
            currentVersionId: true
        }
    });

    if (!camada) throw new Error("Camada não encontrada");

    const nextVersion = await getNextVersionNumber(prisma, camadaId);

    const version = await createVersion(prisma, camadaId, userId, {
        audio_url: camada.audio_url,
        nome_trilha: camada.nome_trilha,
        instrumento_tag: camada.instrumento_tag,
        delay_offset: camada.delay_offset,
        volume_padrao: camada.volume_padrao,
        mensagem: data.mensagem,
        tag: data.tag
    }, nextVersion);

    return version;
}

async function updateVersionTag(
    prisma: PrismaClient,
    camadaId: string,
    versionId: string,
    tag: string | null
) {
    const version = await prisma.layerVersion.findUnique({
        where: { id: versionId }
    });

    if (!version || version.camadaId !== camadaId) {
        throw new Error("Versão não encontrada nesta camada");
    }

    const updated = await prisma.layerVersion.update({
        where: { id: versionId },
        data: { tag }
    });

    return updated;
}

export {
    createInitialVersion,
    createNewVersion,
    rollbackToVersion,
    restoreVersionInPlace,
    getNextVersionNumber,
    createManualVersion,
    updateVersionTag
};
