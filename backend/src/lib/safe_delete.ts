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

async function deleteOwnedAudios(Fastify: FastifyInstance, refs: AudioRef[]): Promise<void> {
    for (const path of collectDeletablePaths(Fastify, refs)) {
        await Fastify.storage.deleteAudio(path);
    }
}

export { deleteOwnedAudios, collectDeletablePaths, type AudioRef };
