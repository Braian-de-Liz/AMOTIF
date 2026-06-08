import { expect, test, describe, beforeAll, afterAll } from "bun:test";
import Fastify from "fastify";
import fastifyJwt from "@fastify/jwt";
import { TypeBoxTypeProvider } from "@fastify/type-provider-typebox";
import { Validacao_pesada } from "../src/routers/health/validation.js";

describe("Testes da Rota /StronValid (Benchmark de Validação)", () => {
    let app: any;
    let tokenValido: string;

    beforeAll(async () => {
        app = Fastify().withTypeProvider<TypeBoxTypeProvider>();

        await app.register(fastifyJwt, { secret: "test-secret" });
        await app.register(Validacao_pesada);
        await app.ready();

        tokenValido = app.jwt.sign({ id: "test-id", nome: "Teste", email: "teste@test.com" });
    });

    afterAll(async () => {
        await app.close();
    });

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

    test("Deve retornar 200 OK quando o payload for 100% válido estruturalmente", async () => {
        const response = await app.inject({
            method: "POST",
            url: "/StronValid",
            headers: {
                authorization: `Bearer ${tokenValido}`,
                "content-type": "application/json"
            },
            payload: JSON.stringify(payloadValido)
        });

        expect(response.statusCode).toBe(200);

        const body = JSON.parse(response.body);
        expect(body).toEqual({ status: "ok, funcionando" });
    });

    test("Deve retornar 400 Bad Request se quebrar as regras de tipo ou formato", async () => {

        const payloadInvalido = {
            ...payloadValido,
            projetoId: "nao-e-um-uuid-valido",
            configuracoes: {
                ...payloadValido.configuracoes,
                formato: "mp4"
            }
        };

        const response = await app.inject({
            method: "POST",
            url: "/StronValid",
            headers: {
                authorization: `Bearer ${tokenValido}`,
                "content-type": "application/json"
            },
            payload: JSON.stringify(payloadInvalido)
        });

        expect(response.statusCode).toBe(400);
    });

    test("Deve rejeitar com 401 se a requisição não contiver o token JWT", async () => {
        const response = await app.inject({
            method: "POST",
            url: "/StronValid",
            headers: {
                "content-type": "application/json"
            },
            payload: JSON.stringify(payloadValido)
        });

        expect(response.statusCode).toBe(401);
    });
});