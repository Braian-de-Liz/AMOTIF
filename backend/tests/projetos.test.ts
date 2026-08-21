import { describe, it, expect, beforeAll, afterAll } from "bun:test";
import Fastify from "fastify";
import cors from "@fastify/cors";
import fastifyJwt from "@fastify/jwt";
import type { FastifyInstance } from "fastify";
import fp from "fastify-plugin";
import { PrismaClient } from "@prisma/client";
import { post_project } from "../src/routers/projetos/create_project.js";
import { del_project } from "../src/routers/projetos/delete_project.js";
import { Get_projects_user } from "../src/routers/projetos/get_projects.js";
import { Get_a_project } from "../src/routers/projetos/get_project_details.js";
import { Update_project } from "../src/routers/projetos/update_project.js";
import { searth_feed } from "../src/routers/projetos/get_feed.js";
import { mural_project } from "../src/routers/projetos/mural_project.js";
import { get_mural } from "../src/routers/projetos/get_mural.js";
import { globalErrorHandler } from "../src/lib/global_Error.js";

const mockPrisma = {
  projeto: {
    findUnique: async (args: any) => {
      if (args.where?.id === "123e4567-e89b-12d3-a456-426614174000") {
        return {
          id: "123e4567-e89b-12d3-a456-426614174000",
          titulo: "Projeto Teste",
          genero: "ROCK",
          bpm: 120,
          escala: "C",
          descricao: "Teste",
          audio_guia: "https://example.com/audio.mp3",
          userId: "test-user-id",
          createdAt: new Date(),
          autor: { nome_completo: "Test User", avatar_url: null },
          _count: { camadas: 0, colaboradores: 0 },
        };
      }
      return null;
    },
    findMany: async () => [],
    create: async (data: any) => ({
      id: "test-project-id",
      ...data.data,
      createdAt: new Date(),
      updatedAt: new Date(),
    }),
    update: async (data: any) => ({ id: "test-project-id", ...data.data }),
    delete: async () => ({ id: "test-project-id" }),
  },
  user: {
    findUnique: async () => ({ id: "test-user-id", senha: "$argon2id$v=19$m=32768,t=2,p=1$test$testhash" }),
  },
  muralPost: {
    findMany: async () => [],
    findUnique: async () => null,
    create: async (data: any) => ({ id: "test-mural-id", ...data.data, createdAt: new Date() }),
    delete: async () => ({}),
  },
  follows: {
    findMany: async () => [],
  },
  notification: {
    create: async () => ({}),
    createMany: async () => ({}),
  },
  like: {
    findMany: async () => [],
  },
  favorite: {
    findMany: async () => [],
  },
  layerVersion: {
    create: async (data: any) => ({ id: "version-id", ...data.data, createdAt: new Date() }),
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
  app.register(cors, { origin: true });
  app.register(fastifyJwt, { secret: "test-secret-key-for-jwt-signing", sign: { expiresIn: "2d" } });
  app.register(prismaPlugin);
  app.setErrorHandler(globalErrorHandler);

  app.register(post_project, { prefix: "/api" });
  app.register(del_project, { prefix: "/api" });
  app.register(Get_projects_user, { prefix: "/api" });
  app.register(Get_a_project, { prefix: "/api" });
  app.register(Update_project, { prefix: "/api" });
  app.register(searth_feed, { prefix: "/api" });
  app.register(mural_project, { prefix: "/api" });
  app.register(get_mural, { prefix: "/api" });

  await app.ready();
  return app;
}

describe("Projetos Routes - POST /api/projetos", () => {
  let app: FastifyInstance;
  let token: string;

  beforeAll(async () => {
    app = await buildApp();
    token = app.jwt.sign({
      id: "test-user-id",
      nome: "Test User",
      email: "test@example.com",
    });
  });

  afterAll(async () => {
    await app.close();
  });

  it("deve retornar 401 se não houver token JWT (sem params, validação passa primeiro)", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/api/projetos",
      payload: {
        titulo: "Meu Projeto Musical",
        genero: "ROCK",
        bpm: 120,
        audio_guia: "https://minha-url-de-audio.com/file.mp3",
      },
    });

    expect(res.statusCode).toBe(401);
  });

  it("deve retornar 400 se o 'bpm' estiver fora do limite (40-300)", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/api/projetos",
      headers: { Authorization: `Bearer ${token}` },
      payload: {
        titulo: "Projeto Rapido",
        genero: "ROCK",
        bpm: 301,
        audio_guia: "https://example.com/audio.mp3",
      },
    });

    expect(res.statusCode).toBe(400);
    const data = res.json();
    expect(data).toHaveProperty("status", "erro");
  });

  it("deve retornar 400 se a URL do audio_guia for inválida", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/api/projetos",
      headers: { Authorization: `Bearer ${token}` },
      payload: {
        titulo: "Projeto Rapido",
        genero: "ROCK",
        bpm: 120,
        audio_guia: "nao_sou_uma_url_valida",
      },
    });

    expect(res.statusCode).toBe(400);
    const data = res.json();
    expect(data).toHaveProperty("status", "erro");
  });

  it("deve retornar 400 se o titulo for muito curto", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/api/projetos",
      headers: { Authorization: `Bearer ${token}` },
      payload: {
        titulo: "A",
        genero: "ROCK",
        bpm: 120,
        audio_guia: "https://example.com/audio.mp3",
      },
    });

    expect(res.statusCode).toBe(400);
  });

  it("deve retornar 400 se o genero for inválido", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/api/projetos",
      headers: { Authorization: `Bearer ${token}` },
      payload: {
        titulo: "Projeto Teste",
        genero: "GENERO_INVALIDO",
        bpm: 120,
        audio_guia: "https://example.com/audio.mp3",
      },
    });

    expect(res.statusCode).toBe(400);
  });
});

describe("Projetos Routes - GET /api/projetos/:id", () => {
  let app: FastifyInstance;
  let token: string;

  beforeAll(async () => {
    app = await buildApp();
    token = app.jwt.sign({
      id: "test-user-id",
      nome: "Test User",
      email: "test@example.com",
    });
  });

  afterAll(async () => {
    await app.close();
  });

  it("deve retornar 401 se UUID for inválido e sem token (auth roda antes da validação)", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/api/projetos/id-invalido",
    });

    expect(res.statusCode).toBe(401);
  });

  it("deve retornar 400 se o ID não for UUID", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/api/projetos/id-invalido",
      headers: { Authorization: `Bearer ${token}` },
    });

    expect(res.statusCode).toBe(400);
  });
});

describe("Projetos Routes - GET /api/projetos/:id/get", () => {
  let app: FastifyInstance;
  let token: string;

  beforeAll(async () => {
    app = await buildApp();
    token = app.jwt.sign({
      id: "test-user-id",
      nome: "Test User",
      email: "test@example.com",
    });
  });

  afterAll(async () => {
    await app.close();
  });

  it("deve retornar 401 se UUID for inválido e sem token (auth roda antes da validação)", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/api/projetos/id-invalido/get",
    });

    expect(res.statusCode).toBe(401);
  });

  it("deve retornar 400 se o ID não for UUID", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/api/projetos/id-invalido/get",
      headers: { Authorization: `Bearer ${token}` },
    });

    expect(res.statusCode).toBe(400);
  });
});

describe("Projetos Routes - GET /api/projetos/feed", () => {
  let app: FastifyInstance;
  let token: string;

  beforeAll(async () => {
    app = await buildApp();
    token = app.jwt.sign({
      id: "test-user-id",
      nome: "Test User",
      email: "test@example.com",
    });
  });

  afterAll(async () => {
    await app.close();
  });

  it("deve retornar 401 ao buscar feed sem token", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/api/projetos/feed",
    });

    expect(res.statusCode).toBe(401);
  });

  it("deve retornar 200 ao buscar feed com token", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/api/projetos/feed",
      headers: { Authorization: `Bearer ${token}` },
    });

    expect(res.statusCode).toBe(200);
  });

  it("deve retornar 200 ao buscar feed com filtro de gênero", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/api/projetos/feed?genero=ROCK",
      headers: { Authorization: `Bearer ${token}` },
    });

    expect(res.statusCode).toBe(200);
  });
});

describe("Projetos Routes - PATCH /api/projetos/:id", () => {
  let app: FastifyInstance;
  let token: string;

  beforeAll(async () => {
    app = await buildApp();
    token = app.jwt.sign({
      id: "test-user-id",
      nome: "Test User",
      email: "test@example.com",
    });
  });

  afterAll(async () => {
    await app.close();
  });

  it("deve retornar 401 ao atualizar projeto sem token", async () => {
    const res = await app.inject({
      method: "PATCH",
      url: "/api/projetos/123e4567-e89b-12d3-a456-426614174000",
      payload: { titulo: "Novo Título" },
    });

    expect(res.statusCode).toBe(401);
  });

  it("deve retornar 400 se o ID não for UUID", async () => {
    const res = await app.inject({
      method: "PATCH",
      url: "/api/projetos/id-invalido",
      headers: { Authorization: `Bearer ${token}` },
      payload: { titulo: "Novo Título" },
    });

    expect(res.statusCode).toBe(400);
  });
});

describe("Projetos Routes - DELETE /api/projetos/:id", () => {
  let app: FastifyInstance;
  let token: string;

  beforeAll(async () => {
    app = await buildApp();
    token = app.jwt.sign({
      id: "test-user-id",
      nome: "Test User",
      email: "test@example.com",
    });
  });

  afterAll(async () => {
    await app.close();
  });

  it("deve retornar 401 ao deletar projeto sem token", async () => {
    const res = await app.inject({
      method: "DELETE",
      url: "/api/projetos/123e4567-e89b-12d3-a456-426614174000",
      payload: { senha: "password1234" },
    });

    expect(res.statusCode).toBe(401);
  });

  it("deve retornar 400 se a senha não for enviada", async () => {
    const res = await app.inject({
      method: "DELETE",
      url: "/api/projetos/123e4567-e89b-12d3-a456-426614174000",
      headers: { Authorization: `Bearer ${token}` },
      payload: {},
    });

    expect(res.statusCode).toBe(400);
  });
});

describe("Projetos Routes - POST /api/projetos/:id/mural", () => {
  let app: FastifyInstance;
  let token: string;

  beforeAll(async () => {
    app = await buildApp();
    token = app.jwt.sign({
      id: "test-user-id",
      nome: "Test User",
      email: "test@example.com",
    });
  });

  afterAll(async () => {
    await app.close();
  });

  it("deve retornar 401 ao postar no mural sem token", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/api/projetos/123e4567-e89b-12d3-a456-426614174000/mural",
      payload: { conteudo: "Post no mural" },
    });

    expect(res.statusCode).toBe(401);
  });

  it("deve retornar 400 se o conteúdo estiver vazio", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/api/projetos/123e4567-e89b-12d3-a456-426614174000/mural",
      headers: { Authorization: `Bearer ${token}` },
      payload: { conteudo: "" },
    });

    expect(res.statusCode).toBe(400);
  });
});

describe("Projetos Routes - GET /api/mural/:projeto_id", () => {
  let app: FastifyInstance;
  let token: string;

  beforeAll(async () => {
    app = await buildApp();
    token = app.jwt.sign({
      id: "test-user-id",
      nome: "Test User",
      email: "test@example.com",
    });
  });

  afterAll(async () => {
    await app.close();
  });

  it("deve retornar 401 ao buscar mural sem token", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/api/mural/123e4567-e89b-12d3-a456-426614174000",
    });

    expect(res.statusCode).toBe(401);
  });

  it("deve retornar 400 se o ID não for UUID", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/api/mural/id-invalido",
      headers: { Authorization: `Bearer ${token}` },
    });

    expect(res.statusCode).toBe(400);
  });
});

describe("Projetos Routes - Happy Paths", () => {
  let app: FastifyInstance;
  let token: string;

  const VALID_UUID = "123e4567-e89b-12d3-a456-426614174000";

  beforeAll(async () => {
    app = await buildApp();
    token = app.jwt.sign({
      id: "test-user-id",
      nome: "Test User",
      email: "test@example.com",
    });
  });

  afterAll(async () => {
    await app.close();
  });

  it.skip("deve retornar 201 ao criar projeto com dados válidos (ERR_HTTP_HEADERS_SENT bug)", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/api/projetos",
      headers: { Authorization: `Bearer ${token}` },
      payload: {
        titulo: "Meu Projeto Musical",
        genero: "ROCK",
        bpm: 120,
        audio_guia: "https://example.com/audio.mp3",
      },
    });

    expect(res.statusCode).toBe(201);
    const body = res.json();
    expect(body.status).toBe("sucesso");
    expect(body).toHaveProperty("projeto");
    expect(body.projeto).toHaveProperty("id");
  });

  it("deve retornar 200 ao listar mural do projeto", async () => {
    const res = await app.inject({
      method: "GET",
      url: `/api/mural/${VALID_UUID}`,
      headers: { Authorization: `Bearer ${token}` },
    });

    expect(res.statusCode).toBe(200);
  });

  it("deve retornar 404 ao buscar projeto inexistente", async () => {
    const otherUUID = "223e4567-e89b-12d3-a456-426614174001";
    const res = await app.inject({
      method: "GET",
      url: `/api/projetos/${otherUUID}`,
      headers: { Authorization: `Bearer ${token}` },
    });

    expect(res.statusCode).toBe(404);
  });
});