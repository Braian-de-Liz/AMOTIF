// Comentários marcados no tempo: quem vê, quem comenta, quem edita, resolve e apaga.
import { describe, it, expect, beforeAll, afterAll, beforeEach } from "bun:test";
import Fastify from "fastify";
import fastifyJwt from "@fastify/jwt";
import type { FastifyInstance } from "fastify";
import fp from "fastify-plugin";
import { PrismaClient } from "@prisma/client";
import { globalErrorHandler } from "../src/lib/global_Error.js";

import { listar_comentarios } from "../src/routers/comentarios/listar_comentarios.js";
import { criar_comentario } from "../src/routers/comentarios/criar_comentario.js";
import { atualizar_comentario } from "../src/routers/comentarios/atualizar_comentario.js";
import { deletar_comentario } from "../src/routers/comentarios/deletar_comentario.js";

const DONO = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
const AUTOR_CAMADA = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa"; // músico que enviou a camada
const COLAB = "cccccccc-cccc-4ccc-8ccc-cccccccccccc";        // papel configurável
const ESTRANHO = "dddddddd-dddd-4ddd-8ddd-dddddddddddd";
const PROJETO = "11111111-1111-4111-8111-111111111111";
const CAMADA = "33333333-3333-4333-8333-333333333333";
const COMENTARIO = "77777777-7777-4777-8777-777777777777";

// ---------- estado do mock ----------
let colabPapel: string;
let camadaApagada: boolean;
let comentarios: any[];
let notificacoes: any[];

const autores: Record<string, { id: string; nome_completo: string; avatar_url: null }> = Object.fromEntries(
    [DONO, AUTOR_CAMADA, COLAB, ESTRANHO].map((id) => [id, { id, nome_completo: `User ${id.slice(0, 4)}`, avatar_url: null }])
);

function resetState() {
    colabPapel = "MUSICO";
    camadaApagada = false;
    notificacoes = [];
    comentarios = [{
        id: COMENTARIO, camadaId: CAMADA, autorId: COLAB, segundos: 12.5, texto: "baixo atravessa aqui",
        versaoNumero: 1, resolvido: false, createdAt: new Date(), updatedAt: new Date(),
    }];
}

const comAutor = (c: any) => ({ ...c, autor: autores[c.autorId] });

const mockPrisma: any = {
    camada: {
        findUnique: async ({ where }: any) => where.id !== CAMADA ? null : {
            id: CAMADA, userId: AUTOR_CAMADA, deletedAt: camadaApagada ? new Date() : null, nome_trilha: "Baixo",
            currentVersion: { versionNumber: 2 },
            projeto: { id: PROJETO, userId: DONO, titulo: "Samba", deletedAt: null },
        },
    },
    colaborador: {
        findUnique: async ({ where }: any) => {
            const k = where.userId_projetoId;
            if (k?.projetoId !== PROJETO) return null;
            if (k.userId === COLAB) return { papel: colabPapel };
            if (k.userId === AUTOR_CAMADA) return { papel: "MUSICO" };
            return null;
        },
    },
    comentario: {
        findMany: async () => [...comentarios].sort((a, b) => a.segundos - b.segundos).map(comAutor),
        findUnique: async ({ where }: any) => comentarios.find((c) => c.id === where.id) ?? null,
        create: async ({ data }: any) => {
            const c = { id: "88888888-8888-4888-8888-888888888888", resolvido: false, createdAt: new Date(), updatedAt: new Date(), ...data };
            comentarios.push(c);
            return comAutor(c);
        },
        update: async ({ where, data }: any) => {
            const c = comentarios.find((x) => x.id === where.id);
            Object.assign(c, data, { updatedAt: new Date() });
            return comAutor(c);
        },
        delete: async ({ where }: any) => { comentarios = comentarios.filter((c) => c.id !== where.id); return {}; },
    },
    notification: { create: async ({ data }: any) => { notificacoes.push(data); return {}; } },
};

const infraMock = fp(async (fastify: FastifyInstance) => {
    fastify.decorate("prisma", mockPrisma as unknown as PrismaClient);
});

let app: FastifyInstance;
let baseUrl: string;
const auth = (id: string) => ({ Authorization: `Bearer ${app.jwt.sign({ id, nome: "Fulano", email: "x@example.com" })}` });

// Servidor real + fetch, como em authorization.test.ts (o inject no Bun continua o handler após resposta de hook).
async function http(opts: { method: string; url: string; who: string; payload?: unknown }) {
    const headers: Record<string, string> = { ...auth(opts.who), "content-type": "application/json" };
    const body = opts.method === "GET" ? undefined : JSON.stringify(opts.payload ?? {});
    if (opts.method === "GET") delete headers["content-type"];
    const res = await fetch(`${baseUrl}${opts.url}`, { method: opts.method, headers, body });
    const text = await res.text();
    return { statusCode: res.status, json: () => JSON.parse(text) };
}

beforeAll(async () => {
    app = Fastify();
    app.register(fastifyJwt, { secret: "test-secret-key-for-jwt-signing" });
    app.register(infraMock);
    app.setErrorHandler(globalErrorHandler);
    for (const plugin of [listar_comentarios, criar_comentario, atualizar_comentario, deletar_comentario]) {
        app.register(plugin as any, { prefix: "/api" });
    }
    await app.ready();
    await app.listen({ port: 0, host: "127.0.0.1" });
    baseUrl = `http://127.0.0.1:${(app.server.address() as any).port}`;
});

afterAll(async () => { await app.close(); });
beforeEach(resetState);

const listar = (who: string) => http({ method: "GET", url: `/api/layer/${CAMADA}/comentarios`, who });
const criar = (who: string, payload: unknown = { segundos: 42.3, texto: "  entra meio atrasado  " }) =>
    http({ method: "POST", url: `/api/layer/${CAMADA}/comentarios`, who, payload });
const atualizar = (who: string, payload: unknown) => http({ method: "PATCH", url: `/api/comentarios/${COMENTARIO}`, who, payload });
const apagar = (who: string) => http({ method: "DELETE", url: `/api/comentarios/${COMENTARIO}`, who });

describe("Comentários - listar", () => {
    it("participante vê os comentários com autor", async () => {
        const res = await listar(DONO);
        expect(res.statusCode).toBe(200);
        const [c] = res.json().comentarios;
        expect(c).toMatchObject({ segundos: 12.5, texto: "baixo atravessa aqui", versaoNumero: 1, resolvido: false });
        expect(c.autor.id).toBe(COLAB);
    });

    it("ouvinte também vê", async () => {
        colabPapel = "OUVINTE";
        expect((await listar(COLAB)).statusCode).toBe(200);
    });

    it("usuário de fora do projeto → 403", async () => {
        expect((await listar(ESTRANHO)).statusCode).toBe(403);
    });

    it("camada apagada → 404", async () => {
        camadaApagada = true;
        expect((await listar(DONO)).statusCode).toBe(404);
    });
});

describe("Comentários - criar", () => {
    it("ouvinte comenta; texto é aparado e a versão atual é registrada", async () => {
        colabPapel = "OUVINTE";
        const res = await criar(COLAB);
        expect(res.statusCode).toBe(201);
        expect(res.json().comentario).toMatchObject({ segundos: 42.3, texto: "entra meio atrasado", versaoNumero: 2 });
    });

    it("notifica o autor da camada com o instante formatado", async () => {
        await criar(DONO);
        expect(notificacoes).toHaveLength(1);
        expect(notificacoes[0]).toMatchObject({ userId: AUTOR_CAMADA, actorId: DONO, tipo: "NEW_COMMENT", projetoId: PROJETO });
        expect(notificacoes[0].mensagem).toContain("0:42");
    });

    it("autor da camada comentando a própria camada não gera notificação", async () => {
        await criar(AUTOR_CAMADA);
        expect(notificacoes).toHaveLength(0);
    });

    it("usuário de fora → 403 e nada é gravado", async () => {
        const res = await criar(ESTRANHO);
        expect(res.statusCode).toBe(403);
        expect(comentarios).toHaveLength(1);
    });

    it("texto só com espaços → 400", async () => {
        expect((await criar(DONO, { segundos: 1, texto: "   " })).statusCode).toBe(400);
    });

    it("posição negativa ou texto longo demais → 400", async () => {
        expect((await criar(DONO, { segundos: -1, texto: "x" })).statusCode).toBe(400);
        expect((await criar(DONO, { segundos: 1, texto: "x".repeat(501) })).statusCode).toBe(400);
    });
});

describe("Comentários - editar e resolver", () => {
    it("autor do comentário edita o texto", async () => {
        const res = await atualizar(COLAB, { texto: "corrigido" });
        expect(res.statusCode).toBe(200);
        expect(res.json().comentario.texto).toBe("corrigido");
    });

    it("outra pessoa não edita o texto, nem o dono → 403", async () => {
        expect((await atualizar(DONO, { texto: "não" })).statusCode).toBe(403);
        expect(comentarios[0].texto).toBe("baixo atravessa aqui");
    });

    it("autor da camada, dono e produtor resolvem", async () => {
        for (const who of [AUTOR_CAMADA, DONO]) {
            const res = await atualizar(who, { resolvido: true });
            expect(res.statusCode).toBe(200);
            expect(res.json().comentario.resolvido).toBe(true);
        }
    });

    it("músico que não escreveu nem é autor da camada não resolve → 403", async () => {
        comentarios[0].autorId = DONO;
        colabPapel = "MUSICO";
        expect((await atualizar(COLAB, { resolvido: true })).statusCode).toBe(403);
    });

    it("produtor resolve comentário de outra pessoa", async () => {
        comentarios[0].autorId = DONO;
        colabPapel = "PRODUTOR";
        expect((await atualizar(COLAB, { resolvido: true })).statusCode).toBe(200);
    });

    it("corpo vazio → 400; comentário inexistente → 404", async () => {
        expect((await atualizar(COLAB, {})).statusCode).toBe(400);
        comentarios = [];
        expect((await atualizar(COLAB, { resolvido: true })).statusCode).toBe(404);
    });

    it("usuário de fora não descobre o comentário → 404", async () => {
        expect((await atualizar(ESTRANHO, { resolvido: true })).statusCode).toBe(404);
    });
});

describe("Comentários - apagar", () => {
    it("autor do comentário apaga", async () => {
        expect((await apagar(COLAB)).statusCode).toBe(200);
        expect(comentarios).toHaveLength(0);
    });

    it("dono do projeto apaga comentário de outra pessoa", async () => {
        expect((await apagar(DONO)).statusCode).toBe(200);
    });

    it("autor da camada não apaga comentário alheio → 403", async () => {
        expect((await apagar(AUTOR_CAMADA)).statusCode).toBe(403);
        expect(comentarios).toHaveLength(1);
    });
});
