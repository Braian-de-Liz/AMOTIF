// Testes da matriz de autorização (Storage, layers, rollback, colaboração, soft-delete, PII, cleanup).
import { describe, it, expect, beforeAll, afterAll, beforeEach } from "bun:test";
import { PUBLIC_BASE, audioUrlFor } from "./helpers/storage_env.js";
import Fastify from "fastify";
import fastifyJwt from "@fastify/jwt";
import type { FastifyInstance } from "fastify";
import fp from "fastify-plugin";
import { PrismaClient } from "@prisma/client";
import { globalErrorHandler } from "../src/lib/global_Error.js";
import { resolveSafeExtension } from "../src/lib/upload.js";

import { create_Layer } from "../src/routers/layers/create_layer.js";
import { update_layer } from "../src/routers/layers/update_layers.js";
import { delete_layer } from "../src/routers/layers/delete_layer.js";
import { rollback_route } from "../src/routers/versions/manage_branches.js";
import { post_project } from "../src/routers/projetos/create_project.js";
import { del_project } from "../src/routers/projetos/delete_project.js";
import { Deletar_user } from "../src/routers/user/delete_user.js";
import { Delete_Colab } from "../src/routers/colaboration/delete_colab.js";
import { list_invite } from "../src/routers/colaboration/list_invite.js";
import { colaborators } from "../src/routers/colaboration/colaboretors.js";
import { Get_user_with_counts } from "../src/routers/user/get_user_with_counts.js";
import { Get_a_project } from "../src/routers/projetos/get_project_details.js";
import { search_project } from "../src/routers/search/search_project.js";
import { Get_projects_user } from "../src/routers/projetos/get_projects.js";
import { criar_sugestao } from "../src/routers/sugestoes/criar_sugestao.js";
import { listar_sugestoes } from "../src/routers/sugestoes/listar_sugestoes.js";
import { Create_like } from "../src/routers/likes/like_create.js";
import { Toggle_favorite } from "../src/routers/projetos/togle_favorites.js";
import { cleanup_route } from "../src/routers/cleanup/cleanup.js";

// ---------- IDs ----------
const AUTOR = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";   // autor da camada
const DONO = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";    // dono do projeto
const COLAB = "cccccccc-cccc-4ccc-8ccc-cccccccccccc";   // colaborador do projeto
const ESTRANHO = "dddddddd-dddd-4ddd-8ddd-dddddddddddd";
const PROJETO = "11111111-1111-4111-8111-111111111111";
const PROJETO_DEL = "22222222-2222-4222-8222-222222222222"; // soft-deletado
const CAMADA = "33333333-3333-4333-8333-333333333333";
const VERSAO = "44444444-4444-4444-8444-444444444444";

const AUDIO_AUTOR = audioUrlFor(AUTOR, "a1.mp3");
const AUDIO_AUTOR_2 = audioUrlFor(AUTOR, "a2.mp3");
const AUDIO_DONO = audioUrlFor(DONO, "guia.mp3");

// ---------- estado mutável do mock ----------
type Camada = {
    id: string; userId: string; projetoId: string; audio_url: string; nome_trilha: string;
    instrumento_tag: string; delay_offset: number; volume_padrao: number; esta_aprovada: boolean;
    deletedAt: Date | null; versions: { audio_url: string; autorId: string }[];
};

let camada: Camada;
let camadaUpdates: any[];
let camadaCreates: any[];
let deletedPaths: string[];

function resetState() {
    camada = {
        id: CAMADA, userId: AUTOR, projetoId: PROJETO, audio_url: AUDIO_AUTOR, nome_trilha: "Baixo",
        instrumento_tag: "Baixo", delay_offset: 0, volume_padrao: 1, esta_aprovada: true, deletedAt: null,
        versions: [{ audio_url: AUDIO_AUTOR, autorId: AUTOR }],
    };
    camadaUpdates = [];
    camadaCreates = [];
    deletedPaths = [];
}
resetState();

const projetos: Record<string, any> = {
    [PROJETO]: { id: PROJETO, userId: DONO, titulo: "Samba", deletedAt: null, audio_guia: AUDIO_DONO },
    [PROJETO_DEL]: { id: PROJETO_DEL, userId: DONO, titulo: "Apagado", deletedAt: new Date(), audio_guia: AUDIO_DONO },
};

const USER_EMAILS: Record<string, string> = {
    [AUTOR]: "autor@example.com", [DONO]: "dono@example.com", [COLAB]: "colab@example.com",
};

function projetoComCamadas(id: string) {
    const p = projetos[id];
    if (!p) return null;
    return {
        ...p,
        createdAt: new Date(), bpm: 110, descricao: null, escala: null,
        autor: { id: p.userId, nome_completo: "Dono", avatar_url: null },
        camadas: [{ ...camada, autor: { nome_completo: "Autor" } }],
        colaboradores: [{
            cargo: "membro", joinedAt: new Date(),
            usuario: { id: COLAB, nome_completo: "Colab User", avatar_url: null, instrumentos: [], email: USER_EMAILS[COLAB] },
        }],
    };
}

const mockPrisma: any = {
    camada: {
        findUnique: async ({ where }: any) => {
            if (where.id !== CAMADA) return null;
            return { ...camada, projeto: { userId: projetos[camada.projetoId].userId, deletedAt: projetos[camada.projetoId].deletedAt, id: camada.projetoId } };
        },
        create: async ({ data }: any) => {
            camadaCreates.push(data);
            return { id: CAMADA, ...data, createdAt: new Date() };
        },
        update: async ({ where, data }: any) => {
            camadaUpdates.push(data);
            Object.assign(camada, data);
            return { ...camada };
        },
        delete: async () => ({ id: CAMADA }),
    },
    layerVersion: {
        findUnique: async ({ where }: any) => where.id === VERSAO
            ? { id: VERSAO, camadaId: CAMADA, audio_url: AUDIO_AUTOR_2, nome_trilha: "Baixo", instrumento_tag: "Baixo", delay_offset: 0, volume_padrao: 1, versionNumber: 1 }
            : null,
        findFirst: async () => ({ versionNumber: 2 }),
        create: async ({ data }: any) => ({ id: "55555555-5555-4555-8555-555555555555", ...data, createdAt: new Date() }),
    },
    projeto: {
        findUnique: async ({ where }: any) => projetoComCamadas(where.id),
        findMany: async ({ where }: any) => {
            const lista = Object.values(projetos).map((p) => ({ ...projetoComCamadas(p.id), likes: [], favoritos: [], genero: "SAMBA", _count: { camadas: 1, colaboradores: 1 } }));
            const filtros = JSON.stringify(where);
            // Emula `deletedAt: null` (filtro direto ou dentro de AND).
            const exigeAtivo = filtros.includes('"deletedAt":null');
            return lista.filter((p) => (where.userId ? p.userId === where.userId : true) && (!exigeAtivo || !p.deletedAt));
        },
        create: async ({ data }: any) => ({ id: PROJETO, ...data, createdAt: new Date(), updatedAt: new Date() }),
        update: async () => ({}),
    },
    user: {
        findUnique: async ({ where }: any) => ({
            id: where.id, nome_completo: "Fulano", email: USER_EMAILS[where.id] ?? "x@example.com",
            senha: await Bun.password.hash("senha-correta"), bio: null, instrumentos: [], avatar_url: null,
            createdAt: new Date(), _count: { seguidores: 0, seguindo: 0 }, seguindo: [],
        }),
        delete: async () => ({}),
    },
    colaborador: {
        findFirst: async ({ where }: any) => (where.projetoId === PROJETO && where.userId === COLAB ? { id: "colab-row" } : null),
        findUnique: async () => null,
        delete: async () => ({}),
    },
    convite: { findMany: async () => [], deleteMany: async () => ({ count: 0 }) },
    sugestao: {
        create: async ({ data }: any) => ({ id: "66666666-6666-4666-8666-666666666666", ...data, status: "ABERTA", createdAt: new Date(), autor: { id: data.autorId, nome_completo: "X", avatar_url: null } }),
        findMany: async () => [],
    },
    like: { findUnique: async () => null, create: async () => ({}), count: async () => 1 },
    favorite: { findUnique: async () => null, create: async () => ({}) },
    follows: { findMany: async () => [] },
    notification: { create: async () => ({}), createMany: async () => ({}), deleteMany: async () => ({ count: 0 }) },
    $transaction: async (arg: any) => (typeof arg === "function" ? arg(mockPrisma) : Promise.all(arg)),
};

const infraMock = fp(async (fastify: FastifyInstance) => {
    fastify.decorate("prisma", mockPrisma as unknown as PrismaClient);
    fastify.decorate("notiType", {
        INVITE_RECEIVED: "INVITE_RECEIVED", INVITE_ACCEPTED: "INVITE_ACCEPTED", NEW_LAYER: "NEW_LAYER",
        LAYER_APPROVED: "LAYER_APPROVED", PROJECT_REJECT: "PROJECT_REJECT", NEW_FOLLOWER: "NEW_FOLLOWER",
        PROJECT_RELEASED: "PROJECT_RELEASED", NEW_LIKE: "NEW_LIKE",
    } as any);
    fastify.decorate("storage", {
        uploadAudio: async () => ({ fileUrl: "", path: "" }),
        deleteAudio: async (path: string) => { deletedPaths.push(path); },
    });
});

let app: FastifyInstance;
let baseUrl: string;
const auth = (id: string) => ({ Authorization: `Bearer ${app.jwt.sign({ id, nome: "User", email: USER_EMAILS[id] ?? "x@example.com" })}` });

// Servidor real + fetch: `app.inject` (light-my-request) no Bun continua executando o handler
// depois que um hook async já respondeu (ERR_HTTP_HEADERS_SENT), o que não ocorre em HTTP real.
async function http(opts: { method: string; url: string; headers?: Record<string, string>; payload?: unknown }) {
    const headers: Record<string, string> = { ...(opts.headers ?? {}) };
    let body: string | undefined;
    if (opts.payload !== undefined) {
        headers["content-type"] = "application/json";
        body = JSON.stringify(opts.payload);
    } else if (opts.method !== "GET") {
        // Rotas DELETE/POST sem body: envia JSON vazio para não falhar no parser.
        headers["content-type"] = "application/json";
        body = "{}";
    }
    const res = await fetch(`${baseUrl}${opts.url}`, { method: opts.method, headers, body });
    const text = await res.text();
    return { statusCode: res.status, body: text, json: () => JSON.parse(text) };
}

beforeAll(async () => {
    app = Fastify();
    app.register(fastifyJwt, { secret: "test-secret-key-for-jwt-signing" });
    app.register(infraMock);
    app.setErrorHandler(globalErrorHandler);
    for (const plugin of [
        create_Layer, update_layer, delete_layer, rollback_route, post_project, del_project, Deletar_user,
        Delete_Colab, list_invite, colaborators, Get_user_with_counts, Get_a_project, search_project,
        Get_projects_user, criar_sugestao, listar_sugestoes, Create_like, Toggle_favorite, cleanup_route,
    ]) {
        app.register(plugin as any, { prefix: "/api" });
    }
    await app.ready();
    await app.listen({ port: 0, host: "127.0.0.1" });
    baseUrl = `http://127.0.0.1:${(app.server.address() as any).port}`;
});

afterAll(async () => { await app.close(); });
beforeEach(resetState);

const layerBody = (audio_url = AUDIO_AUTOR) => ({ nome_trilha: "Baixo", audio_url, instrumento_tag: "Baixo", delay_offset: 0, volume_padrao: 1 });

// ---------- Task 2: validação de URL na entrada ----------
describe("Storage - validação de audio_url/audio_guia na entrada", () => {
    it("criar layer com áudio de outro usuário → 400", async () => {
        const res = await http({ method: "POST", url: `/api/layer/${PROJETO}`, headers: auth(ESTRANHO), payload: layerBody(AUDIO_DONO) });
        expect(res.statusCode).toBe(400);
        expect(camadaCreates.length).toBe(0);
    });

    it("criar layer com traversal para o diretório de outro usuário → 400", async () => {
        const res = await http({ method: "POST", url: `/api/layer/${PROJETO}`, headers: auth(ESTRANHO), payload: layerBody(`${PUBLIC_BASE}${ESTRANHO}/../${DONO}/guia.mp3`) });
        expect(res.statusCode).toBe(400);
    });

    it("criar layer com áudio próprio → 201 e sempre pendente", async () => {
        const res = await http({ method: "POST", url: `/api/layer/${PROJETO}`, headers: auth(ESTRANHO), payload: { ...layerBody(audioUrlFor(ESTRANHO, "x.mp3")), esta_aprovada: true } });
        expect(res.statusCode).toBe(201);
        expect(camadaCreates[0].esta_aprovada).toBe(false);
        expect(res.json().camada.esta_aprovada).toBe(false);
    });

    it("criar projeto com audio_guia de outro usuário → 400; próprio → 201", async () => {
        const base = { titulo: "Novo", genero: "SAMBA", bpm: 110, escala: "C", descricao: "d" };
        const ruim = await http({ method: "POST", url: "/api/projetos", headers: auth(ESTRANHO), payload: { ...base, audio_guia: AUDIO_DONO } });
        expect(ruim.statusCode).toBe(400);
        const bom = await http({ method: "POST", url: "/api/projetos", headers: auth(ESTRANHO), payload: { ...base, audio_guia: audioUrlFor(ESTRANHO, "g.mp3") } });
        expect(bom.statusCode).toBe(201);
    });

    it("resolveSafeExtension ignora filenames maliciosos", () => {
        expect(resolveSafeExtension("../../x.mp3/../../evil.html", "audio/mpeg")).toBe(".mp3");
        expect(resolveSafeExtension("song.WAV", "audio/mpeg")).toBe(".wav");
        expect(resolveSafeExtension("a/b", "audio/ogg")).toBe(".ogg");
        expect(resolveSafeExtension("semext", "audio/desconhecido")).toBe(".mp3");
    });
});

// ---------- Task 3: deleção segura ----------
describe("Storage - deleção restrita ao diretório do dono do registro", () => {
    it("layer com URL legada de outro usuário: registro removido, arquivo alheio preservado", async () => {
        camada.audio_url = AUDIO_DONO;
        camada.versions = [{ audio_url: AUDIO_DONO, autorId: AUTOR }, { audio_url: `${PUBLIC_BASE}${AUTOR}/../${DONO}/guia.mp3`, autorId: AUTOR }];
        const res = await http({ method: "DELETE", url: `/api/layer/${CAMADA}`, headers: auth(AUTOR) });
        expect(res.statusCode).toBe(200);
        expect(deletedPaths).toEqual([]);
    });

    it("layer com URL própria: apaga o arquivo uma única vez", async () => {
        const res = await http({ method: "DELETE", url: `/api/layer/${CAMADA}`, headers: auth(AUTOR) });
        expect(res.statusCode).toBe(200);
        expect(deletedPaths).toEqual([`${AUTOR}/a1.mp3`]);
    });

    it("delete de projeto só apaga arquivos de cada dono", async () => {
        camada.audio_url = AUDIO_DONO; // autor referenciando arquivo do dono → não apagar via camada
        camada.versions = [];
        const res = await http({ method: "DELETE", url: `/api/projetos/${PROJETO}`, headers: auth(DONO), payload: { senha: "senha-correta" } });
        expect(res.statusCode).toBe(202);
        // Só o audio_guia (do dono do projeto) é apagado
        expect(deletedPaths).toEqual([`${DONO}/guia.mp3`]);
    });
});

// ---------- Task 4: permissões de edição/deleção de layer ----------
describe("Layers - quem pode editar/apagar", () => {
    it("colaborador edita layer alheia → 403", async () => {
        const res = await http({ method: "PUT", url: `/api/layer/${CAMADA}`, headers: auth(COLAB), payload: layerBody() });
        expect(res.statusCode).toBe(403);
    });

    it("dono do projeto (não autor) edita → 403", async () => {
        const res = await http({ method: "PUT", url: `/api/layer/${CAMADA}`, headers: auth(DONO), payload: layerBody() });
        expect(res.statusCode).toBe(403);
    });

    it("autor edita → 200", async () => {
        const res = await http({ method: "PUT", url: `/api/layer/${CAMADA}`, headers: auth(AUTOR), payload: { ...layerBody(), nome_trilha: "Baixo 2" } });
        expect(res.statusCode).toBe(200);
        expect(camada.nome_trilha).toBe("Baixo 2");
    });

    it("autor não consegue se auto-aprovar via PUT", async () => {
        camada.esta_aprovada = false;
        const res = await http({ method: "PUT", url: `/api/layer/${CAMADA}`, headers: auth(AUTOR), payload: { ...layerBody(), esta_aprovada: true } });
        expect(res.statusCode).toBe(200);
        expect(camada.esta_aprovada).toBe(false);
        expect(camadaUpdates.every((u) => u.esta_aprovada !== true)).toBe(true);
    });

    it("trocar áudio de layer aprovada → volta a pendente", async () => {
        const res = await http({ method: "PUT", url: `/api/layer/${CAMADA}`, headers: auth(AUTOR), payload: layerBody(AUDIO_AUTOR_2) });
        expect(res.statusCode).toBe(200);
        expect(camada.esta_aprovada).toBe(false);
    });

    it("editar sem trocar áudio mantém aprovação", async () => {
        const res = await http({ method: "PUT", url: `/api/layer/${CAMADA}`, headers: auth(AUTOR), payload: { ...layerBody(), nome_trilha: "Outro" } });
        expect(res.statusCode).toBe(200);
        expect(camada.esta_aprovada).toBe(true);
    });

    it("autor troca para áudio de outro usuário → 400", async () => {
        const res = await http({ method: "PUT", url: `/api/layer/${CAMADA}`, headers: auth(AUTOR), payload: layerBody(AUDIO_DONO) });
        expect(res.statusCode).toBe(400);
    });

    it("colaborador apaga layer alheia → 403", async () => {
        const res = await http({ method: "DELETE", url: `/api/layer/${CAMADA}`, headers: auth(COLAB) });
        expect(res.statusCode).toBe(403);
    });

    it("dono do projeto apaga layer → 200", async () => {
        const res = await http({ method: "DELETE", url: `/api/layer/${CAMADA}`, headers: auth(DONO) });
        expect(res.statusCode).toBe(200);
    });

    it("layer de projeto soft-deletado → 404", async () => {
        camada.projetoId = PROJETO_DEL;
        const res = await http({ method: "DELETE", url: `/api/layer/${CAMADA}`, headers: auth(AUTOR) });
        expect(res.statusCode).toBe(404);
    });
});

// ---------- Task 5: criação em projeto deletado + rollback ----------
describe("Layers - criação e rollback", () => {
    it("criar layer em projeto soft-deletado → 404", async () => {
        const res = await http({ method: "POST", url: `/api/layer/${PROJETO_DEL}`, headers: auth(AUTOR), payload: layerBody() });
        expect(res.statusCode).toBe(404);
    });

    it("rollback por autor → 200 e reseta aprovação ao trocar áudio", async () => {
        const res = await http({ method: "POST", url: `/api/layer/${CAMADA}/rollback/${VERSAO}`, headers: auth(AUTOR) });
        expect(res.statusCode).toBe(200);
        expect(camada.audio_url).toBe(AUDIO_AUTOR_2);
        expect(camada.esta_aprovada).toBe(false);
    });

    it("rollback pelo dono do projeto → 200", async () => {
        const res = await http({ method: "POST", url: `/api/layer/${CAMADA}/rollback/${VERSAO}`, headers: auth(DONO) });
        expect(res.statusCode).toBe(200);
    });

    it("rollback por colaborador ou estranho → 403", async () => {
        for (const who of [COLAB, ESTRANHO]) {
            const res = await http({ method: "POST", url: `/api/layer/${CAMADA}/rollback/${VERSAO}`, headers: auth(who) });
            expect(res.statusCode).toBe(403);
        }
    });
});

// ---------- Task 6: hooks com parâmetro correto ----------
describe("Colaboração - hooks de dono do projeto", () => {
    it("dono remove colaborador → 200; não-dono → 403", async () => {
        const ok = await http({ method: "DELETE", url: `/api/colaboration/${PROJETO}/remove/${COLAB}`, headers: auth(DONO) });
        expect(ok.statusCode).toBe(200);
        const nega = await http({ method: "DELETE", url: `/api/colaboration/${PROJETO}/remove/${COLAB}`, headers: auth(COLAB) });
        expect(nega.statusCode).toBe(403);
    });

    it("dono lista convites do projeto → 200; não-dono → 403", async () => {
        const ok = await http({ method: "GET", url: `/api/colaboration/${PROJETO}/invite`, headers: auth(DONO) });
        expect(ok.statusCode).toBe(200);
        const nega = await http({ method: "GET", url: `/api/colaboration/${PROJETO}/invite`, headers: auth(ESTRANHO) });
        expect(nega.statusCode).toBe(403);
    });
});

// ---------- Task 7: projetos soft-deletados ----------
describe("Projetos soft-deletados ficam inacessíveis", () => {
    it("detalhes → 404", async () => {
        const res = await http({ method: "GET", url: `/api/projetos/${PROJETO_DEL}`, headers: auth(DONO) });
        expect(res.statusCode).toBe(404);
    });

    it("busca não retorna projeto deletado", async () => {
        const res = await http({ method: "GET", url: `/api/search/projects?query=a`, headers: auth(DONO) });
        expect(res.statusCode).toBe(200);
        const ids = res.json().resultados.map((p: any) => p.id);
        expect(ids).toContain(PROJETO);
        expect(ids).not.toContain(PROJETO_DEL);
    });

    it("listagem de projetos do usuário não retorna deletado", async () => {
        const res = await http({ method: "GET", url: `/api/projetos/${DONO}/get`, headers: auth(DONO) });
        expect(res.statusCode).toBe(200);
        const ids = res.json().projetos.map((p: any) => p.id);
        expect(ids).not.toContain(PROJETO_DEL);
    });

    it("sugestões, like e favorito → 404", async () => {
        const reqs = [
            http({ method: "POST", url: `/api/projetos/${PROJETO_DEL}/sugestoes`, headers: auth(ESTRANHO), payload: { titulo: "Ideia", descricao: "Uma ideia" } }),
            http({ method: "GET", url: `/api/projetos/${PROJETO_DEL}/sugestoes`, headers: auth(ESTRANHO) }),
            http({ method: "POST", url: `/api/like/${PROJETO_DEL}`, headers: auth(ESTRANHO) }),
            http({ method: "POST", url: `/api/projetos/favoritos/${PROJETO_DEL}`, headers: auth(ESTRANHO) }),
        ];
        for (const res of await Promise.all(reqs)) {
            expect(res.statusCode).toBe(404);
        }
    });
});

// ---------- Task 8: PII ----------
describe("PII - e-mails", () => {
    it("perfil de terceiro não expõe e-mail; próprio perfil expõe", async () => {
        const terceiro = await http({ method: "GET", url: `/api/usuario/${AUTOR}/completo`, headers: auth(ESTRANHO) });
        expect(terceiro.statusCode).toBe(200);
        expect(terceiro.json().usuario.email).toBeUndefined();

        const proprio = await http({ method: "GET", url: `/api/usuario/${AUTOR}/completo`, headers: auth(AUTOR) });
        expect(proprio.json().usuario.email).toBe(USER_EMAILS[AUTOR]);
    });

    it("lista de colaboradores só mostra e-mail ao dono (e ao próprio colaborador)", async () => {
        const estranho = await http({ method: "GET", url: `/api/colaboration/${PROJETO}`, headers: auth(ESTRANHO) });
        expect(estranho.statusCode).toBe(200);
        expect(estranho.json().colaborators.colaboradores[0].usuario.email).toBeUndefined();

        const dono = await http({ method: "GET", url: `/api/colaboration/${PROJETO}`, headers: auth(DONO) });
        expect(dono.json().colaborators.colaboradores[0].usuario.email).toBe(USER_EMAILS[COLAB]);

        const proprio = await http({ method: "GET", url: `/api/colaboration/${PROJETO}`, headers: auth(COLAB) });
        expect(proprio.json().colaborators.colaboradores[0].usuario.email).toBe(USER_EMAILS[COLAB]);
    });
});

// ---------- Task 9: /cleanup ----------
describe("/cleanup protegido por CLEANUP_SECRET", () => {
    const original = Bun.env.CLEANUP_SECRET;
    afterAll(() => { if (original === undefined) delete Bun.env.CLEANUP_SECRET; else Bun.env.CLEANUP_SECRET = original; });

    it("env ausente → 503", async () => {
        delete Bun.env.CLEANUP_SECRET;
        const res = await http({ method: "POST", url: "/api/cleanup", headers: { "x-cleanup-secret": "qualquer" } });
        expect(res.statusCode).toBe(503);
    });

    it("sem header ou com JWT de usuário → 401", async () => {
        Bun.env.CLEANUP_SECRET = "segredo-de-teste";
        const semHeader = await http({ method: "POST", url: "/api/cleanup", headers: auth(DONO) });
        expect(semHeader.statusCode).toBe(401);
    });

    it("header errado → 401", async () => {
        Bun.env.CLEANUP_SECRET = "segredo-de-teste";
        const res = await http({ method: "POST", url: "/api/cleanup", headers: { "x-cleanup-secret": "errado" } });
        expect(res.statusCode).toBe(401);
    });

    it("header correto → 200", async () => {
        Bun.env.CLEANUP_SECRET = "segredo-de-teste";
        const res = await http({ method: "POST", url: "/api/cleanup", headers: { "x-cleanup-secret": "segredo-de-teste" } });
        expect(res.statusCode).toBe(200);
        expect(res.json().status).toBe("sucesso");
    });
});
