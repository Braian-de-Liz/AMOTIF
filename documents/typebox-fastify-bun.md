# TypeBox, AJV, Fastify e Bun: Stack Tecnológico do Backend AMOTIF

## 1. Introdução

Este documento detalha as justificativas técnicas e arquiteturais para a escolha do stack **Bun** (runtime), **Fastify** (framework), **TypeBox** (definição de schemas) e **AJV** (validação JSON Schema) no backend do AMOTIF. O objetivo é documentar as decisões técnicas que guiam a implementação da API principal, esclarecendo os benefícios e trade-offs de cada tecnologia isoladamente e em conjunto.

### Como as peças se encaixam

O AMOTIF usa uma cadeia de validação em 3 camadas:

```
TypeBox (define schemas em TypeScript)
    ↓ gera
JSON Schema (padrão OAS/comun)
    ↓ valida
AJV (motor de validação JSON Schema, embutido no Fastify)
    ↓ orquestra
Fastify (aplica validação automaticamente antes dos handlers)
```

- **TypeBox**: Você define schemas usando a API TypeBox (`Type.Object()`, `Type.String()`, etc.)
- **JSON Schema**: TypeBox gera JSON Schema válido como output — é o formato padrão da indústria
- **AJV**: Fastify usa AJV internamente para validar requisições contra o JSON Schema gerado
- **Fastify**: Registra os schemas nas rotas e executa a validação automaticamente via AJV

Isso significa que o AMOTIF se beneficia tanto do **developer experience** do TypeBox (tipos TypeScript inferidos, API amigável) quanto da **performance** do AJV (validação JIT compilada, o motor JSON Schema mais rápido do ecossistema).

O AMOTIF é uma plataforma de colaboração musical assíncrona que demanda uma API extremamente responsiva, com validação rigorosa de dados e suporte a múltiplas operações concorrentes. A escolha desse stack foi orientada por três pilares fundamentais: performance, type-safety e developer experience.

---

## 2. Bun como Runtime

### 2.1 Visão Geral

O **Bun** é um runtime JavaScript moderno construído em Zig, utilizando o motor JavaScriptCore (WebKit) em vez do V8. Isso resulta em startup mais rápido e menor consumo de memória comparado ao Node.js tradicional.

### 2.2 Compatibilidade com Ecossistema Node.js

O Bun é compatível com o ecossistema Node.js existente. O AMOTIF utiliza Prisma, Fastify e diversas bibliotecas do npm que funcionam perfeitamente no Bun sem modificações. Suporte nativo a TypeScript elimina a necessidade de ferramentas externas como `ts-node`.

### 2.3 Vantagens para o AMOTIF

- **Startup rápido**: O servidor sobe em milissegundos, ideal para deploys frequentes
- **Baixo consumo de memória**: Permite escalar verticalmente com mais instâncias
- **Scripts de build**: `bun build` para compilar, `bun build --compile` para gerar executável nativo

```json
// package.json scripts
"dev": "bun --hot src/server.ts",
"build": "bun build ./src/server.ts --minify --target=bun --outfile dist/server.js",
"build_exe": "bun build ./src/server.ts --compile --minify --outfile dist/server"
```

---

## 3. Fastify como Framework

### 3.1 Visão Geral

O **Fastify** é um framework web focado em performance e extensibilidade. Foi desenhado para ser o framework Node.js mais rápido disponível, com suporte nativo a validação de schemas e arquitetura baseada em plugins.

### 3.2 Validação de Schema Nativa (via AJV)

O Fastify permite que cada rota declare seu schema — uma definição formal dos dados esperados — e automaticamente valide todas as requisições antes de passar o controle para o handler. O motor de validação padrão do Fastify é o **AJV** (Another JSON Validator), que compila os schemas em funções JIT ultrarrápidas.

```typescript
const schema = {
  body: Type.Object({
    titulo: Type.String({ minLength: 2 }),
    bpm: Type.Number({ minimum: 40, maximum: 300 })
  })
};

fastify.post('/projetos', schema, async (request) => {
  // request.body já foi validado pelo AJV
  const { titulo, bpm } = request.body;
});
```

Fluxo interno:
1. TypeBox converte o schema para JSON Schema
2. AJV compila o JSON Schema em funções de validação nativas (JIT)
3. Fastify executa essas funções antes de cada requisição
4. Se a validação falhar, Fastify retorna erro 400 com detalhes automaticamente

### 3.3 Sistema de Plugins

O Fastify implementa plugins encapsulados que criam funcionalidades reutilizáveis. No AMOTIF, esta arquitetura é usada para:
- **Hooks de autenticação**: `JWT_verific.ts`, `verificar_dono_projeto.ts`, `verificar_colaborador.ts`
- **Plugins de serviço**: `prisma_plugin`, `Upload_Service`
- **Rotas por domínio**: Cada pasta em `routers/` é um plugin

### 3.4 Documentação Automática

O AMOTIF registra `@fastify/swagger` e `@fastify/swagger-ui`, gerando documentação OpenAPI automaticamente a partir dos schemas TypeBox. Acessível em `/docs`.

---

## 4. TypeBox: Definição de Schemas

### 4.1 Visão Geral

O **TypeBox** é uma biblioteca que implementa tipos executáveis em runtime para TypeScript. Permite definir schemas que funcionam como **geradores de JSON Schema**: você define com a API TypeBox, e o output é JSON Schema válido que o AJV interpreta.

```typescript
import { Type, Static } from '@sinclair/typebox';

const ProjetoSchema = Type.Object({
  titulo: Type.String(),
  bpm: Type.Number()
});

// O TypeBox gera este JSON Schema internamente:
// { "type": "object", "properties": { "titulo": { "type": "string" }, "bpm": { "type": "number" } } }

// Tipo TypeScript inferido do schema
type Projeto = Static<typeof ProjetoSchema>;
```

### 4.2 TypeBox + AJV: Como Funciona

O Fastify usa AJV como motor de validação padrão. Quando você define um schema com TypeBox e o registra numa rota:

1. **TypeBox** converte o schema em JSON Schema
2. **AJV** compila o JSON Schema em funções de validação JIT ultrarrápidas
3. **Fastify** executa essas funções antes de cada requisição

```typescript
// O que você escreve (TypeBox):
body: Type.Object({
  titulo: Type.String({ minLength: 2 }),
  bpm: Type.Number({ minimum: 40, maximum: 300 })
})

// O que o AJV valida (JSON Schema gerado):
// { "type": "object", "required": ["titulo", "bpm"],
//   "properties": {
//     "titulo": { "type": "string", "minLength": 2 },
//     "bpm": { "type": "number", "minimum": 40, "maximum": 300 }
//   }
// }
```

### 4.3 Por que TypeBox em vez de escrever JSON Schema manualmente?

- **Type-safety**: `Static<typeof Schema>` gera o tipo TypeScript automaticamente
- **IDE autocomplete**: `Type.String()`, `Type.Number()` com opções documentadas
- **Composição**: `Type.Partial()`, `Type.Intersect()`, `Type.Union()` para schemas complexos
- **Reutilização**: Enums e schemas base podem ser importados entre arquivos

```typescript
// Enum reutilizável (genero.enum.ts)
const GeneroEnum = Type.Union([
    Type.Literal("ROCK"), Type.Literal("POP"), /* ...18 gêneros */
]);

// Importado em qualquer schema
body: Type.Object({
  genero: GeneroEnum,
  // ...
})
```

### 4.4 Integração com Fastify

O `@fastify/type-provider-typebox` conecta TypeBox ao Fastify:

```typescript
import fastify from 'fastify';
import type { TypeBoxTypeProvider } from '@fastify/type-provider-typebox';

const app = fastify().withTypeProvider<TypeBoxTypeProvider>();
```

Isso permite:
1. Declarar schemas TypeBox diretamente nas rotas
2. Inferir tipos de `request.body`, `request.params`, `request.query` automaticamente
3. Gerar documentação OpenAPI a partir dos schemas
4. Erros de validação padronizados via AJV

---

## 5. Benchmarks: Bun + Fastify + AJV (TypeBox como gerador de JSON Schema)

### 5.1 Tabela Mestra — Ranking Consolidado

Resultados de benchmarks com requisições HTTP simples (validação de schema no body), medindo throughput e latência. A coluna "Validador" indica o motor de validação JSON Schema utilizado:

| # | Runtime | Framework | Validador | Req/s (Média) | Lat. Média | Lat. P99 | Δ vs Topo |
|---|---------|-----------|-----------|---------------|------------|----------|-----------|
| 1 | Bun (JSC) | Hono | AJV | 28.534 | 2,94 ms | 5,60 ms | — (referência) |
| 2 | Bun (JSC) | Elysia | TypeBox* | 25.915 | 3,45 ms | 6,60 ms | -9,2% |
| 3 | Bun (JSC) | Hono | Schema-Shield | 25.021 | 3,61 ms | 7,20 ms | -12,3% |
| 4 | **Bun (JSC)** | **Fastify** | **AJV** | **22.527** | **3,93 ms** | **8,60 ms** | **-21,1%** |
| 5 | Bun (JSC) | Fastify | Typia | 22.450 | 3,90 ms | 8,40 ms | -21,3% |
| 6 | Bun (JSC) | Fastify | Schema-Shield | 21.106 | 4,23 ms | 8,60 ms | -26,0% |
| 7 | Bun (JSC) | Fastify | Zod | 20.379 | 4,42 ms | 9,40 ms | -28,6% |
| 8 | Node (V8) | Hono | AJV | 20.373 | 4,34 ms | 9,40 ms | -28,6% |
| 9 | Node (V8) | Fastify | AJV | 14.998 | 6,16 ms | 14,20 ms | -47,4% |
| 10 | Node (V8) | Fastify | Typia | 14.755 | 6,26 ms | 14,80 ms | -48,3% |
| 11 | Node (V8) | Fastify | Schema-Shield | 14.500 | 6,40 ms | 14,20 ms | -49,2% |
| 12 | Node (V8) | Fastify | Valibot | 14.114 | 6,58 ms | 14,20 ms | -50,5% |
| 13 | Node (V8) | Fastify | Zod | 13.754 | 6,80 ms | 15,00 ms | -51,8% |
| 14 | Bun (JSC) | Fastify | Yup | 6.192 | 15,76 ms | 22,60 ms | -78,3% |
| 15 | Node (V8) | Fastify | Yup | 5.974 | 16,35 ms | 31,00 ms | -79,1% |

\* Elysia usa seu próprio provider TypeBox que embute AJV internamente — o validador subjacente é o mesmo.

**Fonte dos benchmarks:** [github.com/Braian-de-Liz/typemarks](https://github.com/Braian-de-Liz/typemarks)

### 5.2 Análise dos Resultados

**Bun vs Node.js (Fastify + AJV):**
- Bun: 22.527 req/s vs Node: 14.998 req/s → **Bun é ~50% mais rápido**
- Latência média: Bun 3,93ms vs Node 6,16ms

**O stack do AMOTIF (linha 4):**
- Bun + Fastify + AJV = 22.527 req/s, 3,93ms latência média
- TypeBox atua como definidor de schemas que geram JSON Schema para o AJV validar
- Performance equivalente ao Fastify + AJV puro, com a vantagem dos tipos TypeScript

**Validadores comparados (Bun + Fastify):**
- AJV: 22.527 req/s (referência) ← **AMOTIF usa este**
- Typia: 22.450 req/s (-0,3%)
- Schema-Shield: 21.106 req/s (-6,3%)
- Zod: 20.379 req/s (-9,5%)
- Yup: 6.192 req/s (-72,5%)

**Por que AJV?**
- É o validador JSON Schema mais rápido do ecossistema
- Fastify já o utiliza nativamente (zero config extra)
- TypeBox gera JSON Schema perfeitamente compatível com AJV
- Compila schemas em funções JIT otimizadas em runtime

---

## 6. Exemplos no Código AMOTIF

### 6.1 Dependências do Projeto

```json
{
  "dependencies": {
    "@fastify/cookie": "^11.0.2",
    "@fastify/cors": "^11.1.0",
    "@fastify/jwt": "^10.0.0",
    "@fastify/multipart": "^10.1.0",
    "@fastify/rate-limit": "^11.2.0",
    "@fastify/swagger": "^9.7.0",
    "@fastify/swagger-ui": "^5.2.5",
    "@fastify/type-provider-typebox": "^6.1.0",
    "@sinclair/typebox": "^0.34.49",
    "fastify": "5.11.3",
    "@prisma/client": "^7.4.0"
  }
}
```

### 6.2 Enum de Gêneros Musicais

Arquivo: `src/schemas/projetos/genero.enum.ts`

```typescript
import { Type } from '@sinclair/typebox';

const GeneroEnum = Type.Union([
    Type.Literal("ROCK"), Type.Literal("POP"), Type.Literal("JAZZ"), Type.Literal("BLUES"),
    Type.Literal("FORRO"), Type.Literal("METAL"), Type.Literal("HIP_HOP"), Type.Literal("ELECTRONIC"),
    Type.Literal("CLASSICAL"), Type.Literal("LO_FI"), Type.Literal("INDIE"), Type.Literal("SERTANEJO"),
    Type.Literal("SAMBA"), Type.Literal("MPB"), Type.Literal("COUNTRY"), Type.Literal("FUNK"),
    Type.Literal("SOUNDTRACK"), Type.Literal("REGGAE")
]);

export { GeneroEnum };
```

18 gêneros suportados, reutilizável entre schemas via import.

### 6.3 Schema de Criação de Projeto

Arquivo: `src/schemas/projetos/creat_project_schema.ts`

```typescript
import { Type } from '@sinclair/typebox';
import { Error_schema } from '../error/erro_schema.js';
import { GeneroEnum } from './genero.enum.js';

const schema_post_project = {
    schema: {
        tags: ['projeto'],
        description: 'Cria um novo projeto musical',
        security: [{ bearerAuth: [] }],
        body: Type.Object({
            titulo: Type.String({ minLength: 2 }),
            genero: GeneroEnum,
            bpm: Type.Number({ minimum: 40, maximum: 300 }),
            escala: Type.Optional(Type.String()),
            descricao: Type.Optional(Type.String()),
            audio_guia: Type.String({ format: 'uri' }),
            audio_metadata: Type.Optional(Type.Object({
                nome: Type.String(),
                tamanhoMB: Type.Number(),
                duracaoSegundos: Type.Number(),
                codec: Type.String(),
                sampleRate: Type.Number()
            }))
        }),
        response: {
            201: Type.Object({
                status: Type.String(),
                mensagem: Type.String(),
                projeto: Type.Object({
                    id: Type.String({ format: 'uuid' }),
                    titulo: Type.String(),
                    genero: Type.String(),
                    bpm: Type.Number(),
                    escala: Type.Union([Type.String(), Type.Null()]),
                    descricao: Type.Union([Type.String(), Type.Null()]),
                    audio_guia: Type.String(),
                    userId: Type.String(),
                    createdAt: Type.String({ format: 'date-time' }),
                    updatedAt: Type.String({ format: 'date-time' })
                })
            }),
            ...Error_schema
        }
    }
}

export { schema_post_project };
```

Destaques:
- `GeneroEnum` importado de arquivo separado (reutilizável)
- `audio_metadata` como objeto opcional com dados técnicos do áudio
- `response` schema define a forma exata da resposta 201
- `Error_schema` reutilizado para erros padronizados

### 6.4 Schema de Criação de Layer

Arquivo: `src/schemas/layers/create_schema_lyr.ts`

```typescript
import { Type } from '@sinclair/typebox';
import { Error_schema } from '../error/erro_schema.js';

const schema_layer = {
    schema: {
        tags: ['camada'],
        description: 'Cria uma nova camada (trilha de áudio) em um projeto',
        security: [{ bearerAuth: [] }],
        params: Type.Object({
            projetoId: Type.String({ format: 'uuid' })
        }),
        body: Type.Object({
            nome_trilha: Type.String({ minLength: 3 }),
            audio_url: Type.String({ format: 'uri' }),
            instrumento_tag: Type.String({ minLength: 2 }),
            delay_offset: Type.Optional(Type.Integer({ default: 0 })),
            volume_padrao: Type.Optional(Type.Number({ minimum: 0, maximum: 1.5, default: 1.0 }))
        }),
        response: {
            201: Type.Object({
                status: Type.String(),
                mensagem: Type.String(),
                camada: Type.Object({
                    id: Type.String({ format: 'uuid' }),
                    nome_trilha: Type.String(),
                    audio_url: Type.String(),
                    instrumento_tag: Type.String(),
                    delay_offset: Type.Number(),
                    volume_padrao: Type.Number(),
                    esta_aprovada: Type.Boolean(),
                    projetoId: Type.String(),
                    userId: Type.String(),
                    createdAt: Type.String({ format: "date-time" })
                })
            }),
            ...Error_schema
        }
    }
};

export { schema_layer };
```

Destaques:
- `delay_offset` (Integer, default 0) — atraso em ms para sincronia rítmica
- `volume_padrao` (Number, 0–1.5, default 1.0) — volume normalizado
- `params` separado do `body` — ID do projeto na URL

### 6.5 Hook de Autenticação JWT

Arquivo: `src/hooks/JWT_verific.ts`

```typescript
import { FastifyReply, FastifyRequest } from 'fastify';

declare module '@fastify/jwt' {
    interface FastifyJWT {
        user: {
            id: string;
            nome: string;
            email: string;
        }
    }
}

async function autenticarJWT(request: FastifyRequest, reply: FastifyReply) {
    let token = request.cookies?.token;

    if (!token) {
        const authHeader = request.headers.authorization;
        if (authHeader?.startsWith('Bearer ')) {
            token = authHeader.slice(7);
        }
    }

    if (!token) {
        return reply.status(401).send({
            status: "erro",
            mensagem: "Token de autenticação não fornecido"
        });
    }

    try {
        const decoded = request.server.jwt.verify<{ id: string; nome: string; email: string }>(token);
        request.user = decoded;
    }
    catch {
        return reply.status(401).send({
            status: "erro",
            mensagem: "Token de autenticação inválido ou expirado"
        });
    }
}

export { autenticarJWT };
```

Destaques:
- Usa `@fastify/jwt` (não `jsonwebtoken`) — integração nativa com Fastify
- Suporta autenticação via **cookie HttpOnly** ou **header Bearer**
- Declaração de tipos via `declare module` estende o Fastify JWT

### 6.6 Router com Validação Completa

Arquivo: `src/routers/projetos/create_project.ts`

```typescript
import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox';
import { autenticarJWT } from "../../hooks/JWT_verific.js";
import { schema_post_project } from "../../schemas/projetos/creat_project_schema.js";

const post_project: FastifyPluginAsyncTypebox = async (Fastify) => {
    Fastify.addHook("onRequest", autenticarJWT);

    Fastify.post("/projetos", schema_post_project, async (request, reply) => {
        const userId = request.user.id;
        const { titulo, genero, bpm, audio_guia, descricao, escala, audio_metadata } = request.body;

        const novo_projeto = await Fastify.prisma.projeto.create({
            data: {
                titulo, genero, bpm, audio_guia, audio_metadata: audio_metadata ?? undefined,
                descricao, escala, userId
            }
        });

        // Notifica seguidores (fire-and-forget)
        void (async () => {
            const seguidores = await Fastify.prisma.follows.findMany({
                where: { followingId: userId },
                select: { followerId: true }
            });
            if (seguidores.length > 0) {
                await Fastify.prisma.notification.createMany({
                    data: seguidores.map((f) => ({
                        userId: f.followerId,
                        actorId: userId,
                        projetoId: novo_projeto.id,
                        tipo: "PROJECT_RELEASED",
                        mensagem: `${request.user.nome} lançou um novo projeto: "${titulo}"!`
                    }))
                });
            }
        })();

        return reply.status(201).send({
            status: "sucesso",
            mensagem: "Projeto criado com sucesso!",
            projeto: { id: novo_projeto.id, titulo: novo_projeto.titulo, genero: novo_projeto.genero, /* ... */ }
        });
    });
};

export { post_project };
```

Destaques:
- Hook `autenticarJWT` aplicado via `onRequest`
- Schema TypeBox tipa automaticamente `request.body`
- Notificação de seguidores em background (não bloqueia a resposta)
- Acesso direto ao Prisma via `Fastify.prisma`

---

## 7. Conclusão

A escolha do stack Bun + Fastify + TypeBox + AJV é validada por benchmarks reais:

- **Bun + Fastify + AJV** processa ~22.500 req/s, ~50% mais que Node.js + Fastify
- **TypeBox** atua como definidor de schemas que geram JSON Schema para o AJV validar
- A combinação está entre as **top 5** configurações testadas

A cadeia de validação funciona em 3 camadas:

```
TypeBox (define schemas com API TypeScript)
    ↓ gera
JSON Schema (formato padrão da indústria)
    ↓ valida
AJV (motor de validação JIT compilado, embutido no Fastify)
```

Além da performance, o stack oferece:
- **Type-safety end-to-end**: Tipos TypeScript inferidos dos schemas TypeBox via `Static<>`
- **Validação automática**: AJV valida body, params, query e headers antes dos handlers
- **Documentação OpenAPI**: Gerada automaticamente a partir dos schemas TypeBox
- **Arquitetura de plugins**: Modularidade e reutilização de hooks e rotas
- **Developer experience**: Autocomplete, tipos inferidos, zero código de validação manual

Para mais detalhes sobre a arquitetura geral do AMOTIF, consulte `Architecture.md` e `organization.md` neste mesmo diretório.

---

**Documento mantido por:** Braian de Liz  
**Última revisão:** 20 de agosto de 2026
