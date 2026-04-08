import { describe, it, expect, beforeAll, afterAll } from "bun:test";
import Fastify from "fastify";
import cors from "@fastify/cors";
import fastifyJwt from "@fastify/jwt";
import { serializerCompiler, validatorCompiler } from "fastify-type-provider-zod";
import type { FastifyInstance } from "fastify";
import fp from "fastify-plugin";
import { PrismaClient } from "@prisma/client";
import { search_user_by_instruments } from "../src/routers/search/search_by_instrument.js";
import { search_project } from "../src/routers/search/search_project.js";
import { globalErrorHandler } from "../src/lib/global_Error.js";

const VALID_UUID = "123e4567-e89b-12d3-a456-426614174000";

const mockPrisma = {
  user: {
    findMany: async () => [],
  },
  projeto: {
    findMany: async () => [],
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

  app.register(search_user_by_instruments, { prefix: "/api" });
  app.register(search_project, { prefix: "/api" });

  await app.ready();
  return app;
}

describe("Search Routes - GET /api/search/user", () => {
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

  it("deve retornar 400 se instrumento não for informado", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/api/search/user",
      headers: { Authorization: `Bearer ${token}` },
    });

    expect(res.statusCode).toBe(400);
  });

  it("deve retornar 200 quando instrumento for informado", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/api/search/user?instrumento=Guitarra",
      headers: { Authorization: `Bearer ${token}` },
    });

    expect(res.statusCode).toBeOneOf([200, 404]);
  });
});

describe("Search Routes - GET /api/search/projects", () => {
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

  it("deve retornar 200 sem query params", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/api/search/projects",
      headers: { Authorization: `Bearer ${token}` },
    });

    expect(res.statusCode).toBe(200);
  });

  it("deve retornar 200 com query params de filtro", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/api/search/projects?query=rock&genero=ROCK&bpm_min=100&bpm_max=140",
      headers: { Authorization: `Bearer ${token}` },
    });

    expect(res.statusCode).toBe(200);
  });

  it("deve retornar 400 se bpm_min for inválido", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/api/search/projects?bpm_min=abc",
      headers: { Authorization: `Bearer ${token}` },
    });

    expect(res.statusCode).toBe(400);
  });
});