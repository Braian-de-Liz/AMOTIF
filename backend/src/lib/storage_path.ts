
interface StorageConfig {
    supabaseUrl: string;
    bucket: string;
}

const DEFAULT_BUCKET = "audios-projetos";

const SAFE_SEGMENT = /^[A-Za-z0-9._-]+$/;

function getStorageConfig(cfg?: Partial<StorageConfig>): StorageConfig | null {
    const supabaseUrl = cfg?.supabaseUrl ?? Bun.env.SUPABASE_URL;
    const bucket = cfg?.bucket ?? Bun.env.SUPABASE_BUCKET ?? DEFAULT_BUCKET;

    if (!supabaseUrl || !bucket) return null;

    return { supabaseUrl: supabaseUrl.replace(/\/+$/, ""), bucket };
}

function getPublicBase(cfg?: Partial<StorageConfig>): string | null {
    const config = getStorageConfig(cfg);
    if (!config) return null;
    return `${config.supabaseUrl}/storage/v1/object/public/${config.bucket}/`;
}

function isSafePath(path: string): boolean {
    if (!path || path.length > 512) return false;

    const segments = path.split("/");

    return segments.every(
        (segment) => segment !== "." && segment !== ".." && SAFE_SEGMENT.test(segment)
    );
}

function getUserPublicPrefix(userId: string, cfg?: Partial<StorageConfig>): string | null {
    const base = getPublicBase(cfg);
    if (!base || !userId || !SAFE_SEGMENT.test(userId)) return null;
    return `${base}${userId}/`;
}

function safeExtractPath(url: string, cfg?: Partial<StorageConfig>): string | null {
    if (typeof url !== "string") return null;

    const base = getPublicBase(cfg);
    if (!base) return null;

    if (!url.startsWith(base)) return null;

    try {
        const parsed = new URL(url);
        const expected = new URL(base);
        if (parsed.origin !== expected.origin) return null;
        if (parsed.search || parsed.hash) return null;
    } catch {
        return null;
    }

    const path = url.slice(base.length);

    return isSafePath(path) ? path : null;
}

function isPathOwnedBy(path: string | null | undefined, userId: string): boolean {
    if (!path || !userId || !SAFE_SEGMENT.test(userId)) return false;
    return isSafePath(path) && path.startsWith(`${userId}/`) && path.length > userId.length + 1;
}

function isOwnedAudioUrl(url: string, userId: string, cfg?: Partial<StorageConfig>): boolean {
    return isPathOwnedBy(safeExtractPath(url, cfg), userId);
}

export {
    getUserPublicPrefix,
    isOwnedAudioUrl,
    safeExtractPath,
    isPathOwnedBy,
    isSafePath,
    type StorageConfig
};
