// Cache em memória do feed. Vive no processo: cada instância tem o seu,
// e nada é compartilhado entre instâncias (sem Redis).
//
// Guarda só a parte compartilhada entre usuários (projetos, autor, contagens,
// paths de áudio ainda não assinados). Os campos por usuário (userHasLiked,
// userHasFavorited) e as URLs assinadas são calculados a cada requisição.

export interface FeedCacheOptions {
    ttlMs?: number;
    maxEntries?: number;
    /** Teto do total guardado, medido pelo tamanho do JSON de cada valor. */
    maxBytes?: number;
    now?: () => number;
}

interface Entry<T> {
    value: T;
    expiraEm: number;
    bytes: number;
}

export interface FeedCache<T> {
    get(key: string): T | undefined;
    set(key: string, value: T): void;
    clear(): void;
    readonly size: number;
    readonly bytes: number;
}

export const FEED_CACHE_TTL_MS = 30_000;
export const FEED_CACHE_MAX_ENTRIES = 100;
export const FEED_CACHE_MAX_BYTES = 8 * 1024 * 1024;

export function createFeedCache<T>(options: FeedCacheOptions = {}): FeedCache<T> {
    const ttlMs = options.ttlMs ?? FEED_CACHE_TTL_MS;
    const maxEntries = options.maxEntries ?? FEED_CACHE_MAX_ENTRIES;
    const maxBytes = options.maxBytes ?? FEED_CACHE_MAX_BYTES;
    const now = options.now ?? Date.now;
    const entries = new Map<string, Entry<T>>();
    let totalBytes = 0;

    const remover = (key: string) => {
        const entry = entries.get(key);
        if (!entry) return;
        totalBytes -= entry.bytes;
        entries.delete(key);
    };

    return {
        get(key) {
            const entry = entries.get(key);
            if (!entry) return undefined;
            if (entry.expiraEm <= now()) {
                remover(key);
                return undefined;
            }
            // Renova a posição (LRU): a entrada usada por último fica por último a sair.
            entries.delete(key);
            entries.set(key, entry);
            return entry.value;
        },

        set(key, value) {
            remover(key);

            const bytes = JSON.stringify(value).length;
            // Um valor maior que o teto inteiro nunca entra: não há como caber.
            if (bytes > maxBytes) return;

            entries.set(key, { value, expiraEm: now() + ttlMs, bytes });
            totalBytes += bytes;

            const agora = now();
            for (const [k, e] of entries) {
                if (e.expiraEm <= agora) remover(k);
            }
            // Acima de qualquer limite: descarta as menos usadas recentemente.
            for (const k of entries.keys()) {
                if (entries.size <= maxEntries && totalBytes <= maxBytes) break;
                remover(k);
            }
        },

        clear() {
            entries.clear();
            totalBytes = 0;
        },

        get size() {
            return entries.size;
        },

        get bytes() {
            return totalBytes;
        },
    };
}
