import { describe, test, expect, beforeAll, afterAll } from "bun:test";
import autocannon from "autocannon";
import Fastify from "fastify";
import cors from "@fastify/cors";
import fastifyJwt from "@fastify/jwt";
import multipart from "@fastify/multipart";
import fp from "fastify-plugin";
import type { FastifyInstance } from "fastify";
import { PrismaClient } from "@prisma/client";
import { Upload_Service } from "../src/lib/upload.js";
import { upload_audio } from "../src/routers/upload/upload_point.js";
import { globalErrorHandler } from "../src/lib/global_Error.js";

const originalFetch = globalThis.fetch;

let uploadCallCount = 0;

function mockSupabaseFetch() {
    globalThis.fetch = async (url: string | URL | Request, init?: RequestInit): Promise<Response> => {
        const urlStr = typeof url === "string" ? url : url.toString();

        if (urlStr.includes("/storage/v1/object/")) {
            uploadCallCount++;
            await new Promise((r) => setTimeout(r, 50));

            if (init?.method === "DELETE") {
                return new Response(null, { status: 204 });
            }
            return new Response(JSON.stringify({ Key: "mock-path" }), {
                status: 200,
                headers: { "Content-Type": "application/json" },
            });
        }

        return originalFetch(url, init);
    };
}

const mockPrisma = {
    user: {
        findUnique: async () => ({
            id: "test-user-id",
            nome: "Test User",
            email: "test@test.com",
            senha: "$argon2id$v=19$m=32768,t=2,p=1$test$testhash",
        }),
    },
};

const prismaPlugin = fp(async (fastify: FastifyInstance) => {
    fastify.decorate("prisma", mockPrisma as unknown as PrismaClient);
    fastify.decorate("notiType", {
        INVITE_RECEIVED: "INVITE_RECEIVED",
        INVITE_ACCEPTED: "INVITE_ACCEPTED",
        NEW_LAYER: "NEW_LAYER",
        LAYER_APPROVED: "LAYER_APPROVED",
        PROJECT_REJECT: "PROJECT_REJECT",
        NEW_FOLLOWER: "NEW_FOLLOWER",
        PROJECT_RELEASED: "PROJECT_RELEASED",
        NEW_LIKE: "NEW_LIKE",
    });
});

async function buildApp(): Promise<FastifyInstance> {
    const app = Fastify();

    await app.register(cors, { origin: true });
    await app.register(fastifyJwt, {
        secret: "test-secret-key-for-jwt-signing",
        sign: { expiresIn: "2d" },
    });
    await app.register(multipart, { limits: { fileSize: 40 * 1024 * 1024 } });
    await app.register(prismaPlugin);
    app.setErrorHandler(globalErrorHandler);
    await app.register(Upload_Service);
    app.register(upload_audio, { prefix: "/api" });

    return app;
}

function buildMultipartBody(audioSizeKB: number = 100, filename: string = "test-audio.mp3", ct: string = "audio/mpeg") {
    const boundary = "----PerfBoundary12345";
    const audioData = Buffer.alloc(audioSizeKB * 1024, 0x41);
    const header = Buffer.from(
        `--${boundary}\r\n` +
        `Content-Disposition: form-data; name="audio"; filename="${filename}"\r\n` +
        `Content-Type: ${ct}\r\n\r\n`
    );
    const footer = Buffer.from(`\r\n--${boundary}--\r\n`);

    const body = Buffer.concat([header, audioData, footer]);
    const contentType = `multipart/form-data; boundary=${boundary}`;

    return { body, contentType };
}

function logResultado(r: autocannon.Result, nome: string, connections: number, duration: number) {
    const totalReq = r.requests.total;
    const taxaErro = totalReq > 0 ? (r.non2xx / totalReq) * 100 : 0;

    console.log(`\n  [${nome}] ${connections} conexoes | ${duration}s`);
    console.log(`  ├─ Requisicoes:   ${totalReq} total | ${r.requests.average.toFixed(2)} req/s`);
    console.log(`  ├─ Latencia:      avg=${r.latency.average.toFixed(2)}ms | p50=${r.latency.p50.toFixed(2)}ms | p90=${r.latency.p90.toFixed(2)}ms | p99=${(r.latency.p99 || 0).toFixed(2)}ms | max=${r.latency.max.toFixed(2)}ms`);
    console.log(`  ├─ Throughput:    ${(r.throughput.average / 1024 / 1024).toFixed(2)} MB/s`);
    console.log(`  ├─ Status:        2xx=${r["2xx"]} | 4xx=${r["4xx"]} | 5xx=${r["5xx"]}`);
    console.log(`  └─ Erros:         ${r.errors} | Timeouts: ${r.timeouts}`);
}

describe("Upload Concorrencia - POST /api/upload (autocannon + Mocked Supabase)", () => {
    let app: FastifyInstance;
    let token: string;
    let port: number;

    beforeAll(async () => {
        process.env.SUPABASE_URL = "https://mock.supabase.co";
        process.env.SUPABASE_KEY = "mock-key-for-testing";
        process.env.SUPABASE_BUCKET = "audios-projetos";

        mockSupabaseFetch();
        app = await buildApp();
        await app.listen({ port: 0, host: "127.0.0.1" });
        const addr = app.server.address() as any;
        port = addr.port;

        token = app.jwt.sign({
            id: "test-user-id",
            nome: "Test User",
            email: "test@test.com",
        });
    });

    afterAll(async () => {
        globalThis.fetch = originalFetch;
        await app.close();
    });

    test(
        "Upload 100KB | 20 conexoes, 15s",
        async () => {
            const { body, contentType } = buildMultipartBody(100);

            const resultado = await autocannon({
                url: `http://127.0.0.1:${port}/api/upload`,
                method: "POST",
                connections: 20,
                duration: 15,
                timeout: 30,
                headers: {
                    Authorization: `Bearer ${token}`,
                    "content-type": contentType,
                },
                body,
            });

            logResultado(resultado, "Upload 100KB", 20, 15);
            expect(resultado.non2xx).toBe(0);
            expect(resultado.timeouts).toBe(0);
        },
        30_000,
    );

    test(
        "Upload 1MB | 30 conexoes, 20s",
        async () => {
            const { body, contentType } = buildMultipartBody(1024);

            const resultado = await autocannon({
                url: `http://127.0.0.1:${port}/api/upload`,
                method: "POST",
                connections: 30,
                duration: 20,
                timeout: 30,
                headers: {
                    Authorization: `Bearer ${token}`,
                    "content-type": contentType,
                },
                body,
            });

            logResultado(resultado, "Upload 1MB", 30, 20);
            expect(resultado.non2xx).toBe(0);
            expect(resultado.timeouts).toBe(0);
        },
        40_000,
    );

    test(
        "Upload 5MB | 50 conexoes, 30s",
        async () => {
            const { body, contentType } = buildMultipartBody(5 * 1024);

            const resultado = await autocannon({
                url: `http://127.0.0.1:${port}/api/upload`,
                method: "POST",
                connections: 50,
                duration: 30,
                timeout: 30,
                headers: {
                    Authorization: `Bearer ${token}`,
                    "content-type": contentType,
                },
                body,
            });

            logResultado(resultado, "Upload 5MB", 50, 30);
            expect(resultado.non2xx).toBe(0);
            expect(resultado.timeouts).toBe(0);
        },
        60_000,
    );

    test(
        "Upload 10MB | 50 conexoes, 30s",
        async () => {
            const { body, contentType } = buildMultipartBody(10 * 1024);

            const resultado = await autocannon({
                url: `http://127.0.0.1:${port}/api/upload`,
                method: "POST",
                connections: 50,
                duration: 30,
                timeout: 30,
                headers: {
                    Authorization: `Bearer ${token}`,
                    "content-type": contentType,
                },
                body,
            });

            logResultado(resultado, "Upload 10MB", 50, 30);
            expect(resultado.non2xx).toBe(0);
            expect(resultado.timeouts).toBe(0);
        },
        60_000,
    );

    test(
        "Upload 5MB | 100 conexoes, 30s (stress)",
        async () => {
            const { body, contentType } = buildMultipartBody(5 * 1024);

            const resultado = await autocannon({
                url: `http://127.0.0.1:${port}/api/upload`,
                method: "POST",
                connections: 100,
                duration: 30,
                timeout: 30,
                headers: {
                    Authorization: `Bearer ${token}`,
                    "content-type": contentType,
                },
                body,
            });

            logResultado(resultado, "Upload 5MB Stress", 100, 30);
            expect(resultado.non2xx).toBe(0);
            expect(resultado.timeouts).toBe(0);
        },
        60_000,
    );

    test(
        "Upload 41MB - deve retornar 413 (limite 40MB)",
        async () => {
            const { body, contentType } = buildMultipartBody(41 * 1024);

            const res = await app.inject({
                method: "POST",
                url: "/api/upload",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "content-type": contentType,
                },
                payload: body,
            });

            expect(res.statusCode).toBe(413);
        },
        60_000,
    );
});
