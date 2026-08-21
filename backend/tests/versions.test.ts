import { describe, it, expect, beforeAll, afterAll } from "bun:test";
import Fastify from "fastify";
import cors from "@fastify/cors";
import fastifyJwt from "@fastify/jwt";
import type { FastifyInstance } from "fastify";
import fp from "fastify-plugin";
import { PrismaClient } from "@prisma/client";
import { get_versions } from "../src/routers/versions/get_versions.js";
import { rollback_route } from "../src/routers/versions/manage_branches.js";
import { globalErrorHandler } from "../src/lib/global_Error.js";

const VALID_UUID = "123e4567-e89b-12d3-a456-426614174000";
const OTHER_UUID = "223e4567-e89b-12d3-a456-426614174001";

const mockVersion = {
  id: VALID_UUID,
  camadaId: VALID_UUID,
  audio_url: "https://example.com/audio-v1.mp3",
  nome_trilha: "Guitarra Solo",
  instrumento_tag: "Guitarra",
  delay_offset: 0,
  volume_padrao: 1.0,
  versionNumber: 1,
  mensagem: "Versão inicial",
  createdAt: new Date("2026-08-01T10:00:00Z"),
  autor: { id: VALID_UUID, nome_completo: "Test User", avatar_url: null },
};

const mockPrisma = {
  camada: {
    findUnique: async (args: any) => {
      if (args.where?.id === VALID_UUID) return { id: VALID_UUID };
      return null;
    },
    update: async (args: any) => ({ id: args.where.id, ...args.data }),
  },
  layerVersion: {
    findFirst: async (args: any) => {
      if (args.where?.id === VALID_UUID) return { ...mockVersion };
      return null;
    },
    findMany: async () => [mockVersion],
    create: async (args: any) => ({
      id: OTHER_UUID,
      ...args.data,
      createdAt: new Date(),
    }),
  },
  projeto: {
    findUnique: async (args: any) => {
      if (args.where?.id) return { id: args.where.id, userId: VALID_UUID, deletedAt: null };
      return null;
    },
  },
  colaborador: {
    findUnique: async () => null,
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

  app.register(get_versions, { prefix: "/api" });
  app.register(rollback_route, { prefix: "/api" });

  await app.ready();
  return app;
}

describe("Versions Routes - GET /api/layer/:id/versions", () => {
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
    const res = await app.inject({ method: "GET", url: `/api/layer/${VALID_UUID}/versions` });
    expect(res.statusCode).toBe(401);
  });

  it("deve retornar 400 se ID não for UUID", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/api/layer/id-invalido/versions",
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(res.statusCode).toBe(400);
  });

  it("deve retornar 404 se camada não existir", async () => {
    const res = await app.inject({
      method: "GET",
      url: `/api/layer/${OTHER_UUID}/versions`,
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(res.statusCode).toBe(404);
    const body = res.json();
    expect(body.mensagem).toContain("não encontrada");
  });

  it("deve retornar 200 com lista de versões (happy path)", async () => {
    const res = await app.inject({
      method: "GET",
      url: `/api/layer/${VALID_UUID}/versions`,
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.status).toBe("sucesso");
    expect(body.versoes).toBeArray();
    expect(body.versoes.length).toBeGreaterThan(0);
    expect(body.versoes[0]).toHaveProperty("versionNumber");
    expect(body.versoes[0]).toHaveProperty("audio_url");
    expect(body.versoes[0]).toHaveProperty("autor");
  });
});

describe("Versions Routes - GET /api/layer/:id/versions/:versionId", () => {
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
    const res = await app.inject({ method: "GET", url: `/api/layer/${VALID_UUID}/versions/${VALID_UUID}` });
    expect(res.statusCode).toBe(401);
  });

  it("deve retornar 404 se versão não existir", async () => {
    const res = await app.inject({
      method: "GET",
      url: `/api/layer/${VALID_UUID}/versions/${OTHER_UUID}`,
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(res.statusCode).toBe(404);
  });

  it("deve retornar 200 com detalhes da versão (happy path)", async () => {
    const res = await app.inject({
      method: "GET",
      url: `/api/layer/${VALID_UUID}/versions/${VALID_UUID}`,
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.status).toBe("sucesso");
    expect(body.versao).toHaveProperty("id");
    expect(body.versao).toHaveProperty("versionNumber");
    expect(body.versao).toHaveProperty("autor");
  });
});

describe("Versions Routes - POST /api/layer/:id/rollback/:versionId", () => {
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
    const res = await app.inject({ method: "POST", url: `/api/layer/${VALID_UUID}/rollback/${VALID_UUID}` });
    expect(res.statusCode).toBe(401);
  });

  it("deve retornar 400 se IDs não forem UUID", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/api/layer/id-invalido/rollback/id-invalido",
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(res.statusCode).toBe(400);
  });

  it("deve retornar 400 se versão não existir (rollback falha)", async () => {
    const res = await app.inject({
      method: "POST",
      url: `/api/layer/${VALID_UUID}/rollback/${OTHER_UUID}`,
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(res.statusCode).toBe(400);
    const body = res.json();
    expect(body.status).toBe("erro");
  });
});
