import { describe, it, expect, beforeAll, afterAll } from "bun:test";
import Fastify from "fastify";
import cors from "@fastify/cors";
import fastifyJwt from "@fastify/jwt";
import { serializerCompiler, validatorCompiler } from "fastify-type-provider-zod";
import type { FastifyInstance } from "fastify";
import fp from "fastify-plugin";
import { PrismaClient } from "@prisma/client";
import { Create_like } from "../src/routers/likes/like_create.js";
import { globalErrorHandler } from "../src/lib/global_Error.js";

const VALID_UUID = "123e4567-e89b-12d3-a456-426614174000";

const mockPrisma = {
  like: {
    findUnique: async () => null,
    create: async (data: any) => ({ id: "test-like-id", ...data.data }),
    delete: async () => ({}),
    count: async () => 1,
  },
  projeto: {
    findUnique: async () => ({ id: VALID_UUID, userId: "other-user-id", titulo: "Test Project" }),
  },
  notification: {
    create: async () => ({}),
  },
  $transaction: async (fn: any) => {
    const ctx = {
      like: {
        findUnique: async () => null,
        create: async (data: any) => ({ id: "test-like-id", ...data.data }),
        delete: async () => ({}),
        count: async () => 1,
      },
      projeto: {
        findUnique: async () => ({ id: VALID_UUID, userId: "other-user-id", titulo: "Test Project" }),
      },
      notification: {
        create: async () => ({}),
      },
    };
    return fn(ctx);
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

  app.register(Create_like, { prefix: "/api" });

  await app.ready();
  return app;
}

describe("Likes Routes - POST /api/like/:projetoId", () => {
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

  it("deve retornar 400 se UUID for inválido (validação antes do auth)", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/api/like/nao-e-uuid",
    });

    expect(res.statusCode).toBe(400);
  });

  it("deve retornar 400 se o projetoId não for UUID", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/api/like/id-invalido",
      headers: { Authorization: `Bearer ${token}` },
    });

    expect(res.statusCode).toBe(400);
  });
});