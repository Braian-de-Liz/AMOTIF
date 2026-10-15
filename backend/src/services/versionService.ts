import { Prisma, PrismaClient } from "@prisma/client";

type Db = PrismaClient | Prisma.TransactionClient;

interface VersionData {
    audio_url: string;
    nome_trilha: string;
    instrumento_tag: string;
    delay_offset: number;
    volume_padrao: number;
    /** null = mesmo BPM do projeto. */
    bpm_original?: number | null;
    transposicao_semitons?: number;
}

interface CreateVersionData extends VersionData {
    mensagem?: string;
    tag?: string;
}

// Executa fn numa transação; se já estamos dentro de uma, reaproveita o client recebido.
async function runInTransaction<T>(prisma: Db, fn: (tx: Prisma.TransactionClient) => Promise<T>): Promise<T> {
    if ("$transaction" in prisma) {
        return prisma.$transaction(fn);
    }
    return fn(prisma);
}

// Trava a linha da camada até o fim da transação, serializando a geração de versionNumber.
async function lockCamada(tx: Prisma.TransactionClient, camadaId: string) {
    await tx.$queryRaw`SELECT id FROM "Camada" WHERE id = ${camadaId}::uuid FOR NO KEY UPDATE`;
}

async function getNextVersionNumber(prisma: Db, camadaId: string): Promise<number> {
    const lastVersion = await prisma.layerVersion.findFirst({
        where: { camadaId },
        orderBy: { versionNumber: 'desc' },
        select: { versionNumber: true }
    });
    return (lastVersion?.versionNumber ?? 0) + 1;
}

async function createVersion(
    prisma: Db,
    camadaId: string,
    userId: string,
    data: CreateVersionData,
    versionNumber?: number
) {
    return runInTransaction(prisma, async (tx) => {
        await lockCamada(tx, camadaId);
        const number = versionNumber ?? await getNextVersionNumber(tx, camadaId);

        const version = await tx.layerVersion.create({
            data: {
                camadaId,
                audio_url: data.audio_url,
                nome_trilha: data.nome_trilha,
                instrumento_tag: data.instrumento_tag,
                delay_offset: data.delay_offset,
                volume_padrao: data.volume_padrao,
                bpm_original: data.bpm_original ?? null,
                transposicao_semitons: data.transposicao_semitons ?? 0,
                versionNumber: number,
                mensagem: data.mensagem || `Versão ${number}`,
                tag: data.tag,
                autorId: userId
            }
        });

        await tx.camada.update({
            where: { id: camadaId },
            data: { currentVersionId: version.id }
        });

        return version;
    });
}

async function createInitialVersion(
    prisma: Db,
    camadaId: string,
    userId: string,
    data: VersionData,
    tag?: string
) {
    return createVersion(prisma, camadaId, userId, { ...data, tag }, 1);
}

async function createNewVersion(
    prisma: Db,
    camadaId: string,
    userId: string,
    data: VersionData,
    mensagem?: string,
    tag?: string
) {
    return createVersion(prisma, camadaId, userId, { ...data, mensagem, tag });
}

async function restoreVersionInPlace(
    prisma: Db,
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
            bpm_original: targetVersion.bpm_original,
            transposicao_semitons: targetVersion.transposicao_semitons,
            ...(resetAprovacao ? { esta_aprovada: false } : {})
        }
    });

    return targetVersion;
}

async function rollbackToVersion(prisma: Db, camadaId: string, versionId: string, userId: string) {
    return runInTransaction(prisma, async (tx) => {
        await lockCamada(tx, camadaId);

        const targetVersion = await tx.layerVersion.findUnique({
            where: { id: versionId }
        });

        if (!targetVersion || targetVersion.camadaId !== camadaId) {
            throw new Error("Versão não encontrada nesta camada");
        }

        const camadaAtual = await tx.camada.findUnique({
            where: { id: camadaId },
            select: { audio_url: true, esta_aprovada: true }
        });

        if (!camadaAtual) throw new Error("Camada não encontrada");

        // Voltar para um áudio diferente numa camada aprovada exige nova aprovação do dono do projeto.
        const resetAprovacao = camadaAtual.esta_aprovada && camadaAtual.audio_url !== targetVersion.audio_url;

        const nextVersion = await getNextVersionNumber(tx, camadaId);

        const rollbackVersion = await tx.layerVersion.create({
            data: {
                camadaId,
                audio_url: targetVersion.audio_url,
                nome_trilha: targetVersion.nome_trilha,
                instrumento_tag: targetVersion.instrumento_tag,
                delay_offset: targetVersion.delay_offset,
                volume_padrao: targetVersion.volume_padrao,
                bpm_original: targetVersion.bpm_original,
                transposicao_semitons: targetVersion.transposicao_semitons,
                versionNumber: nextVersion,
                mensagem: `Rollback para versão ${targetVersion.versionNumber}`,
                autorId: userId
            }
        });

        await tx.camada.update({
            where: { id: camadaId },
            data: {
                currentVersionId: rollbackVersion.id,
                audio_url: targetVersion.audio_url,
                nome_trilha: targetVersion.nome_trilha,
                instrumento_tag: targetVersion.instrumento_tag,
                delay_offset: targetVersion.delay_offset,
                volume_padrao: targetVersion.volume_padrao,
                bpm_original: targetVersion.bpm_original,
                transposicao_semitons: targetVersion.transposicao_semitons,
                ...(resetAprovacao ? { esta_aprovada: false } : {})
            }
        });

        return rollbackVersion;
    });
}

async function createManualVersion(
    prisma: Db,
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
            bpm_original: true,
            transposicao_semitons: true,
            currentVersionId: true
        }
    });

    if (!camada) throw new Error("Camada não encontrada");

    return createVersion(prisma, camadaId, userId, {
        audio_url: camada.audio_url,
        nome_trilha: camada.nome_trilha,
        instrumento_tag: camada.instrumento_tag,
        delay_offset: camada.delay_offset,
        volume_padrao: camada.volume_padrao,
        bpm_original: camada.bpm_original,
        transposicao_semitons: camada.transposicao_semitons,
        mensagem: data.mensagem,
        tag: data.tag
    });
}

async function updateVersionTag(
    prisma: Db,
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
