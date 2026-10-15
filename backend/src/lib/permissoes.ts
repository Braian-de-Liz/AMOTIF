// Papéis efetivos de um usuário dentro de um projeto e o que cada um pode fazer.
// DONO não é um valor do enum PapelColaborador: é quem criou o projeto (Projeto.userId).
import type { FastifyInstance } from "fastify";

type PapelEfetivo = "DONO" | "PRODUTOR" | "MUSICO" | "OUVINTE";

type Acao = "enviarCamada" | "aprovarCamada" | "comentar";

const PERMISSOES: Record<Acao, readonly PapelEfetivo[]> = {
    enviarCamada: ["DONO", "PRODUTOR", "MUSICO"],
    aprovarCamada: ["DONO", "PRODUTOR"],
    comentar: ["DONO", "PRODUTOR", "MUSICO", "OUVINTE"],
};

/** Papel do usuário no projeto, ou null se ele não for dono nem colaborador. */
async function papelNoProjeto(
    Fastify: FastifyInstance,
    projeto: { id: string; userId: string },
    userId: string
): Promise<PapelEfetivo | null> {
    if (projeto.userId === userId) return "DONO";

    const colaborador = await Fastify.prisma.colaborador.findUnique({
        where: { userId_projetoId: { userId, projetoId: projeto.id } },
        select: { papel: true }
    });

    return colaborador?.papel ?? null;
}

function pode(papel: PapelEfetivo | null, acao: Acao): boolean {
    return papel !== null && PERMISSOES[acao].includes(papel);
}

/**
 * Carrega uma camada ativa (camada e projeto não apagados) com o papel do usuário no projeto.
 * Devolve null se a camada não existir para efeitos de API (404).
 */
async function contextoDaCamada(Fastify: FastifyInstance, camadaId: string, userId: string) {
    const camada = await Fastify.prisma.camada.findUnique({
        where: { id: camadaId },
        select: {
            id: true,
            userId: true,
            deletedAt: true,
            nome_trilha: true,
            currentVersion: { select: { versionNumber: true } },
            projeto: { select: { id: true, userId: true, titulo: true, deletedAt: true } }
        }
    });

    if (!camada || camada.deletedAt || !camada.projeto || camada.projeto.deletedAt) return null;

    const papel = await papelNoProjeto(Fastify, camada.projeto, userId);
    return { camada, papel };
}

export { papelNoProjeto, pode, contextoDaCamada, PERMISSOES, type PapelEfetivo, type Acao };
