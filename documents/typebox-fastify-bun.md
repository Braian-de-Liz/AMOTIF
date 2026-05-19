# TypeBox, Fastify e Bun: Stack Tecnológico do Backend AMOTIF

## 1. Introdução

Este documento detalha as justificativas técnicas e arquiteturais para a escolha do trio **Bun** (runtime), **Fastify** (framework) e **TypeBox** (biblioteca de validação) no backend do AMOTIF. O objetivo é documentar as decisões técnicas que guiam a implementação da API principal, esclarecendo os benefícios e trade-offs de cada tecnologia isoladamente e em conjunto.

O AMOTIF é uma plataforma de colaboração musical assíncrona que demanda uma API extremamente responsiva, com validação rigorosa de dados e suporte a múltiplas operações concorrentes. A escolha desse stack foi orientada por três pilares fundamentais: performance, type-safety e developer experience.

---

## 2. Bun como Runtime

### 2.1 Visão Geral

O **Bun** é um runtime JavaScript moderno que se destaca por sua velocidade异常的 startup e baixo consumo de memória. Desenvolvido por Jarred Sumner, o Bun foi construído do zero em Zig e utiliza o motor JavaScriptCore (da Apple) em vez do V8, o que contribui para sua performance superior em diversos cenários.

### 2.2 Performance Comparativa

Em testes de benchmark, o Bun apresenta resultados expressivos quando comparado ao Node.js tradicional:

| Métrica | Bun | Node.js |
|---------|-----|---------|
| Startup time | ~50ms | ~200ms |
| HTTP throughput | ~50k req/s | ~15k req/s |
| Memory usage | ~30MB base | ~60MB base |

Estes números são particularmente relevantes para o AMOTIF, onde o servidor precisa lidar com múltiplas requisições simultâneas de upload de camadas de áudio, consultas de projetos e notificações em tempo real.

### 2.3 Compatibilidade com Ecossistema Node.js

Uma das maiores vantagens do Bun é sua compatibilidade com o ecossistema Node.js existente. O AMOTIF utiliza diversas bibliotecas populares como Prisma, Fastify e jsonwebtoken, e todas funcionam perfeitamente no Bun sem necessidade de modificações no código. Isso permite uma migração gradual e reduz o risco de adoção.

Além disso, o Bun oferece suporte nativo a TypeScript, eliminando a necessidade de ferramentas externas como `ts-node` ou `esbuild` para compilação. O AMOTIF configura o Bun executar arquivos `.ts` em desenvolvimento, simplificando o workflow de desenvolvimento.

### 2.4 Justificativa Técnica para API de Alta Concorrência

Para uma plataforma como o AMOTIF, onde músicos podem interagir simultaneamente com múltiplos projetos, fazer uploads de camadas de áudio e receber notificações em tempo real, o Bun oferece as seguintes vantagens:

**Gerenciamento de concorrência**: O Bun utiliza um event loop otimizado que lida melhor com operações I/O-assíncronas, típicas de aplicações web modernas.

**Baixo footprint de memória**: Com menos memória utilizada em idle, o servidor pode escalar verticalmente com mais instâncias no mesmo hardware.

**Ziggar (Garbage Collector)**: O coletor de lixo do Bun, herdado do WebKit, é otimizado para workloads com muita alocação temporária de objetos, comum em parsing de JSON e manipulação de dados.

---

## 3. Fastify como Framework

### 3.1 Visão Geral

O **Fastify** é um framework web para Node.js focado em simplicidade, performance e extensibilidade. Criado por Matteo Collina e Tomas Della Vedova, o Fastify foi desenhado desde o início para ser o framework Node.js mais rápido disponível, sacrificando conveniência em favor de performance onde necessário.

### 3.2 Desempenho Superior

Os benchmarks independentes confirmam consistentemente a superioridade do Fastify:

| Framework | req/s (plain) | Latência média |
|-----------|---------------|----------------|
| Fastify | ~45k | 0.5ms |
| Express | ~15k | 2.1ms |
| Hono | ~38k | 0.7ms |

Esta diferença de performance é crítica para o AMOTIF, pois permite que o servidor processe mais requisições com os mesmos recursos de hardware, resultando em melhor experiência para o usuário, especialmente em momentos de pico de acesso.

### 3.3 Validação de Schema Nativa

Uma das características mais distintivas do Fastify é sua integração profunda com sistemas de validação de schema. O framework foi projetado para que cada rota declare seu "schema" - uma definição formal dos dados esperados - e automaticamente valide todas as requisições contra esse schema antes de passar o controle para o handler da rota.

```typescript
const createProjectSchema = {
  body: Type.Object({
    titulo: Type.String({ minLength: 1, maxLength: 200 }),
    genero: Type.Enum(['ROCK', 'POP', 'JAZZ', 'CLASSICAL', 'ELECTRONIC', 'MPB', 'OTHER']),
    bpm: Type.Integer({ minimum: 20, maximum: 300 }),
    audio_guia: Type.String({ format: 'uri' }),
    descricao: Type.Optional(Type.String({ maxLength: 1000 })),
    escala: Type.Optional(Type.String())
  })
};
```

No exemplo acima, o Fastify automaticamente:
- Valida que o corpo da requisição é um objeto JSON
- Verifica que `titulo` é uma string não vazia com no máximo 200 caracteres
- Confirma que `genero` é um dos valores permitidos
- Garante que `bpm` está no intervalo válido
- Formata erros detalhados quando a validação falha

Esta abordagem elimina a necessidade de escrever código manual de validação em cada endpoint, reduzindo significativamente a probabilidade de bugs relacionados a dados inválidos.

### 3.4 Sistema de Plugins

O Fastify implementa um sistema de plugins encapsulados que permite criar funcionalidades reutilizáveis e composáveis. Cada plugin pode:
- Definir suas próprias rotas
- Injetar dependências no contexto da requisição
- Criar hooks específicos para seu domínio

No AMOTIF, esta arquitetura se demonstra particularmente útil para:
- **Autenticação**: Um plugin `auth` que adiciona o usuário autenticado ao contexto
- **Validação de permissões**: Plugin que verifica propriedades de projetos e camadas
- **Logging**: Plugin centralizado que registra todas as requisições

```typescript
const authPlugin = async (fastify: FastifyInstance) => {
  fastify.addHook('preValidation', async (request) => {
    const token = request.headers.authorization;
    const user = await verifyJWT(token);
    request.user = user;
  });
};
```

### 3.5 Suporte a TypeScript

O Fastify foi escrito em TypeScript desde sua primeira versão e oferece tipagem completa de todas as suas APIs. Isso significa que quando você usa o Fastify, você obtém:
- IntelliSense completo no seu editor
- Verificação de tipos em tempo de compilação
- Refatoração segura
- Documentação viva através dos tipos

---

## 4. TypeBox como Sistema de Validação

### 4.1 Visão Geral

O **TypeBox** é uma biblioteca criada por Michael Sinclair que implementa um sistema de tipos executáveis em runtime para TypeScript. A filosofia central do TypeBox é permitir que desenvolvedores definam seus tipos uma única vez e os utilizem tanto para validação de runtime quanto para documentação e geração de código.

### 4.2 Type Safety em Runtime

TypeScript oferece type-safety em tempo de compilação, mas esses tipos não existem em runtime. Quando seu código é compilado para JavaScript, toda a informação de tipos é removida. Isso cria uma lacuna perigosa:

```typescript
// TypeScript tahu que isso é um erro em compile-time
const projeto: Projeto = { titulo: 123 }; // ❌ Erro de tipo

// Mas em runtime, não há verificação
const data = JSON.parse('{ "titulo": 123 }'); // ✅ Válido!
```

O TypeBox resolve esse problema fornecendo schemas que existem em runtime:

```typescript
import { Type, Static } from '@sinclair/typebox';

const ProjetoSchema = Type.Object({
  titulo: Type.String(),
  bpm: Type.Integer()
});

// Este tipo é gerado automaticamente a partir do schema
type Projeto = Static<typeof ProjetoSchema>;
```

Com o TypeBox, você pode validar dados em runtime contra o schema, garantindo que os dados que chegam à sua aplicação são exatamente o que você espera.

### 4.3 Integração com Fastify

O Fastify suporte nativamente o TypeBox através do plugin `@fastify/type-provider-typebox`. Esta integração permite que você declare schemas usando a sintaxe do TypeBox e o Fastify automaticamente:

1. Valide o corpo, parâmetros, query string e headers de cada requisição
2. Serialize as respostas de acordo com o schema definido
3. Gere documentação OpenAPI automaticamente
4. Forneça erros de validação detalhados e padronizados

```typescript
import { Type, Static } from '@sinclair/typebox';
import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox';

const createProjectSchema = {
  schema: {
    body: Type.Object({
      titulo: Type.String({ minLength: 1 }),
      bpm: Type.Integer({ minimum: 1, maximum: 300 })
    })
  }
};

const createProject: FastifyPluginAsyncTypebox = async (fastify) => {
  fastify.post('/projetos', createProjectSchema, async (request) => {
    // request.body já foi validado!
    const { titulo, bpm } = request.body;
    return { id: 'uuid', titulo, bpm };
  });
};
```

### 4.4 Benefícios Adicionais

#### Documentação Automática
Quando você define schemas com TypeBox e Fastify, a documentação OpenAPI é gerada automaticamente. Isso significa que sua API está sempre documentada, sem esforço extra.

#### Reutilização de Schemas
Os schemas TypeBox podem ser compostos e reutilizados:

```typescript
const UserBase = Type.Object({
  email: Type.String({ format: 'email' }),
  nome: Type.String({ minLength: 2 })
});

const CreateUserSchema = Type.Object({
  ...UserBase.properties,
  senha: Type.String({ minLength: 8 })
});

const UpdateUserSchema = Type.Partial(UserBase);
```

#### Validação de Respostas
O TypeBox também pode validar as respostas da sua API, garantindo consistência:

```typescript
const ProjectResponseSchema = Type.Object({
  id: Type.String({ format: 'uuid' }),
  titulo: Type.String(),
  autor: Type.Object({
    nome: Type.String()
  })
});

fastify.get('/projetos/:id', {
  schema: {
    response: {
      200: ProjectResponseSchema
    }
  }
}, handler);
```

---

## 5. Benefícios Combinados

### 5.1 Type-Safety End-to-End

A combinação Bun + Fastify + TypeBox proporciona type-safety em todas as camadas:

1. **Types compartilhados**: Você pode exportar os tipos TypeBox para o frontend, garantindo que o que o servidor espera é exatamente o que o cliente envia
2. **Validação em boundaries**: Cada requisição que entra no sistema é validada antes de tocar qualquer lógica de negócio
3. **Consistência de dados**: O mesmo schema usado para validação de requisição pode ser usado para serialização de resposta

### 5.2 Redução de Código Boilerplate

Comparando com abordagens tradicionais:

| Abordagem | Linhas de código (validar 5 campos) |
|-----------|-------------------------------------|
| Manual (if/else) | ~30 linhas |
| Yup/Joi | ~15 linhas |
| TypeBox + Fastify | ~5 linhas |

### 5.3 Menos Bugs em Produção

A validação rigorosa de dados em cada endpoint significa que:

- Dados inválidos são rejeitados imediatamente na borda da API
- Não há risco de tipos inesperados causando erros em lógica downstream
- Erros são padronizados e fáceis de debugar

### 5.4 Performance Otimizada

O Fastify compila os schemas TypeBox em funções de validação altamente otimizadas. Isso significa que a validação adiciona overhead mínimo ao processamento de cada requisição, mantendo a performance excepcional do framework.

---

## 6. Exemplos no Código AMOTIF

### 6.1 Schema de Criação de Projeto

Arquivo: `back_end/src/schemas/projetos/creat_project_schema.ts`

```typescript
import { Type } from '@sinclair/typebox';

const post_project_schema = {
  schema: {
    tags: ['Projetos'],
    description: 'Cria um novo projeto musical',
    security: [{ bearerAuth: [] }],
    body: Type.Object({
      titulo: Type.String({ 
        minLength: 1, 
        maxLength: 200,
        description: 'Título do projeto'
      }),
      genero: Type.Union([
        Type.Literal('ROCK'),
        Type.Literal('POP'),
        Type.Literal('JAZZ'),
        Type.Literal('CLASSICAL'),
        Type.Literal('ELECTRONIC'),
        Type.Literal('MPB'),
        Type.Literal('OTHER')
      ], { description: 'Gênero musical do projeto' }),
      bpm: Type.Integer({ 
        minimum: 20, 
        maximum: 300, 
        default: 120,
        description: 'Batidas por minuto'
      }),
      audio_guia: Type.String({ 
        format: 'uri',
        description: 'URL do arquivo de áudio guia'
      }),
      descricao: Type.Optional(Type.String({ maxLength: 1000 })),
      escala: Type.Optional(Type.String({ maxLength: 50 }))
    }),
    response: {
      201: Type.Object({
        status: Type.String(),
        projeto: Type.Object({
          id: Type.String({ format: 'uuid' }),
          titulo: Type.String(),
          genero: Type.String()
        })
      }),
      400: Type.Object({
        status: Type.String(),
        mensagem: Type.String()
      })
    }
  }
};

export { post_project_schema };
```

Este schema demonstra:
- Descrições detalhadas para documentação
- Validação de tipo enumerado para gêneros
- Range validation para BPM
- Formato URI para URLs de áudio
- Response schemas definidos

### 6.2 Schema de Criação de Layer

Arquivo: `back_end/src/schemas/layers/create_schema_lyr.ts`

```typescript
import { Type } from '@sinclair/typebox';

const create_layer_schema = {
  schema: {
    tags: ['Layers'],
    description: 'Cria uma nova camada de áudio para um projeto',
    security: [{ bearerAuth: [] }],
    params: Type.Object({
      projetoId: Type.String({ format: 'uuid', description: 'ID do projeto' })
    }),
    body: Type.Object({
      nome_trilha: Type.String({ 
        minLength: 1, 
        maxLength: 100,
        description: 'Nome identificador da trilha'
      }),
      audio_url: Type.String({ 
        format: 'uri',
        description: 'URL do arquivo de áudio no storage'
      }),
      instrumento_tag: Type.String({ 
        minLength: 1,
        description: 'Tag identificando o instrumento'
      }),
      instrumento_nome: Type.String({ 
        minLength: 1,
        description: 'Nome descritivo do instrumento'
      }),
      delayMs: Type.Optional(Type.Integer({ 
        minimum: 0,
        description: 'Atraso em milissegundos para sincronia'
      })),
      bpm_override: Type.Optional(Type.Integer({ 
        minimum: 20, 
        maximum: 300,
        description: 'BPM diferente do projeto (opcional)'
      }))
    })
  }
};

export { create_layer_schema };
```

### 6.3 Hook de Autenticação JWT

Arquivo: `back_end/src/hooks/JWT_verific.ts`

```typescript
import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox';
import jwt from 'jsonwebtoken';

interface JWTPayload {
  id: string;
  email: string;
  nome: string;
}

export const autenticarJWT: FastifyPluginAsyncTypebox = async (fastify) => {
  fastify.addHook('preValidation', async (request) => {
    const authHeader = request.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw fastify.httpErrors.unauthorized('Token de autenticação não fornecido');
    }

    const token = authHeader.substring(7);
    
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JWTPayload;
      request.user = decoded;
    } catch (err) {
      throw fastify.httpErrors.unauthorized('Token de autenticação inválido ou expirado');
    }
  });
};
```

### 6.4 Router com Validação Completa

Arquivo: `back_end/src/routers/projetos/create_project.ts`

```typescript
import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox';
import { autenticarJWT } from '../../hooks/JWT_verific.js';
import { post_project_schema } from '../../schemas/projetos/creat_project_schema.js';

const post_project: FastifyPluginAsyncTypebox = async (Fastify) => {
  Fastify.addHook('preValidation', autenticarJWT);

  Fastify.post('/projetos', post_project_schema, async (request, reply) => {
    const userId = request.user.id;
    const { titulo, genero, bpm, audio_guia, descricao, escala } = request.body;

    const novo_projeto = await Fastify.prisma.projeto.create({
      data: {
        titulo,
        genero,
        bpm,
        audio_guia,
        descricao,
        escala,
        userId: userId
      }
    });

    return reply.status(201).send({
      status: 'sucesso',
      projeto: {
        id: novo_projeto.id,
        titulo: novo_projeto.titulo,
        genero: novo_projeto.genero
      }
    });
  });
};

export { post_project };
```

---

## 7. Conclusão

A escolha do stack Bun + Fastify + TypeBox representa uma abordagem consciente para construir uma API de alta performance com strong typing. Cada tecnologia foi selecionada por suas características específicas:

- **Bun** proporciona performance superior e baixo consumo de recursos
- **Fastify** oferece o framework mais rápido do ecossistema Node.js com validação nativa
- **TypeBox** permite type-safety em runtime com schemas reutilizáveis

Juntos, esses três componentes criam uma base sólida para o AMOTIF, permitindo que a equipe de desenvolvimento construa funcionalidades complexas com confiança, sabendo que a validação de dados está garantida em cada endpoint.

Para mais detalhes sobre a arquitetura geral do AMOTIF, consulte o documento `Architecture.md` neste mesmo diretório.

---

**Documento mantido por:** Braian de Liz  
**Última revisão:** 18 de maio de 2026