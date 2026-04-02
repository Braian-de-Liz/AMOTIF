import { describe, it, expect, beforeAll, afterAll } from "bun:test";
import { Fastify } from "../src/server.js";

describe("Projetos Routes - Schema Validations", () => {
    beforeAll(async () => {
        await Fastify.ready();
    });

    afterAll(async () => {
        await Fastify.close();
    });

    describe("POST /api/projetos/:id (schema_post_project)", () => {
        const validId = "123e4567-e89b-12d3-a456-426614174000";

        it("deve retornar 401 se não houver token de autenticação", async () => {
            const res = await Fastify.inject({
                method: "POST",
                url: `/api/projetos/${validId}`,
                payload: {
                    titulo: "Meu Projeto Musical",
                    genero: "ROCK",
                    bpm: 120,
                    audio_guia: "https://minha-url-de-audio.com/file.mp3"
                }
            });

            expect(res.statusCode).toBe(401);
        });

        it("deve rejeitar e retornar erro 400 se o 'bpm' estiver fora do limite (40-300)", async () => {
            const res = await Fastify.inject({
                method: "POST",
                url: `/api/projetos/${validId}`,
                payload: {
                    titulo: "Projeto Rapido",
                    genero: "ROCK",
                    bpm: 301, // Invalido
                    audio_guia: "https://example.com/audio.mp3"
                }
            });

            expect(res.statusCode).toBe(400);
            const data = res.json();
            expect(data).toHaveProperty("message");
        });

        it("deve rejeitar e retornar 400 se a URL do audio_guia for inválida", async () => {
             const res = await Fastify.inject({
                method: "POST",
                url: `/api/projetos/${validId}`,
                payload: {
                    titulo: "Projeto Rapido",
                    genero: "ROCK",
                    bpm: 120,
                    audio_guia: "nao_sou_uma_url_valida"
                }
            });

            expect(res.statusCode).toBe(400);
            const data = res.json();
            expect(data).toHaveProperty("message");
        });
    });
});
