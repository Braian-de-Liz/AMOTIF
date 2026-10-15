import { describe, it, expect, beforeAll, afterAll } from "bun:test";
import Fastify from "fastify";
import fastifyJwt from "@fastify/jwt";
import type { FastifyInstance } from "fastify";
import fp from "fastify-plugin";
import { PrismaClient } from "@prisma/client";
import { invite_links } from "../src/routers/colaboration/invite_links.js";
import { join_by_link } from "../src/routers/colaboration/join_by_link.js";
import { globalErrorHandler } from "../src/lib/global_Error.js";

const PROJETO_ID = "123e4567-e89b-12d3-a456-426614174000";
const LINK_ID = "223e4567-e89b-12d3-a456-426614174000";
const DONO_ID = "dono-id";
const USER_ID = "user-id";
const TOKEN_LINK = "token-de-link-valido-123";

const futuro = () => new Date(Date.now() + 24 * 60 * 60 * 1000);

// Estado mutável para cada teste ajustar o cenário.
let linkRow: any;
let colaboradorExistente: any;
let usosAtualizados: number;

const mockPrisma: any = {
  projeto: {
    findUnique: async () => ({ id: PROJETO_ID, userId: DONO_ID, deletedAt: null }),
  },
  conviteLink: {
    create: async ({ data }: any) => ({ id: LINK_ID, usos: 0, ...data }),
    findMany: async () => [
      { id: LINK_ID, token: "a", cargo: "membro", max_usos: 5, usos: 5, expira_em: futuro() },
      { id: "outro", token: "b", cargo: "membro", max_usos: 5, usos: 1, expira_em: futuro() },
    ],
    findUnique: async () => linkRow,
    updateMany: async ({ where, data }: any) => {
      if (data.revogadoEm) return { count: where.id === LINK_ID ? 1 : 0 };
      // incremento condicional de usos
      if (linkRow.usos >= linkRow.max_usos) return { count: 0 };
      linkRow.usos += 1;
      usosAtualizados = linkRow.usos;
      return { count: 1 };
    },
  },
  colaborador: {
    findUnique: async () => colaboradorExistente,
    create: async ({ data }: any) => ({ id: "colab", ...data }),
  },
  $transaction: async (fn: any) => fn(mockPrisma),
};

const prismaPlugin = fp(async (fastify: FastifyInstance) => {
  fastify.decorate("prisma", mockPrisma as unknown as PrismaClient);
});

async function buildApp(): Promise<FastifyInstance> {
  const app = Fastify();
  app.register(fastifyJwt, { secret: "test-secret-key-for-jwt-signing", sign: { expiresIn: "2d" } });
  app.register(prismaPlugin);
  app.setErrorHandler(globalErrorHandler);
  app.register(invite_links, { prefix: "/api" });
  app.register(join_by_link, { prefix: "/api" });
  await app.ready();
  return app;
}

function novoLink(overrides: any = {}) {
  return {
    id: LINK_ID,
    projetoId: PROJETO_ID,
    token: TOKEN_LINK,
    cargo: "guitarrista",
    max_usos: 2,
    usos: 0,
    expira_em: futuro(),
    revogadoEm: null,
    projeto: { id: PROJETO_ID, titulo: "Meu Projeto", genero: "ROCK", userId: DONO_ID, deletedAt: null },
    criadoPor: { nome_completo: "Dono" },
    ...overrides,
  };
}

describe("Convite por link - dono", () => {
  let app: FastifyInstance;
  let tokenDono: string;
  let tokenOutro: string;

  beforeAll(async () => {
    app = await buildApp();
    tokenDono = app.jwt.sign({ id: DONO_ID, nome: "Dono", email: "dono@example.com" });
    tokenOutro = app.jwt.sign({ id: USER_ID, nome: "User", email: "user@example.com" });
  });
  afterAll(async () => { await app.close(); });

  it("401 sem autenticação", async () => {
    const res = await app.inject({ method: "POST", url: `/api/colaboration/${PROJETO_ID}/invite-link`, payload: {} });
    expect(res.statusCode).toBe(401);
  });

  it("403 se não for o dono", async () => {
    const res = await app.inject({
      method: "POST",
      url: `/api/colaboration/${PROJETO_ID}/invite-link`,
      headers: { Authorization: `Bearer ${tokenOutro}` },
      payload: {},
    });
    expect(res.statusCode).toBe(403);
  });

  it("201 cria link com padrões (membro, 10 usos, 7 dias) e token aleatório", async () => {
    const res = await app.inject({
      method: "POST",
      url: `/api/colaboration/${PROJETO_ID}/invite-link`,
      headers: { Authorization: `Bearer ${tokenDono}` },
      payload: {},
    });
    expect(res.statusCode).toBe(201);
    const { link } = res.json();
    expect(link.cargo).toBe("membro");
    expect(link.max_usos).toBe(10);
    expect(link.token.length).toBeGreaterThanOrEqual(30);
  });

  it("400 se max_usos fora do limite", async () => {
    const res = await app.inject({
      method: "POST",
      url: `/api/colaboration/${PROJETO_ID}/invite-link`,
      headers: { Authorization: `Bearer ${tokenDono}` },
      payload: { max_usos: 1000 },
    });
    expect(res.statusCode).toBe(400);
  });

  it("lista só links com usos restantes", async () => {
    const res = await app.inject({
      method: "GET",
      url: `/api/colaboration/${PROJETO_ID}/invite-links`,
      headers: { Authorization: `Bearer ${tokenDono}` },
    });
    expect(res.statusCode).toBe(200);
    expect(res.json().links.map((l: any) => l.token)).toEqual(["b"]);
  });

  it("revoga link existente e 404 para inexistente", async () => {
    const ok = await app.inject({
      method: "DELETE",
      url: `/api/colaboration/${PROJETO_ID}/invite-link/${LINK_ID}`,
      headers: { Authorization: `Bearer ${tokenDono}` },
    });
    expect(ok.statusCode).toBe(200);

    const naoExiste = await app.inject({
      method: "DELETE",
      url: `/api/colaboration/${PROJETO_ID}/invite-link/323e4567-e89b-12d3-a456-426614174000`,
      headers: { Authorization: `Bearer ${tokenDono}` },
    });
    expect(naoExiste.statusCode).toBe(404);
  });
});

describe("Convite por link - entrar", () => {
  let app: FastifyInstance;
  let tokenUser: string;
  let tokenDono: string;

  beforeAll(async () => {
    app = await buildApp();
    tokenUser = app.jwt.sign({ id: USER_ID, nome: "User", email: "user@example.com" });
    tokenDono = app.jwt.sign({ id: DONO_ID, nome: "Dono", email: "dono@example.com" });
  });
  afterAll(async () => { await app.close(); });

  const entrar = (token: string) =>
    app.inject({
      method: "POST",
      url: `/api/invite-link/${TOKEN_LINK}`,
      headers: { Authorization: `Bearer ${token}` },
    });

  it("401 sem autenticação", async () => {
    linkRow = novoLink();
    const res = await app.inject({ method: "POST", url: `/api/invite-link/${TOKEN_LINK}` });
    expect(res.statusCode).toBe(401);
  });

  it("preview mostra projeto e cargo", async () => {
    linkRow = novoLink();
    const res = await app.inject({
      method: "GET",
      url: `/api/invite-link/${TOKEN_LINK}`,
      headers: { Authorization: `Bearer ${tokenUser}` },
    });
    expect(res.statusCode).toBe(200);
    expect(res.json().projeto.titulo).toBe("Meu Projeto");
    expect(res.json().cargo).toBe("guitarrista");
  });

  it("201 entra como colaborador e consome um uso", async () => {
    linkRow = novoLink();
    colaboradorExistente = null;
    const res = await entrar(tokenUser);
    expect(res.statusCode).toBe(201);
    expect(res.json().projetoId).toBe(PROJETO_ID);
    expect(usosAtualizados).toBe(1);
  });

  it("404 para token inexistente", async () => {
    linkRow = null;
    expect((await entrar(tokenUser)).statusCode).toBe(404);
  });

  it("404 para link revogado", async () => {
    linkRow = novoLink({ revogadoEm: new Date() });
    expect((await entrar(tokenUser)).statusCode).toBe(404);
  });

  it("410 para link expirado", async () => {
    linkRow = novoLink({ expira_em: new Date(Date.now() - 1000) });
    expect((await entrar(tokenUser)).statusCode).toBe(410);
  });

  it("410 quando atinge o limite de usos", async () => {
    linkRow = novoLink({ usos: 2, max_usos: 2 });
    expect((await entrar(tokenUser)).statusCode).toBe(410);
  });

  it("409 se o usuário já for colaborador, sem consumir uso", async () => {
    linkRow = novoLink();
    colaboradorExistente = { id: "ja" };
    const res = await entrar(tokenUser);
    expect(res.statusCode).toBe(409);
    expect(linkRow.usos).toBe(0);
  });

  it("409 se for o dono do projeto", async () => {
    linkRow = novoLink();
    colaboradorExistente = null;
    expect((await entrar(tokenDono)).statusCode).toBe(409);
  });

  it("410 se o limite for atingido por corrida entre a leitura e o incremento", async () => {
    linkRow = novoLink({ usos: 0, max_usos: 1 });
    colaboradorExistente = null;
    // Outro usuário consome o último uso depois que o link foi lido como válido.
    const original = mockPrisma.conviteLink.findUnique;
    mockPrisma.conviteLink.findUnique = async () => {
      const lido = { ...linkRow };
      linkRow.usos = 1;
      return lido;
    };
    const res = await entrar(tokenUser);
    mockPrisma.conviteLink.findUnique = original;
    expect(res.statusCode).toBe(410);
  });
});
