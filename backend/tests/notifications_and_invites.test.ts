import { describe, it, expect, beforeAll, afterAll } from "bun:test";
import Fastify from "fastify";
import cors from "@fastify/cors";
import fastifyJwt from "@fastify/jwt";
import type { FastifyInstance } from "fastify";
import fp from "fastify-plugin";
import { PrismaClient } from "@prisma/client";
import { read_notification } from "../src/routers/notification/read_notification.js";
import { list_user_invites } from "../src/routers/colaboration/list_user_invites.js";
import { globalErrorHandler } from "../src/lib/global_Error.js";

const VALID_UUID = "123e4567-e89b-12d3-a456-426614174000";
const OTHER_UUID = "223e4567-e89b-12d3-a456-426614174001";

const mockPrisma = {
  notification: {
    findUnique: async (args: any) => {
      if (args.where?.id === VALID_UUID) {
        return { id: VALID_UUID, userId: VALID_UUID, lida: false };
      }
      return null;
    },
    update: async (args: any) => ({ id: args.where.id, ...args.data }),
  },
  convite: {
    findMany: async () => [
      {
        id: VALID_UUID,
        projetoId: VALID_UUID,
        remetenteId: OTHER_UUID,
        email_destinatario: "test@example.com",
        cargo: "membro",
        mensagem: "Venha tocar conosco!",
        token_convite: "token-123",
        expira_em: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        createdAt: new Date(),
        projeto: { id: VALID_UUID, titulo: "Projeto Teste" },
        remetente: { id: OTHER_UUID, nome_completo: "Outro User" },
      },
    ],
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

  app.register(read_notification, { prefix: "/api" });
  app.register(list_user_invites, { prefix: "/api" });

  await app.ready();
  return app;
}

describe("Notifications - PATCH /api/notifications/:id/read", () => {
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
    const res = await app.inject({ method: "PATCH", url: `/api/notifications/${VALID_UUID}/read` });
    expect(res.statusCode).toBe(401);
  });

  it("deve retornar 404 se notificação não existir", async () => {
    const res = await app.inject({
      method: "PATCH",
      url: `/api/notifications/${OTHER_UUID}/read`,
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(res.statusCode).toBe(404);
  });

  it("deve retornar 200 ao marcar como lida (happy path)", async () => {
    const res = await app.inject({
      method: "PATCH",
      url: `/api/notifications/${VALID_UUID}/read`,
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.status).toBe("sucesso");
  });
});

describe("Colaboration - GET /api/convites", () => {
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
    const res = await app.inject({ method: "GET", url: "/api/convites" });
    expect(res.statusCode).toBe(401);
  });

  it("deve retornar 200 com lista de convites (happy path)", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/api/convites",
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.status).toBe("sucesso");
    expect(body.convites).toBeArray();
    expect(body.convites.length).toBeGreaterThan(0);
    expect(body.convites[0]).toHaveProperty("projetoTitulo");
    expect(body.convites[0]).toHaveProperty("remetenteNome");
    expect(body.convites[0]).toHaveProperty("cargo");
    expect(body.convites[0]).toHaveProperty("expira_em");
  });
});
