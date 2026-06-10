import { describe, test, expect, beforeAll } from "bun:test";
import autocannon from "autocannon";

const BASE_URL = Bun.env.BASE_URL || "http://localhost:3333";
const TEST_EMAIL = Bun.env.TEST_EMAIL;
const TEST_PASSWORD = Bun.env.TEST_PASSWORD;

let tokenAutenticado: string;

const payloadValido = {
    projetoId: "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
    timestamp: 1717872234,
    configuracoes: {
        taxaAmostragem: 48000,
        bitrate: 320,
        formato: "wav",
        efeitosAtivos: ["reverb", "delay", "compressor", "limiter"]
    },
    camadasAnalise: [
        {
            id: "123e4567-e89b-12d3-a456-426614174000",
            nomeTrilha: "Vocal Principal - Take 3",
            volume: 0.85,
            delayOffset: -12.5,
            tagsInstrumentos: ["vocal", "lead"],
            metadadosFrequencia: [
                { hz: 60, ganho: -2.5, q: 1.4 },
                { hz: 250, ganho: 1.2, q: 0.7 },
                { hz: 1000, ganho: -0.5, q: 1.0 },
                { hz: 5000, ganho: 3.0, q: 0.5 }
            ]
        },
        {
            id: "789e4567-e89b-12d3-a456-426614174011",
            nomeTrilha: "Guitarra Base L",
            volume: 0.7,
            delayOffset: 4.0,
            tagsInstrumentos: ["guitar", "electric", "rhythm"],
            metadadosFrequencia: [
                { hz: 80, ganho: -12.0, q: 2.0 },
                { hz: 1200, ganho: 2.1, q: 1.2 }
            ]
        }
    ],
    tagsSociais: ["rock", "collaboration", "api-test", "bun-speed"]
};

async function login() {
    const res = await fetch(`${BASE_URL}/api/usuario/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: TEST_EMAIL, senha: TEST_PASSWORD }),
    });

    if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(
            `Login falhou (${res.status}): ${body.mensagem ?? res.statusText}`
        );
    }

    const data = await res.json();
    tokenAutenticado = data.token;
}

beforeAll(async () => {
    if (!TEST_EMAIL || !TEST_PASSWORD) {
        throw new Error(
            "Defina TEST_EMAIL e TEST_PASSWORD no .env ou environment."
        );
    }

    await login();
});

describe("Benchmark - Validação /StronValid", () => {
    test(
        "POST /StronValid | 10000 conexões, 10s",
        async () => {
            const resultado = await autocannon({
                url: `${BASE_URL}/StronValid`,
                connections: 10000,
                duration: 10,
                method: "POST",
                headers: {
                    "content-type": "application/json",
                    authorization: `Bearer ${tokenAutenticado}`,
                },
                body: JSON.stringify(payloadValido),
            });

            expect(resultado.non2xx).toBe(0);

            console.log("-".repeat(50));
            console.log("  [StronValid] Resultados do benchmark");
            console.log("-".repeat(50));
            console.log(`  Requisições/Sec:    ${resultado.requests.average.toFixed(2)}`);
            console.log(`  Latência Média:     ${resultado.latency.average.toFixed(2)}ms`);
            console.log(`  Latência máx:       ${resultado.latency.max.toFixed(2)}ms`);
            console.log(`  Latência P99:       ${(resultado.latency.p99 || 0).toFixed(2)}ms`);
            console.log(`  Throughput (bytes): ${resultado.throughput.average.toFixed(2)}`);
            console.log(`  Erros:              ${resultado.errors}`);
            console.log(`  Timeouts:           ${resultado.timeouts}`);
            console.log("-".repeat(50));
        },
        30000,
    );
});
