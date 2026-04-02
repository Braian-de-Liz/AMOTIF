import { describe, it, expect, beforeAll, afterAll } from "bun:test";
import { Fastify } from "../src/server.js";

describe("User Routes - Schema Validations", () => {
    beforeAll(async () => {
        await Fastify.ready();
    });

    afterAll(async () => {
        await Fastify.close();
    });

    describe("POST /api/cadastro (schema_register)", () => {
        it("deve retornar 400 se o payload de registro estiver incompleto", async () => {
            const res = await Fastify.inject({
                method: "POST",
                url: "/api/cadastro",
                payload: {
                    nome_completo: "Braian Test",
                }
            });

            expect(res.statusCode).toBe(400);
            const body = res.json();
            expect(body).toHaveProperty("message");
        });

        it("deve retornar 400 se a senha for muito curta (< 8 chars)", async () => {
            const res = await Fastify.inject({
                method: "POST",
                url: "/api/cadastro",
                payload: {
                    nome_completo: "Braian Test Silva",
                    email: "teste@example.com",
                    senha: "curta",
                    cpf: "12345678909",
                }
            });

            expect(res.statusCode).toBe(400);
        });

        it("deve retornar 400 se o e-mail for inválido", async () => {
            const res = await Fastify.inject({
                method: "POST",
                url: "/api/cadastro",
                payload: {
                    nome_completo: "Braian Test Silva",
                    email: "email_invalido.com", 
                    senha: "password1234",
                    cpf: "12345678909",
                }
            });

            expect(res.statusCode).toBe(400);
        });
    });

    describe("GET /api/user/:id (schema_get_user)", () => {
        it("deve retornar erro 400 (Bad Request) se o ID não for um UUID", async () => {
            const invalidId = "meu_id_nao_uuid";

            const res = await Fastify.inject({
                method: "GET",
                url: `/api/user/${invalidId}`
            });

            expect(res.statusCode).toBe(400);
            const body = res.json();
            expect(body.message).toContain("O formato do ID é inválido");
        });

        it("deve ser bloqueado se não houver token JWT (retornando erro de auth)", async () => {
            const validUuid = "123e4567-e89b-12d3-a456-426614174000";
            const res = await Fastify.inject({
                method: "GET",
                url: `/api/user/${validUuid}`
            });

            expect(res.statusCode).toBe(401); 
        });
    });
});
