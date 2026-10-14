import { safeExtractPath } from "./storage_path.js";

interface SignerConfig {
    supabaseUrl: string;
    supabaseKey: string;
    bucket: string;
    /** Validade da URL assinada, em segundos. */
    expiresIn?: number;
    /** Tempo máximo da chamada de assinatura, em ms. */
    timeoutMs?: number;
    fetchFn?: typeof fetch;
    now?: () => number;
}

interface SignedEntry {
    url: string;
    cacheUntil: number;
}

type UrlSigner = (urls: string[]) => Promise<Map<string, string>>;

const DEFAULT_EXPIRES_IN = 4 * 60 * 60;
const MAX_CACHE_ENTRIES = 5000;
// Reaproveita a assinatura por 75% da validade: a mesma URL volta nas respostas seguintes
// (o player não recarrega) e ainda sobra tempo de uso para quem a recebeu no fim da janela.
const CACHE_RATIO = 0.75;
const DEFAULT_TIMEOUT_MS = 3000;
const FAILURE_BACKOFF_MS = 5000;
const MAX_PATHS_PER_REQUEST = 100;

function resolveSignedUrl(supabaseUrl: string, signedPath: string): string {
    if (/^https?:\/\//i.test(signedPath)) return signedPath;
    if (signedPath.startsWith("/storage/v1")) return `${supabaseUrl}${signedPath}`;
    return `${supabaseUrl}/storage/v1${signedPath.startsWith("/") ? "" : "/"}${signedPath}`;
}

/**
 * Cria a função que troca URLs canônicas (formato público gravado no banco) por URLs assinadas.
 * URLs que não são do nosso bucket, ou que falham ao assinar, voltam como vieram.
 */
function createUrlSigner(config: SignerConfig): UrlSigner {
    const supabaseUrl = config.supabaseUrl.replace(/\/+$/, "");
    const expiresIn = config.expiresIn ?? DEFAULT_EXPIRES_IN;
    const doFetch = config.fetchFn ?? fetch;
    const now = config.now ?? Date.now;
    const timeoutMs = config.timeoutMs ?? DEFAULT_TIMEOUT_MS;
    const cache = new Map<string, SignedEntry>();
    const inflight = new Map<string, Promise<void>>();
    let blockedUntil = 0;

    function prune() {
        if (cache.size <= MAX_CACHE_ENTRIES) return;
        const t = now();
        for (const [path, entry] of cache) {
            if (entry.cacheUntil <= t) cache.delete(path);
        }
        // Ainda cheio: descarta as entradas mais antigas (Map preserva a ordem de inserção).
        for (const path of cache.keys()) {
            if (cache.size <= MAX_CACHE_ENTRIES) break;
            cache.delete(path);
        }
    }

    async function fetchChunk(paths: string[], t: number) {
        try {
            const res = await doFetch(`${supabaseUrl}/storage/v1/object/sign/${config.bucket}`, {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${config.supabaseKey}`,
                    "apikey": config.supabaseKey,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ expiresIn, paths }),
                signal: AbortSignal.timeout(timeoutMs),
            });

            if (!res.ok) throw new Error(`Supabase sign error (${res.status})`);

            const items = (await res.json()) as Array<{ path?: string; signedURL?: string | null; error?: string | null }>;
            for (const item of items) {
                if (!item.path || !item.signedURL || item.error) continue;
                // delete antes de set mantém a ordem do Map como "mais recente por último" (poda LRU).
                cache.delete(item.path);
                cache.set(item.path, {
                    url: resolveSignedUrl(supabaseUrl, item.signedURL),
                    cacheUntil: t + expiresIn * 1000 * CACHE_RATIO,
                });
            }
            prune();
        } catch (err) {
            // Durante uma queda do Supabase, evita repetir a chamada (e somar latência) a cada request.
            blockedUntil = now() + FAILURE_BACKOFF_MS;
            console.error("Falha ao assinar URLs de áudio:", err);
        }
    }

    return async function signUrls(urls: string[]): Promise<Map<string, string>> {
        const result = new Map<string, string>();
        const pathByUrl = new Map<string, string>();
        const t = now();

        for (const url of new Set(urls)) {
            const path = safeExtractPath(url, { supabaseUrl, bucket: config.bucket });
            if (!path) {
                result.set(url, url);
                continue;
            }
            pathByUrl.set(url, path);
        }

        const waiting: Promise<void>[] = [];
        const toFetch: string[] = [];
        for (const [url, path] of pathByUrl) {
            const cached = cache.get(path);
            if (cached && cached.cacheUntil > t) {
                result.set(url, cached.url);
                continue;
            }
            const pending = inflight.get(path);
            if (pending) waiting.push(pending);
            else if (!toFetch.includes(path)) toFetch.push(path);
        }

        if (toFetch.length > 0 && t >= blockedUntil) {
            for (let i = 0; i < toFetch.length; i += MAX_PATHS_PER_REQUEST) {
                const chunk = toFetch.slice(i, i + MAX_PATHS_PER_REQUEST);
                // Requests simultâneos para os mesmos paths compartilham a mesma chamada ao Supabase.
                const promise = fetchChunk(chunk, t).finally(() => {
                    for (const path of chunk) inflight.delete(path);
                });
                for (const path of chunk) inflight.set(path, promise);
                waiting.push(promise);
            }
        }

        await Promise.all(waiting);

        for (const [url, path] of pathByUrl) {
            if (!result.has(url)) result.set(url, cache.get(path)?.url ?? url);
        }

        return result;
    };
}

/**
 * Devolve uma função síncrona url -> url assinada para uso ao montar a resposta.
 * Sem `storage` (ex.: testes que não decoram o Fastify) as URLs passam sem alteração.
 */
async function audioSigner(
    storage: { signUrls?: UrlSigner } | undefined,
    urls: Array<string | null | undefined>
): Promise<(url: string) => string> {
    const list = urls.filter((u): u is string => typeof u === "string" && u.length > 0);
    if (!storage?.signUrls || list.length === 0) return (url) => url;

    const signed = await storage.signUrls(list);
    return (url) => signed.get(url) ?? url;
}

export { createUrlSigner, audioSigner, type UrlSigner, type SignerConfig };
