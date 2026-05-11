import { describe, it, expect, beforeAll, afterAll } from "bun:test";
import Fastify from "fastify";
import cors from "@fastify/cors";
import fastifyJwt from "@fastify/jwt";
import type { FastifyInstance } from "fastify";
import fp from "fastify-plugin";
import { PrismaClient } from "@prisma/client";
import { create_Layer } from "../src/routers/layers/create_layer.js";
import { delete_layer } from "../src/routers/layers/delete_layer.js";
import { update_layer } from "../src/routers/layers/update_layers.js";
import { patch_layer_status } from "../src/routers/layers/autorizar_layer.js";
import { globalErrorHandler } from "../src/lib/global_Error.js";

const VALID_UUID = "123e4567-e89b-12d3-a456-426614174000";

const mockPrisma = {
  camada: {
    findUnique: async () => null,
    create: async (data: any) => ({ id: VALID_UUID, ...data.data }),
    update: async (data: any) => ({ id: VALID_UUID, ...data.data }),
    delete: async () => ({ id: VALID_UUID }),
  },
  projeto: {
    findUnique: async () => ({ id: VALID_UUID, userId: "test-user-id", titulo: "Test Project" }),
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

  app.register(create_Layer, { prefix: "/api" });
  app.register(delete_layer, { prefix: "/api" });
  app.register(update_layer, { prefix: "/api" });
  app.register(patch_layer_status, { prefix: "/api" });

  await app.ready();
  return app;
}

describe("Layers Routes - POST /api/layer/:projetoId", () => {
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

  it("deve retornar erro de validação (400) se UUID for inválido", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/api/layer/nao-e-uuid",
      payload: {
        nome_trilha: "Guitarra Solo",
        audio_url: "https://example.com/audio.mp3",
        instrumento_tag: "Guitarra",
        delay_offset: 0,
        volume_padrao: 1.0,
      },
    });

    expect(res.statusCode).toBe(400);
  });

  it("deve retornar 400 se audio_url for inválido", async () => {
    const res = await app.inject({
      method: "POST",
      url: `/api/layer/${VALID_UUID}`,
      headers: { Authorization: `Bearer ${token}` },
      payload: {
        nome_trilha: "Guitarra Solo",
        audio_url: "nao_e_url",
        instrumento_tag: "Guitarra",
        delay_offset: 0,
        volume_padrao: 1.0,
      },
    });

    expect(res.statusCode).toBe(400);
  });

  it("deve retornar 400 se instrumento_tag estiver ausente", async () => {
    const res = await app.inject({
      method: "POST",
      url: `/api/layer/${VALID_UUID}`,
      headers: { Authorization: `Bearer ${token}` },
      payload: {
        nome_trilha: "Guitarra Solo",
        audio_url: "https://example.com/audio.mp3",
        delay_offset: 0,
        volume_padrao: 1.0,
      },
    });

    expect(res.statusCode).toBe(400);
  });
});

describe("Layers Routes - DELETE /api/layer/:id", () => {
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

  it("deve retornar erro de validação (400) se UUID for inválido", async () => {
    const res = await app.inject({
      method: "DELETE",
      url: "/api/layer/nao-e-uuid",
    });

    expect(res.statusCode).toBe(400);
  });

  it("deve retornar 400 se o ID não for UUID", async () => {
    const res = await app.inject({
      method: "DELETE",
      url: "/api/layer/id-invalido",
      headers: { Authorization: `Bearer ${token}` },
    });

    expect(res.statusCode).toBe(400);
  });
});

describe("Layers Routes - PUT /api/layer/:id", () => {
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

  it("deve retornar erro de validação (400) se UUID for inválido", async () => {
    const res = await app.inject({
      method: "PUT",
      url: "/api/layer/nao-e-uuid",
      payload: { nome_trilha: "Novo Nome" },
    });

    expect(res.statusCode).toBe(400);
  });

  it("deve retornar 400 se o ID não for UUID", async () => {
    const res = await app.inject({
      method: "PUT",
      url: "/api/layer/id-invalido",
      headers: { Authorization: `Bearer ${token}` },
      payload: { nome_trilha: "Novo Nome" },
    });

    expect(res.statusCode).toBe(400);
  });
});

describe("Layers Routes - PATCH /api/layer/:layerId/status", () => {
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

  it("deve retornar erro de validação (400) se UUID for inválido", async () => {
    const res = await app.inject({
      method: "PATCH",
      url: "/api/layer/nao-e-uuid/status",
      payload: { aprovada: true },
    });

    expect(res.statusCode).toBe(400);
  });

  it("deve retornar 400 se aprovada não for boolean", async () => {
    const res = await app.inject({
      method: "PATCH",
      url: `/api/layer/${VALID_UUID}/status`,
      headers: { Authorization: `Bearer ${token}` },
      payload: { aprovada: "sim" },
    });

    expect(res.statusCode).toBe(400);
  });
});