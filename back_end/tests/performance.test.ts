import { describe, test, expect, beforeAll } from "bun:test";
import autocannon from "autocannon";

const BASE_URL = Bun.env.BASE_URL || "http://localhost:3333";
const TEST_EMAIL = Bun.env.TEST_EMAIL;
const TEST_PASSWORD = Bun.env.TEST_PASSWORD;

let tokenAutenticado: string;
let userId: string;
let projetoId: string | null = null;

async function login() {
  const res = await fetch(`${BASE_URL}/api/usuario/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: TEST_EMAIL, senha: TEST_PASSWORD }),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(
      `Login falhou (${res.status}): ${body.mensagem ?? res.statusText}`
    );
  }

  const data = await res.json();
  tokenAutenticado = data.token;
  userId = data.usuario.id;
}

async function buscarProjetoId(): Promise<string | null> {
  const headers = { Authorization: `Bearer ${tokenAutenticado}` };

  const res = await fetch(`${BASE_URL}/api/projetos/feed`, { headers });
  if (!res.ok) return null;

  const body = await res.json();
  const projetos = body.projetos;
  if (Array.isArray(projetos) && projetos.length > 0) {
    return projetos[0].id;
  }

  const resUser = await fetch(`${BASE_URL}/api/projetos/${userId}/get`, { headers });
  if (!resUser.ok) return null;

  const userBody = await resUser.json();
  const userProjetos = userBody.projetos;
  if (Array.isArray(userProjetos) && userProjetos.length > 0) {
    return userProjetos[0].id;
  }

  return null;
}

async function criarProjetoTemporario(): Promise<string> {
  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${tokenAutenticado}`,
  };

  const res = await fetch(`${BASE_URL}/api/projetos`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      titulo: `Teste-Estresse-${Date.now()}`,
      genero: "ROCK",
      bpm: 120,
      audio_guia: "https://placeholder.amotif.app/test.mp3",
    }),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(`Falha ao criar projeto (${res.status}): ${body.mensagem ?? res.statusText}`);
  }

  const data = await res.json();
  return data.projeto.id;
}

beforeAll(async () => {
  if (!TEST_EMAIL || !TEST_PASSWORD) {
    throw new Error(
      "Defina TEST_EMAIL e TEST_PASSWORD no .env ou environment."
    );
  }

  await login();

  projetoId = await buscarProjetoId();

  if (!projetoId) {
    projetoId = await criarProjetoTemporario();
  }
});

describe("Performance - Estresse da API AMOTIF", () => {
  test(
    "GET /api/projetos/feed | 50 conexões, 5s",
    async () => {
      const resultado = await autocannon({
        url: `${BASE_URL}/api/projetos/feed`,
        connections: 50,
        duration: 5,
        headers: { Authorization: `Bearer ${tokenAutenticado}` },
      });

      expect(resultado.non2xx).toBe(0);

      console.log(
        `[Feed] Req/Sec: ${resultado.requests.average.toFixed(2)} | ` +
        `Latência Média: ${resultado.latency.average.toFixed(2)}ms`
      );
    },
    10000,
  );

  test(
    "GET /api/notifications | 30 conexões, 5s",
    async () => {
      const resultado = await autocannon({
        url: `${BASE_URL}/api/notifications`,
        connections: 30,
        duration: 5,
        headers: { Authorization: `Bearer ${tokenAutenticado}` },
      });

      expect(resultado.non2xx).toBe(0);

      console.log(
        `[Notificações] Req/Sec: ${resultado.requests.average.toFixed(2)} | ` +
        `Latência Média: ${resultado.latency.average.toFixed(2)}ms`
      );
    },
    10000,
  );

  test(
    "GET /api/usuario/:id/completo | 30 conexões, 5s",
    async () => {
      const resultado = await autocannon({
        url: `${BASE_URL}/api/usuario/${userId}/completo`,
        connections: 30,
        duration: 5,
        headers: { Authorization: `Bearer ${tokenAutenticado}` },
      });

      expect(resultado.non2xx).toBe(0);

      console.log(
        `[User Perfil] Req/Sec: ${resultado.requests.average.toFixed(2)} | ` +
        `Latência Média: ${resultado.latency.average.toFixed(2)}ms`
      );
    },
    10000,
  );

  test(
    "GET /api/projetos/:id | 30 conexões, 5s",
    async () => {
      const resultado = await autocannon({
        url: `${BASE_URL}/api/projetos/${projetoId}`,
        connections: 30,
        duration: 5,
        headers: { Authorization: `Bearer ${tokenAutenticado}` },
      });

      expect(resultado.non2xx).toBe(0);

      console.log(
        `[Projeto Detalhes] Req/Sec: ${resultado.requests.average.toFixed(2)} | ` +
        `Latência Média: ${resultado.latency.average.toFixed(2)}ms`
      );
    },
    10000,
  );

  test(
    "GET /api/projetos/favoritos | 20 conexões, 5s",
    async () => {
      const resultado = await autocannon({
        url: `${BASE_URL}/api/projetos/favoritos`,
        connections: 20,
        duration: 5,
        headers: { Authorization: `Bearer ${tokenAutenticado}` },
      });

      expect(resultado.non2xx).toBe(0);

      console.log(
        `[Favoritos] Req/Sec: ${resultado.requests.average.toFixed(2)} | ` +
        `Latência Média: ${resultado.latency.average.toFixed(2)}ms`
      );
    },
    10000,
  );
});
