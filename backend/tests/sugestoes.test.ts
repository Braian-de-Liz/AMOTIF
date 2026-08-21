import { describe, it, expect, beforeAll, afterAll } from "bun:test";
import Fastify from "fastify";
import cors from "@fastify/cors";
import fastifyJwt from "@fastify/jwt";
import type { FastifyInstance } from "fastify";
import fp from "fastify-plugin";
import { PrismaClient } from "@prisma/client";
import { criar_sugestao } from "../src/routers/sugestoes/criar_sugestao.js";
import { listar_sugestoes } from "../src/routers/sugestoes/listar_sugestoes.js";
import { atualizar_sugestao } from "../src/routers/sugestoes/atualizar_sugestao.js";
import { deletar_sugestao } from "../src/routers/sugestoes/deletar_sugestao.js";
import { globalErrorHandler } from "../src/lib/global_Error.js";

const VALID_UUID = "123e4567-e89b-12d3-a456-426614174000";
const OTHER_UUID = "223e4567-e89b-12d3-a456-426614174001";

const mockSugestao = {
  id: VALID_UUID,
  titulo: "Sugestão de melhoria",
  descricao: "Adicionar mais reverb na guitarra",
  status: "ABERTA",
  projetoId: VALID_UUID,
  autorId: VALID_UUID,
  createdAt: new Date("2026-08-01T10:00:00Z"),
  updatedAt: new Date("2026-08-01T10:00:00Z"),
  autor: { id: VALID_UUID, nome_completo: "Test User", avatar_url: null },
  projeto: { userId: VALID_UUID },
};

const mockPrisma = {
  projeto: {
    findUnique: async (args: any) => {
      if (args.where?.id === VALID_UUID) return { id: VALID_UUID, userId: VALID_UUID };
      return null;
    },
  },
  sugestao: {
    create: async (args: any) => ({
      id: VALID_UUID,
      ...args.data,
      status: "ABERTA",
      createdAt: new Date(),
      updatedAt: new Date(),
      autor: { id: VALID_UUID, nome_completo: "Test User", avatar_url: null },
    }),
    findMany: async () => [mockSugestao],
    findUnique: async (args: any) => {
      if (args.where?.id === VALID_UUID) return { ...mockSugestao };
      return null;
    },
    update: async (args: any) => ({
      ...mockSugestao,
      ...args.data,
      updatedAt: new Date(),
    }),
    delete: async () => ({}),
  },
};

const prismaPlugin = fp(async (fastify: FastifyInstance) => {
  fastify.decorate("prisma", mockPrisma as unknown as PrismaClient);
  fastify.decorate("notiType", {
    INVITE_RECEIVED: "INVITE_RECEIVED",
    NEW_LAYER: "NEW_LAYER",
    LAYER_APPROVED: "LAYER_APPROVED",
    NEW_FOLLOWER: "NEW_FOLLOWER",
    PROJECT_RELEASED: "PROJECT_RELEASED",
    NEW_LIKE: "NEW_LIKE",
  });
});

async function buildApp(): Promise<FastifyInstance> {
  const app = Fastify();
  app.register(cors, { origin: true });
  app.register(fastifyJwt, { secret: "test-secret-key-for-jwt-signing", sign: { expiresIn: "2d" } });
  app.register(prismaPlugin);
  app.setErrorHandler(globalErrorHandler);

  app.register(criar_sugestao, { prefix: "/api" });
  app.register(listar_sugestoes, { prefix: "/api" });
  app.register(atualizar_sugestao, { prefix: "/api" });
  app.register(deletar_sugestao, { prefix: "/api" });

  await app.ready();
  return app;
}

describe("Sugestões - POST /api/projetos/:id/sugestoes", () => {
  let app: FastifyInstance;
  let token: string;

  beforeAll(async () => {
    app = await buildApp();
    token = app.jwt.sign({ id: VALID_UUID, nome: "Test User", email: "test@example.com" });
  });

  afterAll(async () => {
    await app.close();
  });

  it("deve retornar 401 sem token", async () => {
    const res = await app.inject({
      method: "POST",
      url: `/api/projetos/${VALID_UUID}/sugestoes`,
      payload: { titulo: "Teste", descricao: "Descrição" },
    });
    expect(res.statusCode).toBe(401);
  });

  it("deve retornar 400 se titulo estiver ausente", async () => {
    const res = await app.inject({
      method: "POST",
      url: `/api/projetos/${VALID_UUID}/sugestoes`,
      headers: { Authorization: `Bearer ${token}` },
      payload: { descricao: "Sem titulo" },
    });
    expect(res.statusCode).toBe(400);
  });

  it("deve retornar 404 se projeto não existir", async () => {
    const res = await app.inject({
      method: "POST",
      url: `/api/projetos/${OTHER_UUID}/sugestoes`,
      headers: { Authorization: `Bearer ${token}` },
      payload: { titulo: "Teste", descricao: "Descrição" },
    });
    expect(res.statusCode).toBe(404);
  });

  it("deve retornar 201 ao criar sugestão (happy path)", async () => {
    const res = await app.inject({
      method: "POST",
      url: `/api/projetos/${VALID_UUID}/sugestoes`,
      headers: { Authorization: `Bearer ${token}` },
      payload: { titulo: "Melhorar mix", descricao: "Aumentar grave do baixo" },
    });
    expect(res.statusCode).toBe(201);
    const body = res.json();
    expect(body.status).toBe("success");
    expect(body.sugestao).toHaveProperty("id");
    expect(body.sugestao.titulo).toBe("Melhorar mix");
    expect(body.sugestao.status).toBe("ABERTA");
    expect(body.sugestao.autor).toHaveProperty("nome_completo");
  });
});

describe("Sugestões - GET /api/projetos/:id/sugestoes", () => {
  let app: FastifyInstance;
  let token: string;

  beforeAll(async () => {
    app = await buildApp();
    token = app.jwt.sign({ id: VALID_UUID, nome: "Test User", email: "test@example.com" });
  });

  afterAll(async () => {
    await app.close();
  });

  it("deve retornar 401 sem token", async () => {
    const res = await app.inject({ method: "GET", url: `/api/projetos/${VALID_UUID}/sugestoes` });
    expect(res.statusCode).toBe(401);
  });

  it("deve retornar 404 se projeto não existir", async () => {
    const res = await app.inject({
      method: "GET",
      url: `/api/projetos/${OTHER_UUID}/sugestoes`,
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(res.statusCode).toBe(404);
  });

  it("deve retornar 200 com lista de sugestões (happy path)", async () => {
    const res = await app.inject({
      method: "GET",
      url: `/api/projetos/${VALID_UUID}/sugestoes`,
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.status).toBe("success");
    expect(body.sugestoes).toBeArray();
    expect(body.sugestoes.length).toBeGreaterThan(0);
    expect(body.sugestoes[0]).toHaveProperty("titulo");
    expect(body.sugestoes[0]).toHaveProperty("autor");
  });
});

describe("Sugestões - PATCH /api/sugestoes/:id", () => {
  let app: FastifyInstance;
  let token: string;

  beforeAll(async () => {
    app = await buildApp();
    token = app.jwt.sign({ id: VALID_UUID, nome: "Test User", email: "test@example.com" });
  });

  afterAll(async () => {
    await app.close();
  });

  it("deve retornar 401 sem token", async () => {
    const res = await app.inject({
      method: "PATCH",
      url: `/api/sugestoes/${VALID_UUID}`,
      payload: { status: "RESOLVIDA" },
    });
    expect(res.statusCode).toBe(401);
  });

  it("deve retornar 404 se sugestão não existir", async () => {
    const res = await app.inject({
      method: "PATCH",
      url: `/api/sugestoes/${OTHER_UUID}`,
      headers: { Authorization: `Bearer ${token}` },
      payload: { status: "RESOLVIDA" },
    });
    expect(res.statusCode).toBe(404);
  });

  it("deve retornar 200 ao atualizar status (happy path)", async () => {
    const res = await app.inject({
      method: "PATCH",
      url: `/api/sugestoes/${VALID_UUID}`,
      headers: { Authorization: `Bearer ${token}` },
      payload: { status: "RESOLVIDA" },
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.status).toBe("success");
    expect(body.sugestao.status).toBe("RESOLVIDA");
  });
});

describe("Sugestões - DELETE /api/sugestoes/:id", () => {
  let app: FastifyInstance;
  let token: string;

  beforeAll(async () => {
    app = await buildApp();
    token = app.jwt.sign({ id: VALID_UUID, nome: "Test User", email: "test@example.com" });
  });

  afterAll(async () => {
    await app.close();
  });

  it("deve retornar 401 sem token", async () => {
    const res = await app.inject({ method: "DELETE", url: `/api/sugestoes/${VALID_UUID}` });
    expect(res.statusCode).toBe(401);
  });

  it("deve retornar 404 se sugestão não existir", async () => {
    const res = await app.inject({
      method: "DELETE",
      url: `/api/sugestoes/${OTHER_UUID}`,
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(res.statusCode).toBe(404);
  });

  it("deve retornar 403 se usuário não for autor nem dono do projeto", async () => {
    const mockPrismaOtherUser = {
      ...mockPrisma,
      sugestao: {
        ...mockPrisma.sugestao,
        findUnique: async () => ({
          ...mockSugestao,
          autorId: OTHER_UUID,
          projeto: { userId: OTHER_UUID },
        }),
      },
    };

    const appOther = Fastify();
    appOther.register(cors, { origin: true });
    appOther.register(fastifyJwt, { secret: "test-secret-key-for-jwt-signing", sign: { expiresIn: "2d" } });
    appOther.register(
      fp(async (fastify: FastifyInstance) => {
        fastify.decorate("prisma", mockPrismaOtherUser as unknown as PrismaClient);
        fastify.decorate("notiType", {});
      })
    );
    appOther.setErrorHandler(globalErrorHandler);
    appOther.register(deletar_sugestao, { prefix: "/api" });
    await appOther.ready();

    const otherToken = appOther.jwt.sign({ id: VALID_UUID, nome: "Outro", email: "outro@test.com" });
    const res = await appOther.inject({
      method: "DELETE",
      url: `/api/sugestoes/${VALID_UUID}`,
      headers: { Authorization: `Bearer ${otherToken}` },
    });
    expect(res.statusCode).toBe(403);
    await appOther.close();
  });

  it("deve retornar 200 ao deletar sugestão (happy path - autor)", async () => {
    const res = await app.inject({
      method: "DELETE",
      url: `/api/sugestoes/${VALID_UUID}`,
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.status).toBe("success");
    expect(body.mensagem).toContain("deletada");
  });
});
