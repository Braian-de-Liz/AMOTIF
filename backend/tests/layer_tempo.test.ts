import { describe, it, expect, beforeAll, afterAll, beforeEach } from "bun:test";
import { audioUrlFor } from "./helpers/storage_env.js";
import Fastify from "fastify";
import fastifyJwt from "@fastify/jwt";
import type { FastifyInstance } from "fastify";
import fp from "fastify-plugin";
import type { PrismaClient } from "@prisma/client";
import { create_Layer } from "../src/routers/layers/create_layer.js";
import { update_layer } from "../src/routers/layers/update_layers.js";
import { Get_a_project } from "../src/routers/projetos/get_project_details.js";
import { rollbackToVersion, restoreVersionInPlace } from "../src/services/versionService.js";
import { globalErrorHandler } from "../src/lib/global_Error.js";

const LAYER_ID = "123e4567-e89b-12d3-a456-426614174000";
const PROJ_ID = "223e4567-e89b-12d3-a456-426614174001";
const VERSION_ID = "323e4567-e89b-12d3-a456-426614174002";
const USER_ID = "test-user-id";

// Estado mutável do mock, reiniciado em cada teste.
let camada: Record<string, any>;
let camadaUpdates: any[];
let versionCreates: any[];

function resetState() {
    camada = {
        id: LAYER_ID,
        userId: USER_ID,
        projetoId: PROJ_ID,
        deletedAt: null,
        audio_url: audioUrlFor(USER_ID),
        nome_trilha: "Flauta",
        instrumento_tag: "Flauta",
        delay_offset: 120,
        volume_padrao: 0.8,
        bpm_original: 100,
        transposicao_semitons: 0,
        esta_aprovada: true,
        projeto: { userId: USER_ID, deletedAt: null },
    };
    camadaUpdates = [];
    versionCreates = [];
}

const mockPrisma = {
    camada: {
        findUnique: async (args: any) => (args.where?.id === LAYER_ID ? { ...camada } : null),
        create: async (args: any) => ({
            id: LAYER_ID,
            ...args.data,
            createdAt: new Date(),
        }),
        update: async (args: any) => {
            camadaUpdates.push(args.data);
            return { id: args.where.id, ...args.data };
        },
    },
    projeto: {
        findUnique: async (args: any) => {
            if (args.select?.camadas) {
                return {
                    id: PROJ_ID,
                    titulo: "Samba de Verão",
                    bpm: 110,
                    audio_guia: audioUrlFor(USER_ID, "guia.mp3"),
                    descricao: null,
                    escala: null,
                    status: "EM_GRAVACAO",
                    createdAt: new Date(),
                    deletedAt: null,
                    autor: { id: USER_ID, nome_completo: "João", avatar_url: null },
                    camadas: [{
                        ...camada,
                        createdAt: new Date(),
                        autor: { id: USER_ID, nome_completo: "Maria" },
                        currentVersion: { id: VERSION_ID, versionNumber: 3, mensagem: "v3", createdAt: new Date() },
                        _count: { versions: 3 },
                    }],
                };
            }
            return { id: PROJ_ID, userId: USER_ID, titulo: "Samba de Verão", deletedAt: null };
        },
    },
    layerVersion: {
        findFirst: async () => ({ versionNumber: 2 }),
        findUnique: async (args: any) => args.where?.id === VERSION_ID ? {
            id: VERSION_ID,
            camadaId: LAYER_ID,
            audio_url: audioUrlFor(USER_ID, "antigo.mp3"),
            nome_trilha: "Flauta",
            instrumento_tag: "Flauta",
            delay_offset: 0,
            volume_padrao: 1,
            bpm_original: 96,
            transposicao_semitons: -2,
            versionNumber: 1,
        } : null,
        create: async (args: any) => {
            versionCreates.push(args.data);
            return { id: VERSION_ID, ...args.data, createdAt: new Date() };
        },
    },
    layerBranch: {
        findFirst: async () => ({ id: "branch" }),
        create: async () => ({}),
    },
    notification: { create: async () => ({}) },
};

const prismaPlugin = fp(async (fastify: FastifyInstance) => {
    fastify.decorate("prisma", mockPrisma as unknown as PrismaClient);
});

async function buildApp(): Promise<FastifyInstance> {
    const app = Fastify();
    app.register(fastifyJwt, { secret: "test-secret-key-for-jwt-signing" });
    app.register(prismaPlugin);
    app.setErrorHandler(globalErrorHandler);
    app.register(create_Layer, { prefix: "/api" });
    app.register(update_layer, { prefix: "/api" });
    app.register(Get_a_project, { prefix: "/api" });
    await app.ready();
    return app;
}

describe("Camadas - BPM original e transposição", () => {
    let app: FastifyInstance;
    let auth: { Authorization: string };

    beforeAll(async () => {
        app = await buildApp();
        auth = { Authorization: `Bearer ${app.jwt.sign({ id: USER_ID, nome: "Maria", email: "m@x.com" })}` };
    });

    afterAll(async () => { await app.close(); });

    beforeEach(resetState);

    const corpoBase = () => ({
        nome_trilha: "Flauta",
        audio_url: audioUrlFor(USER_ID),
        instrumento_tag: "Flauta",
    });

    it("POST cria camada com bpm_original e transposição e grava na versão inicial", async () => {
        const res = await app.inject({
            method: "POST",
            url: `/api/layer/${PROJ_ID}`,
            headers: auth,
            payload: { ...corpoBase(), bpm_original: 100, transposicao_semitons: 2 },
        });

        expect(res.statusCode).toBe(201);
        expect(res.json().camada.bpm_original).toBe(100);
        expect(res.json().camada.transposicao_semitons).toBe(2);
        expect(versionCreates[0]).toMatchObject({ bpm_original: 100, transposicao_semitons: 2 });
    });

    it("POST sem os campos usa null/0", async () => {
        const res = await app.inject({ method: "POST", url: `/api/layer/${PROJ_ID}`, headers: auth, payload: corpoBase() });

        expect(res.statusCode).toBe(201);
        expect(res.json().camada.bpm_original).toBeNull();
        expect(res.json().camada.transposicao_semitons).toBe(0);
    });

    it.each([
        [{ bpm_original: 19 }],
        [{ bpm_original: 301 }],
        [{ bpm_original: 99.5 }],
        [{ transposicao_semitons: 13 }],
        [{ transposicao_semitons: -13 }],
    ])("POST recusa valores fora dos limites %j", async (extra) => {
        const res = await app.inject({ method: "POST", url: `/api/layer/${PROJ_ID}`, headers: auth, payload: { ...corpoBase(), ...extra } });
        expect(res.statusCode).toBe(400);
    });

    it("PUT mudando só o BPM gera versão e mantém a aprovação", async () => {
        const res = await app.inject({
            method: "PUT",
            url: `/api/layer/${LAYER_ID}`,
            headers: auth,
            payload: { ...corpoBase(), bpm_original: 98 },
        });

        expect(res.statusCode).toBe(200);
        expect(versionCreates).toHaveLength(1);
        expect(versionCreates[0]).toMatchObject({ bpm_original: 98, transposicao_semitons: 0, delay_offset: 120, volume_padrao: 0.8 });

        const updateCamada = camadaUpdates.find(u => "nome_trilha" in u);
        expect(updateCamada.bpm_original).toBe(98);
        expect(updateCamada).not.toHaveProperty("esta_aprovada");
    });

    it("PUT com bpm_original null volta a seguir o BPM do projeto", async () => {
        await app.inject({ method: "PUT", url: `/api/layer/${LAYER_ID}`, headers: auth, payload: { ...corpoBase(), bpm_original: null } });

        expect(camadaUpdates.find(u => "nome_trilha" in u).bpm_original).toBeNull();
    });

    it("PUT sem os campos mantém os valores atuais e não gera versão", async () => {
        await app.inject({ method: "PUT", url: `/api/layer/${LAYER_ID}`, headers: auth, payload: corpoBase() });

        expect(versionCreates).toHaveLength(0);
        expect(camadaUpdates.find(u => "nome_trilha" in u)).toMatchObject({ bpm_original: 100, transposicao_semitons: 0 });
    });

    it("PUT com áudio novo (Aplicar) zera ajuste, usa a mensagem e reseta aprovação", async () => {
        const res = await app.inject({
            method: "PUT",
            url: `/api/layer/${LAYER_ID}`,
            headers: auth,
            payload: {
                ...corpoBase(),
                audio_url: audioUrlFor(USER_ID, "aplicado.mp3"),
                bpm_original: null,
                transposicao_semitons: 0,
                delay_offset: 95,
                mensagem: "Ajuste de tempo 100→110 BPM",
            },
        });

        expect(res.statusCode).toBe(200);
        expect(versionCreates[0]).toMatchObject({
            bpm_original: null,
            transposicao_semitons: 0,
            delay_offset: 95,
            mensagem: "Ajuste de tempo 100→110 BPM",
        });
        expect(camadaUpdates.find(u => "nome_trilha" in u).esta_aprovada).toBe(false);
    });

    it("GET do projeto devolve os campos e a versão atual", async () => {
        const res = await app.inject({ method: "GET", url: `/api/projetos/${PROJ_ID}`, headers: auth });

        expect(res.statusCode).toBe(200);
        const [c] = res.json().projeto.camadas;
        expect(c.bpm_original).toBe(100);
        expect(c.transposicao_semitons).toBe(0);
        expect(c.versaoAtual.numero).toBe(3);
        expect(c.totalVersoes).toBe(3);
    });
});

describe("versionService - restaura BPM e transposição", () => {
    beforeEach(resetState);

    it("rollback copia bpm_original/transposicao para a nova versão e a camada", async () => {
        await rollbackToVersion(mockPrisma as unknown as PrismaClient, LAYER_ID, VERSION_ID, USER_ID);

        expect(versionCreates[0]).toMatchObject({ bpm_original: 96, transposicao_semitons: -2 });
        expect(camadaUpdates.at(-1)).toMatchObject({ bpm_original: 96, transposicao_semitons: -2 });
    });

    it("restore in place copia bpm_original/transposicao para a camada", async () => {
        await restoreVersionInPlace(mockPrisma as unknown as PrismaClient, LAYER_ID, VERSION_ID, USER_ID);

        expect(camadaUpdates.at(-1)).toMatchObject({ bpm_original: 96, transposicao_semitons: -2 });
    });
});
