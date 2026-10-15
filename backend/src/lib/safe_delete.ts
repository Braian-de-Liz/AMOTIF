import type { FastifyInstance } from "fastify";
import { isPathOwnedBy, safeExtractPath } from "./storage_path.js";

interface AudioRef {
    url: string | null | undefined;
    ownerId: string;
}

function collectDeletablePaths(Fastify: FastifyInstance, refs: AudioRef[]): string[] {
    const paths = new Set<string>();

    for (const { url, ownerId } of refs) {
        if (!url) continue;

        const path = safeExtractPath(url);

        if (!path || !isPathOwnedBy(path, ownerId)) {
            Fastify.log.warn(`Storage: arquivo ignorado na deleção (fora do diretório do dono ${ownerId}): ${url}`);
            continue;
        }

        paths.add(path);
    }

    return [...paths];
}

/**
 * Apaga os arquivos em "melhor esforço": uma falha não interrompe os demais nem a operação de quem chamou.
 * Deve rodar DEPOIS da alteração no banco, para que um erro do Storage nunca deixe o registro vivo com áudio já apagado.
 * Devolve os paths que não puderam ser apagados (ficam órfãos no bucket e são registrados no log).
 */
async function deleteOwnedAudios(Fastify: FastifyInstance, refs: AudioRef[]): Promise<string[]> {
    const falhas: string[] = [];

    for (const path of collectDeletablePaths(Fastify, refs)) {
        try {
            await Fastify.storage.deleteAudio(path);
        } catch (err) {
            falhas.push(path);
            Fastify.log.error(`Storage: falha ao apagar ${path} (ficou órfão no bucket): ${err}`);
        }
    }

    return falhas;
}

export { deleteOwnedAudios, collectDeletablePaths, type AudioRef };
