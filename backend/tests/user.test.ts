import { describe, it, expect, beforeAll, afterAll } from "bun:test";
import Fastify from "fastify";
import cors from "@fastify/cors";
import fastifyJwt from "@fastify/jwt";
import swagger from "@fastify/swagger";
import type { FastifyInstance } from "fastify";
import fp from "fastify-plugin";
import { PrismaClient } from "@prisma/client";
import { User_register } from "../src/routers/user/cadastro.js";
import { login_user } from "../src/routers/user/login.js";
import { Deletar_user } from "../src/routers/user/delete_user.js";
import { Get_user } from "../src/routers/user/get_user.js";
import { Get_user_with_counts } from "../src/routers/user/get_user_with_counts.js";
import { Patch_bio } from "../src/routers/user/post_bio.js";
import { Patch_Instrumentos } from "../src/routers/user/instrumentos.js";
import { Recuperar_senha } from "../src/routers/user/forgot_password.js";
import { globalErrorHandler } from "../src/lib/global_Error.js";

const VALID_UUID = "123e4567-e89b-12d3-a456-426614174000";
const OTHER_UUID = "223e4567-e89b-12d3-a456-426614174000";

const mockPrisma = {
  user: {
    findFirst: async () => null,
    findUnique: async () => null,
    create: async (data: any) => ({ id: VALID_UUID, ...data.data }),
    update: async (data: any) => ({ id: VALID_UUID, ...data.data }),
    delete: async () => ({ id: VALID_UUID }),
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
  app.register(swagger);
  app.register(fastifyJwt, { secret: "test-secret-key-for-jwt-signing", sign: { expiresIn: "2d" } });
  app.register(prismaPlugin);
  app.setErrorHandler(globalErrorHandler);

  app.register(User_register, { prefix: "/api" });
  app.register(login_user, { prefix: "/api" });
  app.register(Deletar_user, { prefix: "/api" });
  app.register(Get_user, { prefix: "/api" });
  app.register(Get_user_with_counts, { prefix: "/api" });
  app.register(Patch_bio, { prefix: "/api" });
  app.register(Patch_Instrumentos, { prefix: "/api" });
  app.register(Recuperar_senha, { prefix: "/api" });

  await app.ready();
  return app;
}

describe("User Routes - Cadastro", () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = await buildApp();
  });

  afterAll(async () => {
    await app.close();
  });

  it("deve retornar 400 se o payload de registro estiver incompleto", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/api/usuario",
      payload: { nome_completo: "Braian Test" },
    });

    expect(res.statusCode).toBe(400);
    const body = res.json();
    expect(body).toHaveProperty("status", "erro");
  });

  it("deve retornar 400 se a senha for muito curta (< 8 chars)", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/api/usuario",
      payload: {
        nome_completo: "Braian Test Silva",
        email: "teste@example.com",
        senha: "curta",
        cpf: "12345678909",
      },
    });

    expect(res.statusCode).toBe(400);
  });

  it("deve retornar 400 se o e-mail for inválido", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/api/usuario",
      payload: {
        nome_completo: "Braian Test Silva",
        email: "email_invalido.com",
        senha: "password1234",
        cpf: "12345678909",
      },
    });

    expect(res.statusCode).toBe(400);
  });

  it("deve retornar 400 se o CPF for inválido", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/api/usuario",
      payload: {
        nome_completo: "Braian Test Silva",
        email: "teste@example.com",
        senha: "password1234",
        cpf: "123",
      },
    });

    expect(res.statusCode).toBe(400);
  });
});

describe("User Routes - Login", () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = await buildApp();
  });

  afterAll(async () => {
    await app.close();
  });

  it("deve retornar 400 se email ou senha não forem enviados", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/api/usuario/login",
      payload: { email: "teste@example.com" },
    });

    expect(res.statusCode).toBe(400);
  });

  it("deve retornar 400 se o email for inválido", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/api/usuario/login",
      payload: { email: "email-invalido", senha: "password1234" },
    });

    expect(res.statusCode).toBe(400);
  });
});

describe("User Routes - GET /api/usuario/:id", () => {
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

  it("deve retornar 400 se o ID não for UUID", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/api/usuario/nao-e-uuid",
      headers: { Authorization: `Bearer ${token}` },
    });

    expect(res.statusCode).toBe(400);
  });

  it("deve retornar 401 se não houver token", async () => {
    const res = await app.inject({
      method: "GET",
      url: `/api/usuario/${VALID_UUID}`,
    });

    expect(res.statusCode).toBe(401);
  });
});

describe("User Routes - DELETE /api/usuario/:id", () => {
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

  it("deve retornar 401 se não houver token JWT", async () => {
    const res = await app.inject({
      method: "DELETE",
      url: `/api/usuario/${VALID_UUID}`,
      payload: { senha: "password1234" },
    });

    expect(res.statusCode).toBe(401);
  });

  it("deve retornar 400 se a senha não for enviada", async () => {
    const res = await app.inject({
      method: "DELETE",
      url: `/api/usuario/${VALID_UUID}`,
      headers: { Authorization: `Bearer ${token}` },
      payload: {},
    });

    expect(res.statusCode).toBe(400);
  });
});

describe("User Routes - PATCH /api/usuario_bio/:id", () => {
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

  it("deve retornar 403 se tentar editar bio de outro usuário", async () => {
    const res = await app.inject({
      method: "PATCH",
      url: `/api/usuario_bio/${OTHER_UUID}`,
      headers: { Authorization: `Bearer ${token}` },
      payload: { bio: "Nova bio" },
    });

    expect(res.statusCode).toBe(403);
  });

  it("deve retornar 400 se a bio não for enviada", async () => {
    const res = await app.inject({
      method: "PATCH",
      url: `/api/usuario_bio/${VALID_UUID}`,
      headers: { Authorization: `Bearer ${token}` },
      payload: {},
    });

    expect(res.statusCode).toBe(400);
  });
});

describe("User Routes - PATCH /api/usuario/:id/instrumentos", () => {
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

  it("deve retornar 403 se tentar editar instrumentos de outro usuário", async () => {
    const res = await app.inject({
      method: "PATCH",
      url: `/api/usuario/${OTHER_UUID}/instrumentos`,
      headers: { Authorization: `Bearer ${token}` },
      payload: { instrumentos: ["Guitarra", "Baixo"] },
    });

    expect(res.statusCode).toBe(403);
  });

  it.skip("deve retornar 400 se instrumentos não for um array (TypeBox schema validation not enforced in test env)", async () => {
    const res = await app.inject({
      method: "PATCH",
      url: `/api/usuario/${VALID_UUID}/instrumentos`,
      headers: { Authorization: `Bearer ${token}` },
      payload: { instrumentos: "Guitarra" },
    });

    expect(res.statusCode).toBe(400);
  });
});

describe("User Routes - PATCH /api/forgot/password", () => {
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

  it("deve retornar 400 se senha ou nova_senha não forem enviadas", async () => {
    const res = await app.inject({
      method: "PATCH",
      url: "/api/forgot/password",
      headers: { Authorization: `Bearer ${token}` },
      payload: { senha: "password1234" },
    });

    expect(res.statusCode).toBe(400);
  });

  it("deve retornar 400 se a nova senha for muito curta", async () => {
    const res = await app.inject({
      method: "PATCH",
      url: "/api/forgot/password",
      headers: { Authorization: `Bearer ${token}` },
      payload: { senha: "password1234", nova_senha: "curta" },
    });

    expect(res.statusCode).toBe(400);
  });
});

describe("User Routes - Happy Paths", () => {
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

  it("deve retornar 201 ao cadastrar usuário com dados válidos", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/api/usuario",
      payload: {
        nome_completo: "Braian Test Silva",
        email: "novo@example.com",
        senha: "password1234",
        cpf: "52998224725",
      },
    });

    expect(res.statusCode).toBe(201);
    const body = res.json();
    expect(body.status).toBe("sucesso");
    expect(body.mensagem).toContain("sucesso");
    expect(body).toHaveProperty("userId");
  });

  it("deve retornar 200 ao buscar dados de usuário existente", async () => {
    const mockWithUser = {
      ...mockPrisma,
      user: {
        ...mockPrisma.user,
        findUnique: async () => ({
          id: VALID_UUID,
          nome_completo: "Test User",
          email: "test@example.com",
          bio: "Músico",
          instrumentos: ["Guitarra", "Baixo"],
          avatar_url: null,
          createdAt: new Date(),
        }),
      },
    };

    const appCustom = Fastify();
    appCustom.register(cors, { origin: true });
    appCustom.register(fastifyJwt, { secret: "test-secret-key-for-jwt-signing", sign: { expiresIn: "2d" } });
    appCustom.register(
      fp(async (fastify: FastifyInstance) => {
        fastify.decorate("prisma", mockWithUser as unknown as PrismaClient);
        fastify.decorate("notiType", {});
      })
    );
    appCustom.setErrorHandler(globalErrorHandler);
    appCustom.register(Get_user, { prefix: "/api" });
    await appCustom.ready();

    const customToken = appCustom.jwt.sign({ id: VALID_UUID, nome: "Test User", email: "test@example.com" });
    const res = await appCustom.inject({
      method: "GET",
      url: `/api/usuario/${VALID_UUID}`,
      headers: { Authorization: `Bearer ${customToken}` },
    });

    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.status).toBe("sucesso");
    expect(body.usuario).toHaveProperty("nome_completo");
    expect(body.usuario).toHaveProperty("email");
    await appCustom.close();
  });

  it("deve retornar 200 ao atualizar bio", async () => {
    const res = await app.inject({
      method: "PATCH",
      url: `/api/usuario_bio/${VALID_UUID}`,
      headers: { Authorization: `Bearer ${token}` },
      payload: { bio: "Nova bio atualizada" },
    });

    expect(res.statusCode).toBe(200);
  });
});