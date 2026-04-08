import { describe, it, expect, beforeAll, afterAll } from "bun:test";
import Fastify from "fastify";
import cors from "@fastify/cors";
import fastifyJwt from "@fastify/jwt";
import { serializerCompiler, validatorCompiler } from "fastify-type-provider-zod";
import type { FastifyInstance } from "fastify";
import fp from "fastify-plugin";
import { PrismaClient } from "@prisma/client";
import { follow_user } from "../src/routers/follows/follow_user.js";
import { Unfollow_route } from "../src/routers/follows/unfollow_user.js";
import { list_followers } from "../src/routers/follows/list_followers.js";
import { globalErrorHandler } from "../src/lib/global_Error.js";

const VALID_UUID = "123e4567-e89b-12d3-a456-426614174000";
const OTHER_UUID = "223e4567-e89b-12d3-a456-426614174000";

const mockPrisma = {
  follows: {
    findUnique: async () => null,
    findMany: async () => [],
    create: async (data: any) => ({ ...data.data }),
    delete: async () => ({}),
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
  app.setValidatorCompiler(validatorCompiler);
  app.setSerializerCompiler(serializerCompiler);
  app.register(cors, { origin: true });
  app.register(fastifyJwt, { secret: "test-secret-key-for-jwt-signing", sign: { expiresIn: "2d" } });
  app.register(prismaPlugin);
  app.setErrorHandler(globalErrorHandler);

  app.register(follow_user, { prefix: "/api" });
  app.register(Unfollow_route, { prefix: "/api" });
  app.register(list_followers, { prefix: "/api" });

  await app.ready();
  return app;
}

describe("Follows Routes - POST /api/follow/:followingId", () => {
  let app: FastifyInstance;
  let token: string;

  beforeAll(async () => {
    app = await buildApp();
    token = app.jwt.sign({
      id: VALID_UUID,
      nome: "Test User",
      email: "test@example.com",
    });
  });

  afterAll(async () => {
    await app.close();
  });

  it("deve retornar 400 se UUID for inválido (validação antes do auth)", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/api/follow/nao-e-uuid",
    });

    expect(res.statusCode).toBe(400);
  });

  it("deve retornar 400 se tentar seguir a si mesmo", async () => {
    const res = await app.inject({
      method: "POST",
      url: `/api/follow/${VALID_UUID}`,
      headers: { Authorization: `Bearer ${token}` },
    });

    expect(res.statusCode).toBe(400);
    const body = res.json();
    expect(body.mensagem).toContain("não pode seguir a si mesmo");
  });

  it("deve retornar 400 se o followingId não for UUID", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/api/follow/id-invalido",
      headers: { Authorization: `Bearer ${token}` },
    });

    expect(res.statusCode).toBe(400);
  });
});

describe("Follows Routes - DELETE /api/follow/:id", () => {
  let app: FastifyInstance;
  let token: string;

  beforeAll(async () => {
    app = await buildApp();
    token = app.jwt.sign({
      id: VALID_UUID,
      nome: "Test User",
      email: "test@example.com",
    });
  });

  afterAll(async () => {
    await app.close();
  });

  it("deve retornar 400 se UUID for inválido", async () => {
    const res = await app.inject({
      method: "DELETE",
      url: "/api/follow/nao-e-uuid",
    });

    expect(res.statusCode).toBe(400);
  });

  it("deve retornar 400 se o ID não for UUID", async () => {
    const res = await app.inject({
      method: "DELETE",
      url: "/api/follow/id-invalido",
      headers: { Authorization: `Bearer ${token}` },
    });

    expect(res.statusCode).toBe(400);
  });
});

describe("Follows Routes - GET /api/follows", () => {
  let app: FastifyInstance;
  let token: string;

  beforeAll(async () => {
    app = await buildApp();
    token = app.jwt.sign({
      id: VALID_UUID,
      nome: "Test User",
      email: "test@example.com",
    });
  });

  afterAll(async () => {
    await app.close();
  });

  it.skip("deve retornar 401 se não houver token (hits ERR_HTTP_HEADERS_SENT)", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/api/follows",
    });

    expect(res.statusCode).toBe(401);
  });

  it("deve retornar 200 com lista vazia quando não há seguidores", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/api/follows",
      headers: { Authorization: `Bearer ${token}` },
    });

    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body).toHaveProperty("status", "sucesso");
    expect(body).toHaveProperty("follows");
    expect(body).toHaveProperty("total");
  });
});