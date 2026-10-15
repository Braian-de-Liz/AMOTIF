import { describe, test, expect, beforeAll, afterAll, beforeEach } from "bun:test";
import { Readable } from "node:stream";
import Fastify from "fastify";
import fastifyJwt from "@fastify/jwt";
import multipart from "@fastify/multipart";
import fp from "fastify-plugin";
import type { FastifyInstance } from "fastify";
import type { PrismaClient } from "@prisma/client";
import { Upload_Service, MAX_FILE_SIZE } from "../src/lib/upload.js";
import { upload_audio } from "../src/routers/upload/upload_point.js";
import { globalErrorHandler } from "../src/lib/global_Error.js";

const originalFetch = globalThis.fetch;

interface StorageCall { method: string; url: string; bytes: number }
let storageCalls: StorageCall[] = [];

/** Supabase falso: consome o corpo do POST (como o real faria) e registra cada chamada. */
function mockSupabaseFetch() {
    globalThis.fetch = Object.assign(async (url: string | URL | Request, init?: RequestInit): Promise<Response> => {
        const urlStr = typeof url === "string" ? url : url.toString();
        if (!urlStr.includes("/storage/v1/object/")) return originalFetch(url, init);

        const method = init?.method ?? "GET";
        let bytes = 0;
        if (method === "POST" && init?.body) {
            // Lança se o multipart abortar o stream por excesso de tamanho.
            for await (const chunk of init.body as unknown as AsyncIterable<Uint8Array>) {
                bytes += chunk.length;
            }
        }
        storageCalls.push({ method, url: urlStr, bytes });

        if (method === "DELETE") return new Response(null, { status: 200 });
        return new Response(JSON.stringify({ Key: "ok" }), { status: 200 });
    }, { preconnect: async () => {} }) as unknown as typeof globalThis.fetch;
}

const prismaPlugin = fp(async (fastify: FastifyInstance) => {
    fastify.decorate("prisma", {} as unknown as PrismaClient);
});

async function buildApp(): Promise<FastifyInstance> {
    const app = Fastify();
    await app.register(fastifyJwt, { secret: "test-secret-key-for-jwt-signing" });
    await app.register(multipart, { limits: { fileSize: MAX_FILE_SIZE } });
    await app.register(prismaPlugin);
    app.setErrorHandler(globalErrorHandler);
    await app.register(Upload_Service);
    app.register(upload_audio, { prefix: "/api" });
    return app;
}

const BOUNDARY = "----LimitBoundary";
const CONTENT_TYPE = `multipart/form-data; boundary=${BOUNDARY}`;

function partes(tamanho: number) {
    const header = Buffer.from(
        `--${BOUNDARY}\r\n` +
        `Content-Disposition: form-data; name="audio"; filename="take.mp3"\r\n` +
        `Content-Type: audio/mpeg\r\n\r\n`
    );
    const footer = Buffer.from(`\r\n--${BOUNDARY}--\r\n`);
    return { header, footer, tamanho };
}

function corpoBuffer(tamanho: number): Buffer {
    const { header, footer } = partes(tamanho);
    return Buffer.concat([header, Buffer.alloc(tamanho, 0x41), footer]);
}

/** Corpo em stream (sem Content-Length), simulando envio chunked. */
function corpoStream(tamanho: number): Readable {
    const { header, footer } = partes(tamanho);
    const CHUNK = 1024 * 1024;
    let enviado = 0;
    let fase: "header" | "dados" | "footer" | "fim" = "header";
    return new Readable({
        read() {
            if (fase === "header") { fase = "dados"; this.push(header); return; }
            if (fase === "dados") {
                const n = Math.min(CHUNK, tamanho - enviado);
                if (n > 0) { enviado += n; this.push(Buffer.alloc(n, 0x41)); return; }
                fase = "footer";
            }
            if (fase === "footer") { fase = "fim"; this.push(footer); return; }
            this.push(null);
        }
    });
}

describe("POST /api/upload - limite de tamanho", () => {
    let app: FastifyInstance;
    let token: string;

    beforeAll(async () => {
        Bun.env.SUPABASE_URL = "https://mock.supabase.co";
        Bun.env.SUPABASE_KEY = "mock-key";
        Bun.env.SUPABASE_BUCKET = "audios-projetos";
        mockSupabaseFetch();
        app = await buildApp();
        await app.ready();
        token = app.jwt.sign({ id: "user-limite", nome: "Teste", email: "t@t.com" });
    });

    afterAll(async () => {
        globalThis.fetch = originalFetch;
        await app.close();
    });

    beforeEach(() => { storageCalls = []; });

    test("Content-Length acima do limite: 413 sem tocar no bucket", async () => {
        const res = await app.inject({
            method: "POST",
            url: "/api/upload",
            headers: { Authorization: `Bearer ${token}`, "content-type": CONTENT_TYPE },
            payload: corpoBuffer(41 * 1024 * 1024),
        });

        expect(res.statusCode).toBe(413);
        expect(res.json().mensagem).toContain("40MB");
        expect(storageCalls).toHaveLength(0);
    }, 30_000);

    test("Content-Length acima do limite é rejeitado mesmo sem token (antes de ler o corpo)", async () => {
        const res = await app.inject({
            method: "POST",
            url: "/api/upload",
            headers: { "content-type": CONTENT_TYPE },
            payload: corpoBuffer(41 * 1024 * 1024),
        });

        expect(res.statusCode).toBe(413);
        expect(storageCalls).toHaveLength(0);
    }, 30_000);

    test("stream sem Content-Length acima do limite: 413 e objeto parcial removido", async () => {
        const res = await app.inject({
            method: "POST",
            url: "/api/upload",
            headers: { Authorization: `Bearer ${token}`, "content-type": CONTENT_TYPE },
            payload: corpoStream(MAX_FILE_SIZE + 2 * 1024 * 1024),
        });

        expect(res.statusCode).toBe(413);
        expect(res.json().mensagem).toContain("40MB");

        const post = storageCalls.find(c => c.method === "POST");
        const del = storageCalls.find(c => c.method === "DELETE");
        expect(del).toBeDefined();
        // O DELETE aponta para o mesmo objeto que começou a ser enviado.
        if (post) expect(del!.url).toBe(post.url);
        expect(del!.url).toContain("/user-limite/");
    }, 30_000);

    test("arquivo dentro do limite continua funcionando", async () => {
        const res = await app.inject({
            method: "POST",
            url: "/api/upload",
            headers: { Authorization: `Bearer ${token}`, "content-type": CONTENT_TYPE },
            payload: corpoBuffer(2 * 1024 * 1024),
        });

        expect(res.statusCode).toBe(200);
        expect(storageCalls.filter(c => c.method === "DELETE")).toHaveLength(0);
        expect(storageCalls.find(c => c.method === "POST")?.bytes).toBe(2 * 1024 * 1024);
    }, 30_000);
});
