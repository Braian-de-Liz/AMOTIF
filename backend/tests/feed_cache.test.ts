import { describe, it, expect, beforeEach } from "bun:test";
import Fastify from "fastify";
import fastifyJwt from "@fastify/jwt";
import fp from "fastify-plugin";
import type { FastifyInstance } from "fastify";
import { createFeedCache } from "../src/lib/feed_cache.js";
import { searth_feed } from "../src/routers/projetos/get_feed.js";
import { globalErrorHandler } from "../src/lib/global_Error.js";

// ---------- Cache isolado ----------

describe("createFeedCache", () => {
  it("devolve o valor antes do TTL e nada depois", () => {
    let agora = 0;
    const cache = createFeedCache<string>({ ttlMs: 1000, now: () => agora });

    cache.set("a", "valor");
    agora = 999;
    expect(cache.get("a")).toBe("valor");

    agora = 1000;
    expect(cache.get("a")).toBeUndefined();
    expect(cache.size).toBe(0);
  });

  it("nunca passa do limite de entradas", () => {
    const cache = createFeedCache<number>({ maxEntries: 3, ttlMs: 60_000 });

    for (let i = 0; i < 50; i++) cache.set(`k${i}`, i);

    expect(cache.size).toBe(3);
    expect(cache.get("k49")).toBe(49);
    expect(cache.get("k0")).toBeUndefined();
  });

  it("remove a entrada menos usada recentemente (LRU)", () => {
    const cache = createFeedCache<number>({ maxEntries: 2, ttlMs: 60_000 });

    cache.set("a", 1);
    cache.set("b", 2);
    cache.get("a"); // "a" passa a ser a mais recente
    cache.set("c", 3); // deve expulsar "b"

    expect(cache.get("a")).toBe(1);
    expect(cache.get("b")).toBeUndefined();
    expect(cache.get("c")).toBe(3);
  });

  it("respeita o teto em bytes e expulsa as menos usadas", () => {
    const grande = "x".repeat(100);
    const tamanho = JSON.stringify(grande).length;
    const cache = createFeedCache<string>({ maxBytes: tamanho * 2, maxEntries: 1000 });

    cache.set("a", grande);
    cache.set("b", grande);
    cache.set("c", grande);

    expect(cache.bytes).toBeLessThanOrEqual(tamanho * 2);
    expect(cache.get("a")).toBeUndefined();
    expect(cache.get("c")).toBe(grande);
  });

  it("não guarda um valor maior que o teto inteiro", () => {
    const cache = createFeedCache<string>({ maxBytes: 50 });
    cache.set("gigante", "y".repeat(1000));

    expect(cache.size).toBe(0);
    expect(cache.bytes).toBe(0);
  });

  it("clear esvazia tudo", () => {
    const cache = createFeedCache<number>();
    cache.set("a", 1);
    cache.clear();
    expect(cache.size).toBe(0);
  });
});

// ---------- Feed com cache ----------

type Contador = { findMany: number; like: number; favorite: number };

function montarApp() {
  const contador: Contador = { findMany: 0, like: 0, favorite: 0 };

  const linha = (id: string, titulo: string) => ({
    id,
    titulo,
    genero: "ROCK",
    bpm: 120,
    escala: null,
    descricao: null,
    status: "IDEIA",
    audio_guia: `raw/${id}.mp3`,
    createdAt: new Date("2026-01-01T00:00:00Z"),
    autor: { id: "autor", nome_completo: "Autor Teste", avatar_url: null, instrumentos: [] },
    _count: { likes: 0, camadas: 0, colaboradores: 0 },
  });

  const prisma = {
    projeto: {
      findMany: async () => {
        contador.findMany++;
        return [linha("11111111-1111-4111-8111-111111111111", "A"), linha("22222222-2222-4222-8222-222222222222", "B")];
      },
    },
    like: {
      findMany: async (args: any) => {
        contador.like++;
        return args.where.userId === "user-curtiu" ? [{ projetoId: "11111111-1111-4111-8111-111111111111" }] : [];
      },
    },
    favorite: {
      findMany: async () => {
        contador.favorite++;
        return [];
      },
    },
  };

  // Assinador falso: prefixa a URL para provar que a assinatura é feita a cada requisição.
  const storage = {
    signUrls: async (paths: string[]) => new Map(paths.map((p) => [p, `signed:${p}`])),
  };

  const app: FastifyInstance = Fastify();
  app.register(fastifyJwt, { secret: "test-secret-key-for-feed-cache" });
  app.register(fp(async (f) => {
    f.decorate("prisma", prisma as any);
    f.decorate("storage", storage as any);
  }));
  app.setErrorHandler(globalErrorHandler);
  app.register(searth_feed, { prefix: "/api" });

  return { app, contador };
}

describe("GET /api/projetos/feed com cache em memória", () => {
  let app: FastifyInstance;
  let contador: Contador;
  let tokenA: string;
  let tokenB: string;

  beforeEach(async () => {
    ({ app, contador } = montarApp());
    await app.ready();
    tokenA = app.jwt.sign({ id: "user-curtiu", nome: "A", email: "a@x.com" });
    tokenB = app.jwt.sign({ id: "user-outro", nome: "B", email: "b@x.com" });
  });

  const pedir = (url: string, token: string) =>
    app.inject({ method: "GET", url, headers: { Authorization: `Bearer ${token}` } });

  it("consulta o banco só na primeira vez para a mesma chave", async () => {
    await pedir("/api/projetos/feed", tokenA);
    await pedir("/api/projetos/feed", tokenA);
    await pedir("/api/projetos/feed", tokenB);

    expect(contador.findMany).toBe(1);
  });

  it("mantém userHasLiked por usuário mesmo com resposta em cache", async () => {
    const a = (await pedir("/api/projetos/feed", tokenA)).json().projetos;
    const b = (await pedir("/api/projetos/feed", tokenB)).json().projetos;

    expect(a[0].userHasLiked).toBe(true);
    expect(b[0].userHasLiked).toBe(false);
    expect(contador.findMany).toBe(1);
  });

  it("assina as URLs de áudio a cada requisição, não as guarda no cache", async () => {
    const res = (await pedir("/api/projetos/feed", tokenA)).json();
    expect(res.projetos[0].audio_guia).toBe("signed:raw/11111111-1111-4111-8111-111111111111.mp3");
  });

  it("trata instrumentoFaltante sem diferenciar maiúsculas na chave", async () => {
    await pedir("/api/projetos/feed?instrumentoFaltante=baixo", tokenA);
    await pedir("/api/projetos/feed?instrumentoFaltante=BAIXO", tokenA);

    expect(contador.findMany).toBe(1);
  });

  it("filtros diferentes geram entradas diferentes", async () => {
    await pedir("/api/projetos/feed?genero=ROCK", tokenA);
    await pedir("/api/projetos/feed?genero=POP", tokenA);

    expect(contador.findMany).toBe(2);
  });
});
