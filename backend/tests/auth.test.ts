import { describe, it, expect, beforeAll, afterAll, beforeEach } from "bun:test";
import Fastify from "fastify";
import cors from "@fastify/cors";
import fastifyJwt from "@fastify/jwt";
import cookie from "@fastify/cookie";
import type { FastifyInstance } from "fastify";
import fp from "fastify-plugin";
import { PrismaClient } from "@prisma/client";
import { refresh_token } from "../src/routers/user/refresh.js";
import { logout_user } from "../src/routers/user/logout.js";
import { globalErrorHandler } from "../src/lib/global_Error.js";
import { notiTypeMock } from "./helpers/noti_type.js";

const VALID_UUID = "123e4567-e89b-12d3-a456-426614174000";

// Estado do token usado nos testes de rotação; cada teste redefine o que precisa.
let tokenEstado: { used: boolean; usedAt: Date | null } = { used: false, usedAt: null };
let claimCount = 1;
let deleteManyCalls: any[] = [];

const mockPrisma: any = {
  $transaction: async (arg: any) => (typeof arg === "function" ? arg(mockPrisma) : Promise.all(arg)),
  refreshToken: {
    findUnique: async (args: any) => {
      if (args.where?.token === "valid-refresh-token") {
        return {
          id: "token-id",
          token: "valid-refresh-token",
          userId: VALID_UUID,
          used: tokenEstado.used,
          usedAt: tokenEstado.usedAt,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          user: { id: VALID_UUID, nome_completo: "Test User", email: "test@example.com" },
        };
      }
      return null;
    },
    update: async () => ({}),
    updateMany: async () => ({ count: claimCount }),
    create: async (args: any) => ({ id: "new-token-id", ...args.data }),
    delete: async () => ({}),
    deleteMany: async (args: any) => { deleteManyCalls.push(args); return {}; },
  },
};

const prismaPlugin = fp(async (fastify: FastifyInstance) => {
  fastify.decorate("prisma", mockPrisma as unknown as PrismaClient);
  fastify.decorate("notiType", notiTypeMock);
});

async function buildApp(): Promise<FastifyInstance> {
  const app = Fastify();
  app.register(cors, { origin: true });
  app.register(cookie);
  app.register(fastifyJwt, { secret: "test-secret-key-for-jwt-signing", sign: { expiresIn: "2d" } });
  app.register(prismaPlugin);
  app.setErrorHandler(globalErrorHandler);

  app.register(refresh_token, { prefix: "/api" });
  app.register(logout_user, { prefix: "/api" });

  await app.ready();
  return app;
}

function cookieHeader(name: string, value: string): string {
  return `${name}=${value}`;
}

describe("Auth - POST /api/usuario/refresh", () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = await buildApp();
  });

  afterAll(async () => {
    await app.close();
  });

  it("deve retornar 401 se refresh_token não estiver no cookie", async () => {
    const res = await app.inject({ method: "POST", url: "/api/usuario/refresh" });
    expect(res.statusCode).toBe(401);
    const body = res.json();
    expect(body.mensagem).toContain("não fornecido");
  });

  it("deve retornar 401 se refresh_token for inválido", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/api/usuario/refresh",
      headers: { cookie: cookieHeader("refresh_token", "token-invalido") },
    });
    expect(res.statusCode).toBe(401);
    const body = res.json();
    expect(body.mensagem).toContain("inválido ou expirado");
  });

  it("deve retornar 200 com novo access token (happy path)", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/api/usuario/refresh",
      headers: { cookie: cookieHeader("refresh_token", "valid-refresh-token") },
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.status).toBe("sucesso");
    expect(body.usuario).toHaveProperty("id");
    expect(body.usuario).toHaveProperty("nome");
    expect(body.usuario).toHaveProperty("email");
  });

  describe("rotação e reuso", () => {
    const refreshComToken = () => app.inject({
      method: "POST",
      url: "/api/usuario/refresh",
      headers: { cookie: cookieHeader("refresh_token", "valid-refresh-token") },
    });

    beforeEach(() => {
      tokenEstado = { used: false, usedAt: null };
      claimCount = 1;
      deleteManyCalls = [];
    });

    it("perdeu a corrida pela reivindicação atômica → 409 sem limpar cookies", async () => {
      claimCount = 0;
      const res = await refreshComToken();
      expect(res.statusCode).toBe(409);
      expect(res.headers["set-cookie"]).toBeUndefined();
      expect(deleteManyCalls).toHaveLength(0);
    });

    it("token já usado há poucos segundos (outra aba) → 409 sem derrubar sessões", async () => {
      tokenEstado = { used: true, usedAt: new Date(Date.now() - 2_000) };
      const res = await refreshComToken();
      expect(res.statusCode).toBe(409);
      expect(res.headers["set-cookie"]).toBeUndefined();
      expect(deleteManyCalls).toHaveLength(0);
    });

    it("token já usado fora da janela (reuso) → 401 e apaga todas as sessões do usuário", async () => {
      tokenEstado = { used: true, usedAt: new Date(Date.now() - 60_000) };
      const res = await refreshComToken();
      expect(res.statusCode).toBe(401);
      expect(deleteManyCalls).toEqual([{ where: { userId: VALID_UUID } }]);
    });
  });
});

describe("Auth - POST /api/usuario/logout", () => {
  let app: FastifyInstance;
  let token: string;

  beforeAll(async () => {
    app = await buildApp();
    token = app.jwt.sign({ id: VALID_UUID, nome: "Test User", email: "test@example.com" });
  });

  afterAll(async () => {
    await app.close();
  });

  it("deve retornar 200 ao fazer logout com refresh_token (happy path)", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/api/usuario/logout",
      headers: {
        Authorization: `Bearer ${token}`,
        cookie: cookieHeader("refresh_token", "valid-refresh-token"),
      },
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.status).toBe("sucesso");
    expect(body.mensagem).toContain("Logout");
  });

  it("deve retornar 200 mesmo sem refresh_token no cookie", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/api/usuario/logout",
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(res.statusCode).toBe(200);
  });
});
