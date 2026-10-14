import { describe, it, expect } from "bun:test";
import { PUBLIC_BASE, TEST_SUPABASE_URL, TEST_BUCKET, audioUrlFor } from "./helpers/storage_env.js";
import { createUrlSigner, audioSigner } from "../src/lib/signed_urls.js";
import { normalizeAudioUrl, isOwnedAudioUrl } from "../src/lib/storage_path.js";

const USER = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const SIGN_BASE = `${TEST_SUPABASE_URL}/storage/v1/object/sign/${TEST_BUCKET}/`;

function fakeSupabase() {
    const calls: Array<{ url: string; body: any }> = [];
    const fetchFn = (async (url: string, init: any) => {
        const body = JSON.parse(init.body);
        calls.push({ url, body });
        return new Response(
            JSON.stringify(
                body.paths.map((path: string) => ({
                    path,
                    signedURL: `/object/sign/${TEST_BUCKET}/${path}?token=t-${calls.length}`,
                    error: null,
                }))
            ),
            { status: 200 }
        );
    }) as unknown as typeof fetch;
    return { calls, fetchFn };
}

function makeSigner(overrides: any = {}) {
    const fake = fakeSupabase();
    const clock = { t: 1_000_000 };
    const signer = createUrlSigner({
        supabaseUrl: TEST_SUPABASE_URL,
        supabaseKey: "service-key",
        bucket: TEST_BUCKET,
        expiresIn: 1000,
        fetchFn: fake.fetchFn,
        now: () => clock.t,
        ...overrides,
    });
    return { signer, clock, ...fake };
}

describe("createUrlSigner", () => {
    it("assina em lote com uma única chamada e monta a URL completa", async () => {
        const { signer, calls } = makeSigner();
        const a = audioUrlFor(USER, "a.mp3");
        const b = audioUrlFor(USER, "b.mp3");

        const result = await signer([a, b, a]);

        expect(calls).toHaveLength(1);
        expect(calls[0].url).toBe(`${TEST_SUPABASE_URL}/storage/v1/object/sign/${TEST_BUCKET}`);
        expect(calls[0].body.paths).toEqual([`${USER}/a.mp3`, `${USER}/b.mp3`]);
        expect(calls[0].body.expiresIn).toBe(1000);
        expect(result.get(a)).toBe(`${SIGN_BASE}${USER}/a.mp3?token=t-1`);
        expect(result.get(b)).toBe(`${SIGN_BASE}${USER}/b.mp3?token=t-1`);
    });

    it("reaproveita a assinatura em cache e devolve a mesma URL", async () => {
        const { signer, calls } = makeSigner();
        const url = audioUrlFor(USER, "a.mp3");

        const first = (await signer([url])).get(url);
        const second = (await signer([url])).get(url);

        expect(calls).toHaveLength(1);
        expect(second).toBe(first);
    });

    it("reassina depois que o cache vence (75% da validade)", async () => {
        const { signer, clock, calls } = makeSigner();
        const url = audioUrlFor(USER, "a.mp3");

        const first = (await signer([url])).get(url);
        clock.t += 1000 * 1000 * 0.76;
        const second = (await signer([url])).get(url);

        expect(calls).toHaveLength(2);
        expect(second).not.toBe(first);
    });

    it("só assina o que falta quando parte já está em cache", async () => {
        const { signer, calls } = makeSigner();
        const a = audioUrlFor(USER, "a.mp3");
        const b = audioUrlFor(USER, "b.mp3");

        await signer([a]);
        await signer([a, b]);

        expect(calls).toHaveLength(2);
        expect(calls[1].body.paths).toEqual([`${USER}/b.mp3`]);
    });

    it("devolve URLs de fora do nosso bucket sem chamar o Supabase", async () => {
        const { signer, calls } = makeSigner();
        const externa = "https://example.com/audio.mp3";

        const result = await signer([externa]);

        expect(calls).toHaveLength(0);
        expect(result.get(externa)).toBe(externa);
    });

    it("se o Supabase falhar, devolve a URL original em vez de lançar", async () => {
        const fetchFn = (async () => new Response("erro", { status: 500 })) as unknown as typeof fetch;
        const { signer } = makeSigner({ fetchFn });
        const url = audioUrlFor(USER, "a.mp3");

        const originalError = console.error;
        console.error = () => {};
        try {
            expect((await signer([url])).get(url)).toBe(url);
        } finally {
            console.error = originalError;
        }
    });

    it("mantém a URL original dos itens que o Supabase recusou", async () => {
        const fetchFn = (async (_url: string, init: any) => {
            const body = JSON.parse(init.body);
            return new Response(
                JSON.stringify(
                    body.paths.map((path: string) => ({ path, signedURL: null, error: "Object not found" }))
                ),
                { status: 200 }
            );
        }) as unknown as typeof fetch;
        const { signer } = makeSigner({ fetchFn });
        const url = audioUrlFor(USER, "sumiu.mp3");

        expect((await signer([url])).get(url)).toBe(url);
    });
});

describe("createUrlSigner - resiliência", () => {
    it("requests simultâneos para o mesmo path compartilham uma única chamada e a mesma URL", async () => {
        const { signer, calls } = makeSigner();
        const url = audioUrlFor(USER, "a.mp3");

        const [r1, r2] = await Promise.all([signer([url]), signer([url])]);

        expect(calls).toHaveLength(1);
        expect(r1.get(url)).toBe(r2.get(url));
    });

    it("divide lotes grandes em várias chamadas de até 100 paths", async () => {
        const { signer, calls } = makeSigner();
        const urls = Array.from({ length: 250 }, (_, i) => audioUrlFor(USER, `f${i}.mp3`));

        const result = await signer(urls);

        expect(calls.map(c => c.body.paths.length)).toEqual([100, 100, 50]);
        expect(result.size).toBe(250);
    });

    it("após uma falha, não repete a chamada durante o intervalo de espera", async () => {
        let attempts = 0;
        const fetchFn = (async () => {
            attempts += 1;
            throw new Error("rede fora");
        }) as unknown as typeof fetch;
        const { signer, clock } = makeSigner({ fetchFn });
        const url = audioUrlFor(USER, "a.mp3");

        const originalError = console.error;
        console.error = () => {};
        try {
            expect((await signer([url])).get(url)).toBe(url);
            expect((await signer([url])).get(url)).toBe(url);
            expect(attempts).toBe(1);

            clock.t += 6000;
            await signer([url]);
            expect(attempts).toBe(2);
        } finally {
            console.error = originalError;
        }
    });

    it("envia um sinal de timeout na chamada ao Supabase", async () => {
        let signal: AbortSignal | undefined;
        const fetchFn = (async (_url: string, init: any) => {
            signal = init.signal;
            return new Response("[]", { status: 200 });
        }) as unknown as typeof fetch;
        const { signer } = makeSigner({ fetchFn });

        await signer([audioUrlFor(USER, "a.mp3")]);

        expect(signal).toBeInstanceOf(AbortSignal);
    });
});

describe("audioSigner", () => {
    it("sem storage devolve as URLs sem alteração", async () => {
        const sign = await audioSigner(undefined, [audioUrlFor(USER)]);
        expect(sign(audioUrlFor(USER))).toBe(audioUrlFor(USER));
    });

    it("ignora valores vazios e usa o signUrls do storage", async () => {
        const url = audioUrlFor(USER, "a.mp3");
        const storage = { signUrls: async (urls: string[]) => new Map(urls.map(u => [u, `${u}?signed`])) };

        const sign = await audioSigner(storage, [url, null, undefined, ""]);

        expect(sign(url)).toBe(`${url}?signed`);
        expect(sign("https://outra.com/x.mp3")).toBe("https://outra.com/x.mp3");
    });
});

describe("normalizeAudioUrl", () => {
    it("converte URL assinada na URL canônica e passa na validação de posse", () => {
        const signed = `${SIGN_BASE}${USER}/a.mp3?token=abc.def.ghi`;

        const canonical = normalizeAudioUrl(signed);

        expect(canonical).toBe(`${PUBLIC_BASE}${USER}/a.mp3`);
        expect(isOwnedAudioUrl(canonical, USER)).toBe(true);
    });

    it("mantém a URL canônica como está", () => {
        const url = audioUrlFor(USER, "a.mp3");
        expect(normalizeAudioUrl(url)).toBe(url);
    });

    it("não converte URL assinada de outro host nem de outro bucket", () => {
        const outroHost = `https://evil.example.com/storage/v1/object/sign/${TEST_BUCKET}/${USER}/a.mp3?token=x`;
        const outroBucket = `${TEST_SUPABASE_URL}/storage/v1/object/sign/outro-bucket/${USER}/a.mp3?token=x`;

        expect(normalizeAudioUrl(outroHost)).toBe(outroHost);
        expect(normalizeAudioUrl(outroBucket)).toBe(outroBucket);
        expect(isOwnedAudioUrl(normalizeAudioUrl(outroHost), USER)).toBe(false);
    });

    it("recusa path com traversal", () => {
        const traversal = `${SIGN_BASE}${USER}/../outro/a.mp3?token=x`;

        expect(normalizeAudioUrl(traversal)).toBe(traversal);
        expect(isOwnedAudioUrl(normalizeAudioUrl(traversal), USER)).toBe(false);
    });

    it("uma URL assinada de outro usuário continua sendo recusada pela posse", () => {
        const doOutro = `${SIGN_BASE}bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb/a.mp3?token=x`;

        expect(isOwnedAudioUrl(normalizeAudioUrl(doOutro), USER)).toBe(false);
    });
});
