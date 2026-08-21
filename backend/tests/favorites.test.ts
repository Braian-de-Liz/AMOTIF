import { describe, it, expect, beforeAll, afterAll } from "bun:test";
import Fastify from "fastify";
import cors from "@fastify/cors";
import fastifyJwt from "@fastify/jwt";
import type { FastifyInstance } from "fastify";
import fp from "fastify-plugin";
import { PrismaClient } from "@prisma/client";
import { Toggle_favorite } from "../src/routers/projetos/togle_favorites.js";
import { Favorites_plugin } from "../src/routers/projetos/list_favorites.js";
import { globalErrorHandler } from "../src/lib/global_Error.js";

const VALID_UUID = "123e4567-e89b-12d3-a456-426614174000";
const OTHER_UUID = "223e4567-e89b-12d3-a456-426614174001";

let favorited = false;

const mockPrisma = {
  favorite: {
    findUnique: async (args: any) => {
      if (args.where?.userId_projetoId) {
        if (favorited) return { id: VALID_UUID, userId: VALID_UUID, projetoId: VALID_UUID };
        return null;
      }
      return null;
    },
    create: async (args: any) => {
      favorited = true;
      return { id: VALID_UUID, ...args.data };
    },
    delete: async () => {
      favorited = false;
      return {};
    },
    findMany: async () => [],
  },
  projeto: {
    findUnique: async (args: any) => {
      if (args.where?.id === VALID_UUID) {
        return {
          id: VALID_UUID,
          titulo: "Projeto Teste",
          genero: "ROCK",
          bpm: 120,
          escala: "C",
          descricao: "Teste",
          audio_guia: "https://example.com/audio.mp3",
          createdAt: new Date(),
          autor: { nome_completo: "Test User", avatar_url: null },
          _count: { camadas: 3, colaboradores: 1 },
        };
      }
      return null;
    },
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

  app.register(Toggle_favorite, { prefix: "/api" });
  app.register(Favorites_plugin, { prefix: "/api" });

  await app.ready();
  return app;
}

describe("Favorites - POST /api/projetos/favoritos/:projetoId", () => {
  let app: FastifyInstance;
  let token: string;

  beforeAll(async () => {
    favorited = false;
    app = await buildApp();
    token = app.jwt.sign({ id: VALID_UUID, nome: "Test User", email: "test@example.com" });
  });

  afterAll(async () => {
    await app.close();
  });

  it("deve retornar 401 sem token", async () => {
    const res = await app.inject({ method: "POST", url: `/api/projetos/favoritos/${VALID_UUID}` });
    expect(res.statusCode).toBe(401);
  });

  it("deve retornar 400 se projetoId não for UUID", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/api/projetos/favoritos/id-invalido",
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(res.statusCode).toBe(400);
  });

  it("deve retornar 404 se projeto não existir", async () => {
    const res = await app.inject({
      method: "POST",
      url: `/api/projetos/favoritos/${OTHER_UUID}`,
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(res.statusCode).toBe(404);
  });

  it("deve retornar 200 com favoritado: true ao favoritar (happy path)", async () => {
    const res = await app.inject({
      method: "POST",
      url: `/api/projetos/favoritos/${VALID_UUID}`,
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.status).toBe("sucesso");
    expect(body.favoritado).toBe(true);
  });

  it("deve retornar 200 com favoritado: false ao desfavoritar (toggle)", async () => {
    const res = await app.inject({
      method: "POST",
      url: `/api/projetos/favoritos/${VALID_UUID}`,
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.status).toBe("sucesso");
    expect(body.favoritado).toBe(false);
  });
});

describe("Favorites - GET /api/projetos/favoritos", () => {
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
    const res = await app.inject({ method: "GET", url: "/api/projetos/favoritos" });
    expect(res.statusCode).toBe(401);
  });

  it("deve retornar 200 com lista vazia quando não há favoritos (happy path)", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/api/projetos/favoritos",
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.status).toBe("sucesso");
    expect(body.favoritos).toBeArray();
    expect(body).toHaveProperty("total");
  });
});
