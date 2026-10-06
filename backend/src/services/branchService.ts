import { PrismaClient } from "@prisma/client";

interface CreateBranchData {
    nome: string;
    camadaId: string;
    baseVersionId: string;
    userId: string;
}

interface SwitchBranchData {
    camadaId: string;
    branchId: string;
    userId: string;
}

interface MergeBranchData {
    camadaId: string;
    branchId: string;
    userId: string;
    mensagem?: string;
}

async function createBranch(
    prisma: PrismaClient,
    data: CreateBranchData
) {
    const { nome, camadaId, baseVersionId, userId } = data;

    const camada = await prisma.camada.findUnique({
        where: { id: camadaId },
        select: { id: true, currentVersionId: true }
    });

    if (!camada) throw new Error("Camada não encontrada");

    const baseVersion = await prisma.layerVersion.findUnique({
        where: { id: baseVersionId }
    });

    if (!baseVersion || baseVersion.camadaId !== camadaId) {
        throw new Error("Versão base não encontrada nesta camada");
    }

    const existingBranch = await prisma.layerBranch.findUnique({
        where: {
            camadaId_nome: {
                camadaId,
                nome
            }
        }
    });

    if (existingBranch) {
        throw new Error("Já existe uma branch com este nome nesta camada");
    }

    const isFirstBranch = await prisma.layerBranch.count({
        where: { camadaId }
    }) === 0;

    const branch = await prisma.layerBranch.create({
        data: {
            nome,
            camadaId,
            baseVersionId,
            headVersionId: baseVersionId,
            isMain: isFirstBranch,
            createdById: userId
        },
        include: {
            baseVersion: true,
            headVersion: true,
            createdBy: {
                select: { id: true, nome_completo: true, avatar_url: true }
            }
        }
    });

    return branch;
}

async function createMainBranchIfNotExists(
    prisma: PrismaClient,
    camadaId: string,
    userId: string
) {
    const existingMain = await prisma.layerBranch.findFirst({
        where: { camadaId, isMain: true }
    });

    if (existingMain) return existingMain;

    const camada = await prisma.camada.findUnique({
        where: { id: camadaId },
        select: { currentVersionId: true }
    });

    if (!camada || !camada.currentVersionId) {
        throw new Error("Camada não possui versão atual para criar branch main");
    }

    const branch = await prisma.layerBranch.create({
        data: {
            nome: "main",
            camadaId,
            baseVersionId: camada.currentVersionId,
            headVersionId: camada.currentVersionId,
            isMain: true,
            createdById: userId
        },
        include: {
            baseVersion: true,
            headVersion: true,
            createdBy: {
                select: { id: true, nome_completo: true, avatar_url: true }
            }
        }
    });

    return branch;
}

async function listBranches(
    prisma: PrismaClient,
    camadaId: string
) {
    const branches = await prisma.layerBranch.findMany({
        where: { camadaId },
        orderBy: { isMain: 'desc' },
        include: {
            baseVersion: {
                select: { id: true, versionNumber: true, createdAt: true }
            },
            headVersion: {
                select: { id: true, versionNumber: true, createdAt: true }
            },
            createdBy: {
                select: { id: true, nome_completo: true, avatar_url: true }
            }
        }
    });

    return branches.map(b => ({
        id: b.id,
        nome: b.nome,
        camadaId: b.camadaId,
        isMain: b.isMain,
        baseVersion: b.baseVersion,
        headVersion: b.headVersion,
        createdBy: b.createdBy,
        createdAt: b.createdAt.toISOString(),
        updatedAt: b.updatedAt.toISOString()
    }));
}

async function switchBranch(
    prisma: PrismaClient,
    data: SwitchBranchData
) {
    const { camadaId, branchId, userId } = data;

    const branch = await prisma.layerBranch.findUnique({
        where: { id: branchId },
        include: { headVersion: true }
    });

    if (!branch || branch.camadaId !== camadaId) {
        throw new Error("Branch não encontrada nesta camada");
    }

    const headVersion = branch.headVersion;

    const camadaAtual = await prisma.camada.findUnique({
        where: { id: camadaId },
        select: { audio_url: true, esta_aprovada: true }
    });

    if (!camadaAtual) throw new Error("Camada não encontrada");

    const resetAprovacao = camadaAtual.esta_aprovada && 
        camadaAtual.audio_url !== headVersion.audio_url;

    await prisma.camada.update({
        where: { id: camadaId },
        data: {
            currentVersionId: headVersion.id,
            audio_url: headVersion.audio_url,
            nome_trilha: headVersion.nome_trilha,
            instrumento_tag: headVersion.instrumento_tag,
            delay_offset: headVersion.delay_offset,
            volume_padrao: headVersion.volume_padrao,
            ...(resetAprovacao ? { esta_aprovada: false } : {})
        }
    });

    return headVersion;
}

async function mergeBranch(
    prisma: PrismaClient,
    data: MergeBranchData
) {
    const { camadaId, branchId, userId, mensagem } = data;

    const branch = await prisma.layerBranch.findUnique({
        where: { id: branchId },
        include: { 
            headVersion: true,
            baseVersion: true
        }
    });

    if (!branch || branch.camadaId !== camadaId) {
        throw new Error("Branch não encontrada nesta camada");
    }

    if (branch.isMain) {
        throw new Error("Não é possível fazer merge na branch principal");
    }

    const mainBranch = await prisma.layerBranch.findFirst({
        where: { camadaId, isMain: true },
        include: { headVersion: true }
    });

    if (!mainBranch) {
        throw new Error("Branch principal não encontrada");
    }

    const headVersion = branch.headVersion;
    const mainHeadVersion = mainBranch.headVersion;

    const nextVersionNumber = mainHeadVersion.versionNumber + 1;

    const mergeVersion = await prisma.layerVersion.create({
        data: {
            camadaId,
            audio_url: headVersion.audio_url,
            nome_trilha: headVersion.nome_trilha,
            instrumento_tag: headVersion.instrumento_tag,
            delay_offset: headVersion.delay_offset,
            volume_padrao: headVersion.volume_padrao,
            versionNumber: nextVersionNumber,
            mensagem: mensagem || `Merge de '${branch.nome}' para main`,
            autorId: userId
        }
    });

    await prisma.layerBranch.update({
        where: { id: mainBranch.id },
        data: { headVersionId: mergeVersion.id }
    });

    const camadaAtual = await prisma.camada.findUnique({
        where: { id: camadaId },
        select: { audio_url: true, esta_aprovada: true }
    });

    if (!camadaAtual) throw new Error("Camada não encontrada");

    const resetAprovacao = camadaAtual.esta_aprovada && 
        camadaAtual.audio_url !== headVersion.audio_url;

    await prisma.camada.update({
        where: { id: camadaId },
        data: {
            currentVersionId: mergeVersion.id,
            audio_url: headVersion.audio_url,
            nome_trilha: headVersion.nome_trilha,
            instrumento_tag: headVersion.instrumento_tag,
            delay_offset: headVersion.delay_offset,
            volume_padrao: headVersion.volume_padrao,
            ...(resetAprovacao ? { esta_aprovada: false } : {})
        }
    });

    return mergeVersion;
}

async function deleteBranch(
    prisma: PrismaClient,
    camadaId: string,
    branchId: string,
    userId: string
) {
    const branch = await prisma.layerBranch.findUnique({
        where: { id: branchId }
    });

    if (!branch || branch.camadaId !== camadaId) {
        throw new Error("Branch não encontrada nesta camada");
    }

    if (branch.isMain) {
        throw new Error("Não é possível excluir a branch principal");
    }

    if (branch.createdById !== userId) {
        const camada = await prisma.camada.findUnique({
            where: { id: camadaId },
            select: { userId: true }
        });
        if (!camada || camada.userId !== userId) {
            throw new Error("Apenas o criador da branch ou o dono da camada pode excluí-la");
        }
    }

    await prisma.layerBranch.delete({
        where: { id: branchId }
    });

    return { success: true };
}

async function getBranch(
    prisma: PrismaClient,
    branchId: string
) {
    const branch = await prisma.layerBranch.findUnique({
        where: { id: branchId },
        include: {
            baseVersion: true,
            headVersion: true,
            createdBy: {
                select: { id: true, nome_completo: true, avatar_url: true }
            }
        }
    });

    return branch;
}

export {
    createBranch,
    listBranches,
    switchBranch,
    mergeBranch,
    deleteBranch,
    getBranch,
    createMainBranchIfNotExists
};