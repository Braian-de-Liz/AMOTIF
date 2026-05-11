import { describe, it, expect, beforeAll, afterAll } from "bun:test";
import Fastify from "fastify";
import cors from "@fastify/cors";
import fastifyJwt from "@fastify/jwt";
import type { FastifyInstance } from "fastify";
import fp from "fastify-plugin";
import { PrismaClient } from "@prisma/client";
import { convite_project } from "../src/routers/colaboration/convite_project.js";
import { Accept_invite } from "../src/routers/colaboration/accept_invite.js";
import { colaborators } from "../src/routers/colaboration/colaboretors.js";
import { list_invite } from "../src/routers/colaboration/list_invite.js";
import { Delete_Colab } from "../src/routers/colaboration/delete_colab.js";
import { Reject_Invite } from "../src/routers/colaboration/reject_invite.js";
import { globalErrorHandler } from "../src/lib/global_Error.js";

const VALID_UUID = "123e4567-e89b-12d3-a456-426614174000";

const mockPrisma = {
  convite: {
    findFirst: async () => null,
    findMany: async () => [],
    create: async (data: any) => ({
      id: "test-invite-id",
      ...data.data,
      expira_em: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      token_convite: "test-token",
    }),
    delete: async () => ({ id: "test-invite-id" }),
  },
  colaborador: {
    findFirst: async () => null,
    create: async (data: any) => ({ id: "test-colab-id", ...data.data }),
    delete: async () => ({ id: "test-colab-id" }),
  },
  projeto: {
    findUnique: async () => ({ id: VALID_UUID, userId: "test-user-id", titulo: "Test Project" }),
  },
  $transaction: async (ops: any[]) => ops.map(() => ({})),
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

  app.register(convite_project, { prefix: "/api" });
  app.register(Accept_invite, { prefix: "/api" });
  app.register(colaborators, { prefix: "/api" });
  app.register(list_invite, { prefix: "/api" });
  app.register(Delete_Colab, { prefix: "/api" });
  app.register(Reject_Invite, { prefix: "/api" });

  await app.ready();
  return app;
}

describe("Colaboration Routes - POST /api/colaboration/:id/invite", () => {
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

  it("deve retornar erro de validação (400) se UUID for inválido e sem token", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/api/colaboration/nao-e-uuid/invite",
      payload: {
        email_destinatario: "novo@example.com",
        cargo: "guitarrista",
        mensagem: "Vem colaborar!",
      },
    });

    expect(res.statusCode).toBe(400);
  });

  it("deve retornar 400 se email_destinatario for inválido", async () => {
    const res = await app.inject({
      method: "POST",
      url: `/api/colaboration/${VALID_UUID}/invite`,
      headers: { Authorization: `Bearer ${token}` },
      payload: {
        email_destinatario: "email-invalido",
        cargo: "guitarrista",
      },
    });

    expect(res.statusCode).toBe(400);
  });
});

describe("Colaboration Routes - POST /api/colaboration/:id/accept", () => {
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

  it("deve retornar erro de validação (400) se UUID for inválido e sem token", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/api/colaboration/nao-e-uuid/accept",
      payload: { token_convite: "test-token" },
    });

    expect(res.statusCode).toBe(400);
  });

  it("deve retornar 400 se token_convite não for enviado", async () => {
    const res = await app.inject({
      method: "POST",
      url: `/api/colaboration/${VALID_UUID}/accept`,
      headers: { Authorization: `Bearer ${token}` },
      payload: {},
    });

    expect(res.statusCode).toBe(400);
  });
});

describe("Colaboration Routes - GET /api/colaboration/:id", () => {
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

  it("deve retornar 400 se o ID não for UUID", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/api/colaboration/id-invalido",
      headers: { Authorization: `Bearer ${token}` },
    });

    expect(res.statusCode).toBe(400);
  });
});

describe("Colaboration Routes - GET /api/colaboration/:id/invite", () => {
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

  it("deve retornar erro de validação (400) se UUID for inválido e sem token", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/api/colaboration/nao-e-uuid/invite",
    });

    expect(res.statusCode).toBe(400);
  });

  it("deve retornar 400 se o ID não for UUID", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/api/colaboration/id-invalido/invite",
      headers: { Authorization: `Bearer ${token}` },
    });

    expect(res.statusCode).toBe(400);
  });
});

describe("Colaboration Routes - DELETE /api/colaboration/:projetoId/remove/:userId", () => {
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

  it("deve retornar erro de validação (400) se UUID for inválido e sem token", async () => {
    const res = await app.inject({
      method: "DELETE",
      url: "/api/colaboration/nao-e-uuid/remove/outro-id",
    });

    expect(res.statusCode).toBe(400);
  });

  it("deve retornar 400 se os IDs não forem UUID", async () => {
    const res = await app.inject({
      method: "DELETE",
      url: "/api/colaboration/id-invalido/remove/id-invalido",
      headers: { Authorization: `Bearer ${token}` },
    });

    expect(res.statusCode).toBe(400);
  });
});

describe("Colaboration Routes - DELETE /api/colaboration/:projetoId/reject", () => {
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

  it("deve retornar erro de validação (400) se UUID for inválido e sem token", async () => {
    const res = await app.inject({
      method: "DELETE",
      url: "/api/colaboration/nao-e-uuid/reject",
    });

    expect(res.statusCode).toBe(400);
  });

  it("deve retornar 400 se o projetoId não for UUID", async () => {
    const res = await app.inject({
      method: "DELETE",
      url: "/api/colaboration/id-invalido/reject",
      headers: { Authorization: `Bearer ${token}` },
    });

    expect(res.statusCode).toBe(400);
  });
});