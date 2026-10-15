import { describe, it, expect, beforeAll, afterAll, beforeEach } from "bun:test";
import { PUBLIC_BASE, TEST_SUPABASE_URL, TEST_BUCKET, audioUrlFor } from "./helpers/storage_env.js";
import Fastify from "fastify";
import fastifyJwt from "@fastify/jwt";
import type { FastifyInstance } from "fastify";
import fp from "fastify-plugin";
import { PrismaClient } from "@prisma/client";
import { Get_a_project } from "../src/routers/projetos/get_project_details.js";
import { create_Layer } from "../src/routers/layers/create_layer.js";
import { update_layer } from "../src/routers/layers/update_layers.js";
import { globalErrorHandler } from "../src/lib/global_Error.js";

const UUID = "123e4567-e89b-12d3-a456-426614174000";
const USER = "test-user-id";
const GUIA = audioUrlFor(USER, "guia.mp3");
const CAMADA_URL = audioUrlFor(USER, "camada.mp3");
const SIGN_BASE = `${TEST_SUPABASE_URL}/storage/v1/object/sign/${TEST_BUCKET}/`;

// A "assinatura" de teste só acrescenta ?sig e troca public por sign, como o Supabase faz.
const fakeSign = (url: string) => `${url.replace("/object/public/", "/object/sign/")}?sig=1`;

const camadaRow = {
  id: UUID,
  userId: USER,
  projetoId: UUID,
  nome_trilha: "Baixo",
  audio_url: CAMADA_URL,
  instrumento_tag: "Baixo",
  delay_offset: 0,
  volume_padrao: 1,
  esta_aprovada: false,
  currentVersionId: "version-id",
  projeto: { userId: USER, id: UUID },
};

let versionsCreated: any[];
let camadaUpdates: any[];

const mockPrisma: any = {
  $queryRaw: async () => [],
  $transaction: async (arg: any) => (typeof arg === "function" ? arg(mockPrisma) : Promise.all(arg)),
  projeto: {
    findUnique: async () => ({
      id: UUID,
      titulo: "Projeto",
      bpm: 120,
      audio_guia: GUIA,
      descricao: null,
      escala: null,
      status: "IDEIA",
      createdAt: new Date(),
      deletedAt: null,
      userId: USER,
      autor: { id: USER, nome_nome: "x", nome_completo: "Dono", avatar_url: null },
      camadas: [
        {
          id: UUID,
          nome_trilha: "Baixo",
          audio_url: CAMADA_URL,
          instrumento_tag: "Baixo",
          volume_padrao: 1,
          delay_offset: 0,
          esta_aprovada: true,
          createdAt: new Date(),
          autor: { id: USER, nome_completo: "Dono" },
          currentVersion: null,
          _count: { versions: 0 },
        },
      ],
    }),
  },
  camada: {
    findUnique: async () => ({ ...camadaRow }),
    create: async ({ data }: any) => ({ id: UUID, ...data, createdAt: new Date(), currentVersionId: "version-id" }),
    update: async (args: any) => {
      camadaUpdates.push(args.data);
      return { id: UUID, ...args.data };
    },
  },
  layerVersion: {
    findFirst: async () => null,
    create: async ({ data }: any) => {
      versionsCreated.push(data);
      return { id: "version-id", ...data, createdAt: new Date() };
    },
  },
  layerBranch: { findFirst: async () => null, count: async () => 0, create: async () => ({}) },
  notification: { create: async () => ({}) },
  colaborador: { findUnique: async () => null },
};

const plugin = fp(async (fastify: FastifyInstance) => {
  fastify.decorate("prisma", mockPrisma as unknown as PrismaClient);
  fastify.decorate("notiType", { NEW_LAYER: "NEW_LAYER" });
  fastify.decorate("storage", {
    uploadAudio: async () => ({ fileUrl: GUIA, path: "x" }),
    deleteAudio: async () => {},
    signUrls: async (urls: string[]) => new Map(urls.map(u => [u, fakeSign(u)])),
  });
});

async function buildApp(): Promise<FastifyInstance> {
  const app = Fastify();
  app.register(fastifyJwt, { secret: "test-secret-key-for-jwt-signing", sign: { expiresIn: "2d" } });
  app.register(plugin);
  app.setErrorHandler(globalErrorHandler);
  app.register(Get_a_project, { prefix: "/api" });
  app.register(create_Layer, { prefix: "/api" });
  app.register(update_layer, { prefix: "/api" });
  await app.ready();
  return app;
}

describe("Áudio assinado nas rotas", () => {
  let app: FastifyInstance;
  let auth: { Authorization: string };

  beforeAll(async () => {
    app = await buildApp();
    auth = { Authorization: `Bearer ${app.jwt.sign({ id: USER, nome: "Test", email: "t@example.com" })}` };
  });
  afterAll(async () => { await app.close(); });
  beforeEach(() => {
    versionsCreated = [];
    camadaUpdates = [];
  });

  it("GET /projetos/:id devolve guia e camadas com URL assinada", async () => {
    const res = await app.inject({ method: "GET", url: `/api/projetos/${UUID}`, headers: auth });

    expect(res.statusCode).toBe(200);
    const { projeto } = res.json();
    expect(projeto.audio_guia).toBe(fakeSign(GUIA));
    expect(projeto.audio_guia.startsWith(SIGN_BASE)).toBe(true);
    expect(projeto.camadas[0].audio_url).toBe(fakeSign(CAMADA_URL));
  });

  it("PUT /layer/:id aceita de volta a URL assinada sem tratar como troca de áudio", async () => {
    const res = await app.inject({
      method: "PUT",
      url: `/api/layer/${UUID}`,
      headers: auth,
      payload: {
        nome_trilha: "Baixo",
        audio_url: `${SIGN_BASE}${USER}/camada.mp3?token=abc`,
        instrumento_tag: "Baixo",
        delay_offset: 0,
        volume_padrao: 1,
      },
    });

    expect(res.statusCode).toBe(200);
    // Nada mudou de fato: nenhuma versão nova e o banco continua com a URL canônica.
    expect(versionsCreated).toHaveLength(0);
    expect(camadaUpdates[0].audio_url).toBe(CAMADA_URL);
  });

  it("PUT /layer/:id continua rejeitando URL assinada de outro usuário", async () => {
    const res = await app.inject({
      method: "PUT",
      url: `/api/layer/${UUID}`,
      headers: auth,
      payload: {
        nome_trilha: "Baixo",
        audio_url: `${SIGN_BASE}outro-usuario/camada.mp3?token=abc`,
        instrumento_tag: "Baixo",
      },
    });

    expect(res.statusCode).toBe(400);
    expect(camadaUpdates).toHaveLength(0);
  });

  it("POST /layer/:projetoId grava a URL canônica e responde com a assinada", async () => {
    const res = await app.inject({
      method: "POST",
      url: `/api/layer/${UUID}`,
      headers: auth,
      payload: {
        nome_trilha: "Guitarra",
        audio_url: `${SIGN_BASE}${USER}/nova.mp3?token=abc`,
        instrumento_tag: "Guitarra",
      },
    });

    expect(res.statusCode).toBe(201);
    expect(versionsCreated[0].audio_url).toBe(`${PUBLIC_BASE}${USER}/nova.mp3`);
    expect(res.json().camada.audio_url).toBe(fakeSign(`${PUBLIC_BASE}${USER}/nova.mp3`));
  });
});
