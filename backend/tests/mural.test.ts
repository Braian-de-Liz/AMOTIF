import { describe, it, expect, beforeAll, afterAll } from "bun:test";
import Fastify from "fastify";
import cors from "@fastify/cors";
import fastifyJwt from "@fastify/jwt";
import type { FastifyInstance } from "fastify";
import fp from "fastify-plugin";
import { PrismaClient } from "@prisma/client";
import { Deletar_Comentario } from "../src/routers/projetos/mural_delete.js";
import { globalErrorHandler } from "../src/lib/global_Error.js";

const VALID_UUID = "123e4567-e89b-12d3-a456-426614174000";
const OTHER_UUID = "223e4567-e89b-12d3-a456-426614174001";

const mockPrisma = {
  muralPost: {
    findUnique: async (args: any) => {
      if (args.where?.id === VALID_UUID) {
        return { id: VALID_UUID, autorId: VALID_UUID, projetoId: VALID_UUID };
      }
      return null;
    },
    delete: async () => ({}),
  },
  projeto: {
    findUnique: async (args: any) => {
      if (args.where?.id === VALID_UUID) {
        return { id: VALID_UUID, userId: VALID_UUID };
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

  app.register(Deletar_Comentario, { prefix: "/api" });

  await app.ready();
  return app;
}

describe("Mural Delete - DELETE /api/projetos/:projetoId/mural/:comentarioId", () => {
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
    const res = await app.inject({
      method: "DELETE",
      url: `/api/projetos/${VALID_UUID}/mural/${VALID_UUID}`,
    });
    expect(res.statusCode).toBe(401);
  });

  it("deve retornar 400 se IDs não forem UUID", async () => {
    const res = await app.inject({
      method: "DELETE",
      url: "/api/projetos/id-invalido/mural/id-invalido",
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(res.statusCode).toBe(400);
  });

  it("deve retornar 404 se comentário não existir", async () => {
    const res = await app.inject({
      method: "DELETE",
      url: `/api/projetos/${VALID_UUID}/mural/${OTHER_UUID}`,
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(res.statusCode).toBe(404);
    const body = res.json();
    expect(body.mensagem).toContain("não encontrado");
  });

  it("deve retornar 200 ao deletar comentário próprio (happy path)", async () => {
    const res = await app.inject({
      method: "DELETE",
      url: `/api/projetos/${VALID_UUID}/mural/${VALID_UUID}`,
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.status).toBe("sucesso");
    expect(body.mensagem).toContain("excluído");
  });

  it("deve retornar 403 se usuário não for autor nem dono do projeto", async () => {
    const mockPrismaOther = {
      ...mockPrisma,
      muralPost: {
        findUnique: async () => ({ id: VALID_UUID, autorId: OTHER_UUID, projetoId: VALID_UUID }),
        delete: async () => ({}),
      },
      projeto: {
        findUnique: async () => ({ id: VALID_UUID, userId: OTHER_UUID }),
      },
    };

    const appOther = Fastify();
    appOther.register(cors, { origin: true });
    appOther.register(fastifyJwt, { secret: "test-secret-key-for-jwt-signing", sign: { expiresIn: "2d" } });
    appOther.register(
      fp(async (fastify: FastifyInstance) => {
        fastify.decorate("prisma", mockPrismaOther as unknown as PrismaClient);
        fastify.decorate("notiType", {});
      })
    );
    appOther.setErrorHandler(globalErrorHandler);
    appOther.register(Deletar_Comentario, { prefix: "/api" });
    await appOther.ready();

    const otherToken = appOther.jwt.sign({ id: VALID_UUID, nome: "Outro", email: "outro@test.com" });
    const res = await appOther.inject({
      method: "DELETE",
      url: `/api/projetos/${VALID_UUID}/mural/${VALID_UUID}`,
      headers: { Authorization: `Bearer ${otherToken}` },
    });
    expect(res.statusCode).toBe(403);
    await appOther.close();
  });
});
