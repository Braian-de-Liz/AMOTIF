// Regressões: recusar convite, exclusão com áudio ausente no Storage e e-mail sem diferenciar maiúsculas.
import { describe, it, expect, beforeAll, afterAll, beforeEach } from "bun:test";
import { audioUrlFor } from "./helpers/storage_env.js";
import Fastify from "fastify";
import fastifyJwt from "@fastify/jwt";
import type { FastifyInstance } from "fastify";
import fp from "fastify-plugin";
import { PrismaClient } from "@prisma/client";
import { globalErrorHandler } from "../src/lib/global_Error.js";
import { normalizarEmail, emailIgual } from "../src/lib/normalizar_email.js";
import { isObjetoInexistente } from "../src/lib/upload.js";
import { deleteOwnedAudios } from "../src/lib/safe_delete.js";

import { Reject_Invite } from "../src/routers/colaboration/reject_invite.js";
import { delete_layer } from "../src/routers/layers/delete_layer.js";
import { login_user } from "../src/routers/user/login.js";
import { User_register } from "../src/routers/user/cadastro.js";

const USER = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const DONO = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
const PROJETO = "11111111-1111-4111-8111-111111111111";
const CAMADA = "33333333-3333-4333-8333-333333333333";

// ---------- estado do mock ----------
let convites: { id: string; projetoId: string; email_destinatario: string }[];
let colaboradoresApagados: number;
let notificacoes: any[];
let eventos: string[];            // ordem das operações (banco x storage)
let storageFalhaEm: Set<string>;  // paths cujo delete no Storage lança erro
let usuarios: { id: string; email: string; senha: string; nome_completo: string }[];
let usuariosCriados: any[];

// Filtro de e-mail do Prisma: aceita string exata ou { equals, mode: "insensitive" }.
function bateEmail(valor: string, filtro: any) {
    if (typeof filtro === "string") return valor === filtro;
    return filtro.mode === "insensitive" ? valor.toLowerCase() === filtro.equals.toLowerCase() : valor === filtro.equals;
}

async function resetState() {
    convites = [
        { id: "c1", projetoId: PROJETO, email_destinatario: "maria@example.com" },
        { id: "c2", projetoId: PROJETO, email_destinatario: "maria@example.com" }, // convite repetido
        { id: "c3", projetoId: PROJETO, email_destinatario: "outra@example.com" },
    ];
    colaboradoresApagados = 0;
    notificacoes = [];
    eventos = [];
    storageFalhaEm = new Set();
    usuarios = [{
        id: USER, email: "Maria@Example.com", // conta antiga, gravada com maiúsculas
        senha: await Bun.password.hash("SenhaForte#1"), nome_completo: "Maria Teste",
    }];
    usuariosCriados = [];
}

const mockPrisma: any = {
    convite: {
        findFirst: async ({ where }: any) => {
            const c = convites.find((x) => x.projetoId === where.projetoId && bateEmail(x.email_destinatario, where.email_destinatario));
            return c ? { ...c, projeto: { userId: DONO, titulo: "Samba" } } : null;
        },
        deleteMany: async ({ where }: any) => {
            const antes = convites.length;
            convites = convites.filter((x) => !(x.projetoId === where.projetoId && bateEmail(x.email_destinatario, where.email_destinatario)));
            return { count: antes - convites.length };
        },
    },
    colaborador: {
        findFirst: async () => ({ id: "colab-row", projeto: { userId: DONO, titulo: "Samba" } }),
        delete: async () => { colaboradoresApagados++; return {}; },
    },
    camada: {
        findUnique: async ({ where }: any) => where.id !== CAMADA ? null : {
            userId: USER, deletedAt: null, audio_url: audioUrlFor(USER, "atual.mp3"),
            projeto: { userId: DONO, deletedAt: null, id: PROJETO },
            versions: [{ audio_url: audioUrlFor(USER, "v1.mp3"), autorId: USER }],
        },
        delete: async () => { eventos.push("db:delete-camada"); return {}; },
    },
    user: {
        findFirst: async ({ where }: any) => {
            if (where.email && !where.OR) return usuarios.find((u) => bateEmail(u.email, where.email)) ?? null;
            if (where.OR) return usuarios.find((u) => where.OR.some((c: any) => c.email && bateEmail(u.email, c.email))) ?? null;
            return null;
        },
        create: async ({ data }: any) => { usuariosCriados.push(data); return { id: "99999999-9999-4999-8999-999999999999", ...data }; },
    },
    refreshToken: { create: async () => ({}) },
    notification: { create: async ({ data }: any) => { notificacoes.push(data); return {}; } },
};

const infraMock = fp(async (fastify: FastifyInstance) => {
    fastify.decorate("prisma", mockPrisma as unknown as PrismaClient);
    fastify.decorate("storage", {
        uploadAudio: async () => ({ fileUrl: "", path: "" }),
        deleteAudio: async (path: string) => {
            eventos.push(`storage:${path.split("/").pop()}`);
            if (storageFalhaEm.has(path.split("/").pop()!)) throw new Error("Storage fora do ar");
        },
    } as any);
});

let app: FastifyInstance;
let baseUrl: string;
const auth = (id: string, email: string) => ({ Authorization: `Bearer ${app.jwt.sign({ id, nome: "Maria", email })}` });

async function http(method: string, url: string, headers: Record<string, string> = {}, payload?: unknown) {
    const h: Record<string, string> = { ...headers };
    let body: string | undefined;
    if (payload !== undefined) { h["content-type"] = "application/json"; body = JSON.stringify(payload); }
    const res = await fetch(`${baseUrl}${url}`, { method, headers: h, body });
    const text = await res.text();
    return { statusCode: res.status, json: () => JSON.parse(text) };
}

beforeAll(async () => {
    app = Fastify();
    app.register(fastifyJwt, { secret: "test-secret-key-for-jwt-signing" });
    app.register(import("@fastify/cookie"));
    app.register(infraMock);
    app.setErrorHandler(globalErrorHandler);
    for (const plugin of [Reject_Invite, delete_layer, login_user, User_register]) {
        app.register(plugin as any, { prefix: "/api" });
    }
    await app.ready();
    await app.listen({ port: 0, host: "127.0.0.1" });
    baseUrl = `http://127.0.0.1:${(app.server.address() as any).port}`;
});

afterAll(async () => { await app.close(); });
beforeEach(resetState);

describe("Recusar convite", () => {
    it("apaga os convites do projeto para o e-mail de quem recusa e não mexe em colaboradores", async () => {
        const res = await http("DELETE", `/api/colaboration/${PROJETO}/reject`, auth(USER, "Maria@Example.com"));
        expect(res.statusCode).toBe(200);
        expect(convites.map((c) => c.id)).toEqual(["c3"]);
        expect(colaboradoresApagados).toBe(0);
        expect(notificacoes[0]).toMatchObject({ userId: DONO, tipo: "PROJECT_REJECT", projetoId: PROJETO });
    });

    it("sem convite pendente → 404 e nada é apagado", async () => {
        const res = await http("DELETE", `/api/colaboration/${PROJETO}/reject`, auth(USER, "ninguem@example.com"));
        expect(res.statusCode).toBe(404);
        expect(convites).toHaveLength(3);
        expect(colaboradoresApagados).toBe(0);
    });
});

describe("Excluir camada com Storage instável", () => {
    it("apaga no banco antes de mexer no Storage", async () => {
        const res = await http("DELETE", `/api/layer/${CAMADA}`, auth(USER, "maria@example.com"));
        expect(res.statusCode).toBe(200);
        expect(eventos[0]).toBe("db:delete-camada");
        expect(eventos).toContain("storage:v1.mp3");
        expect(eventos).toContain("storage:atual.mp3");
    });

    it("falha ao apagar um arquivo não impede a exclusão nem os demais arquivos", async () => {
        storageFalhaEm.add("v1.mp3");
        const res = await http("DELETE", `/api/layer/${CAMADA}`, auth(USER, "maria@example.com"));
        expect(res.statusCode).toBe(200);
        expect(eventos).toContain("db:delete-camada");
        expect(eventos).toContain("storage:atual.mp3");
    });

    it("deleteOwnedAudios devolve os paths que falharam", async () => {
        storageFalhaEm.add("v1.mp3");
        const falhas = await deleteOwnedAudios(app, [
            { url: audioUrlFor(USER, "v1.mp3"), ownerId: USER },
            { url: audioUrlFor(USER, "atual.mp3"), ownerId: USER },
        ]);
        expect(falhas).toEqual([`${USER}/v1.mp3`]);
    });

    it("isObjetoInexistente reconhece as respostas de 'não encontrado' do Supabase", () => {
        expect(isObjetoInexistente(400, '{"statusCode":"404","error":"not_found","message":"Object not found"}')).toBe(true);
        expect(isObjetoInexistente(404, "")).toBe(true);
        expect(isObjetoInexistente(400, '{"error":"InvalidKey"}')).toBe(false);
        expect(isObjetoInexistente(500, "not_found")).toBe(false);
    });
});

describe("E-mail sem diferenciar maiúsculas", () => {
    it("normalizarEmail apara espaços e baixa a caixa", () => {
        expect(normalizarEmail("  Maria@Example.COM ")).toBe("maria@example.com");
        expect(emailIgual("Maria@Example.com")).toEqual({ equals: "maria@example.com", mode: "insensitive" });
    });

    it("conta antiga gravada com maiúsculas entra digitando em minúsculas", async () => {
        const res = await http("POST", "/api/usuario/login", {}, { email: "maria@example.com", senha: "SenhaForte#1" });
        expect(res.statusCode).toBe(200);
    });

    it("cadastro com o mesmo e-mail em outra caixa é recusado", async () => {
        const res = await http("POST", "/api/usuario", {}, { nome_completo: "Maria Duplicada", email: "MARIA@example.com", senha: "OutraSenha#1", cpf: "52998224725" });
        expect(res.statusCode).toBe(400);
        expect(usuariosCriados).toHaveLength(0);
    });

    it("cadastro novo grava o e-mail normalizado", async () => {
        const res = await http("POST", "/api/usuario", {}, { nome_completo: "Joao Silva Teste", email: "Joao.Silva@Example.com", senha: "OutraSenha#1", cpf: "11144477735" });
        expect(res.statusCode).toBe(201);
        expect(usuariosCriados[0].email).toBe("joao.silva@example.com");
    });
});
