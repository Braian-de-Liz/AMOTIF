# Fastify Structure – AMOTIF

## Por que não seguimos o MVC tradicional?

No desenvolvimento do backend do AMOTIF, optamos deliberadamente por **não** implementar o padrão MVC (Models, Views, Controllers) com camadas de Services e Repositories. Em vez disso, construímos uma arquitetura baseada nos conceitos nativos do Fastify: **plugins**, **schemas** e **hooks**.  

Esta decisão não foi arbitrária. Ela surge da busca por **performance máxima**, **baixo acoplamento** e **alta manutenibilidade**, alinhada ao ecossistema moderno de Node.js (executado pelo Bun) e às necessidades específicas de uma plataforma de colaboração musical assíncrona.

---

## 1. A Filosofia Fastify‑Native: Encapsulamento via Plugins

Fastify foi projetado desde o início como um **grafo de plugins**. Cada plugin pode ser uma rota, um conjunto de rotas, um hook global ou qualquer funcionalidade que precise de seu próprio contexto.

```typescript
// server.ts
import fastify from 'fastify'
import { projetoRoutes } from './routers/projetos/create_project'

const app = fastify()
app.register(projetoRoutes) // cada roteador é um plugin

```

Encapsulamento automático: Cada plugin herda os hooks e decorators do contexto pai, mas pode ter seu próprio escopo.
Nenhuma necessidade de classes de Controller: As rotas são funções que recebem fastify e registram endpoints. O request e reply estão disponíveis diretamente.

```typescript
// routers/projetos/create_project.ts
import { FastifyInstance } from 'fastify'
import { createProjectSchema } from '../../schemas/projetos/creat_project_schema'

export async function createProjectRoutes(fastify: FastifyInstance) {
  fastify.post('/projects', {
    schema: createProjectSchema,
    preHandler: [fastify.verifyJWT]  // hook de autenticação
  }, async (request, reply) => {
    const { title, bpm, genre } = request.body
    const project = await prisma.project.create({ data: { ... } })
    return reply.status(201).send(project)
  })
}

```

Isso elimina a camada de Controller que apenas serviria como passagem de dados. 
A lógica de negócio fica onde deve estar: na rota, com acesso direto ao Prisma.


2. Schema‑First Design (Zod + Fastify)
A pasta schemas/ contém todas as definições de validação utilizando Zod. Esses schemas são a única fonte da verdade para:

Validação de body, params, query, headers

Geração automática de tipos TypeScript (inferidos a partir do Zod)

Compilação JIT (Just‑In‑Time) pelo Fastify, garantindo validação extremamente rápida

```typescript
// schemas/projetos/creat_project_schema.ts
import { z } from 'zod'

export const createProjectSchema = {
  body: z.object({
    titulo: z.string().min(3),
    genero: z.nativeEnum(MusicGenre),
    bpm: z.number().int().min(40).max(300).default(120),
    escala: z.string().optional(),
    audio_guia: z.string().url()
  })
}

```

Benefícios:

Sem validação manual em services ou controllers.

Performance: Fastify compila os schemas em funções nativas, reduzindo overhead.

Type‑safety: Os tipos inferidos são usados em toda a aplicação, garantindo que request.body tenha a forma esperada.


3. Encapsulamento via Hooks
Toda lógica de autorização e pré‑processamento que tradicionalmente estaria em um Controller ou Middleware foi movida para hooks reutilizáveis.

```typescript

// hooks/verificar_dono_projeto.ts
export async function verifyProjectOwner(fastify: FastifyInstance) {
  fastify.addHook('preHandler', async (request, reply) => {
    const projectId = request.params.id
    const project = await prisma.project.findUnique({
      where: { id: projectId }
    })
    if (!project || project.userId !== request.user.id) {
      return reply.status(403).send({ error: 'Forbidden' })
    }
  })
}

```

Esses hooks são registrados globalmente ou aplicados seletivamente nas rotas via preHandler.

Reutilização: verificar_dono_projeto é usado em rotas de edição, deleção e aprovação de layers.

Rotas enxutas: O código da rota fica focado exclusivamente na execução da regra de negócio.

Segurança: A verificação de permissão é centralizada, reduzindo o risco de esquecê‑la em uma rota.

--

4. Redução de Boilerplate e Indireção
Em uma arquitetura MVC tradicional, teríamos:

```txt
Controller → Service → Repository → Prisma
```

Cada camada adiciona indireção e boilerplate. Muitas vezes, os services apenas repassam dados sem transformação significativa (pass‑through).

No AMOTIF, a estrutura é flat:


```txt
Rota → Prisma (via lib/prisma.ts)
```

Menos arquivos: Não criamos dezenas de classes só para seguir um padrão.

Desenvolvimento mais rápido: Para alterar um endpoint, basta editar o arquivo da rota e seu schema correspondente.

Menos bugs: Menos código significa menos superfície para erros.


5. Performance com Bun
Executamos nossa API com Bun, um runtime compatível com Node.js, mas muito mais rápido em inicialização e consumo de memória.

Funções puras vs classes: Nossa estrutura baseada em funções (rotas, hooks) é mais amigável ao JIT do Bun. Instâncias de classes (como Controllers injetados) criam overhead desnecessário.

Boot rápido: O servidor sobe em milissegundos, ideal para ambientes serverless ou deploys frequentes.

Menor footprint: A ausência de múltiplas camadas de abstração reduz a quantidade de objetos em memória.



6. Manutenibilidade
A organização dos diretórios reflete a estrutura modular:

```txt
routers/
  projetos/
    create_project.ts
    get_projects.ts
    ...
schemas/
  projetos/
    creat_project_schema.ts
    get_schemaPROJETC.ts
    ...

```

Espelhamento: Cada rota tem seu schema na mesma estrutura de pastas. Para encontrar a validação de uma rota, basta ir para schemas/ e seguir o mesmo caminho.

Alterações localizadas: Se a regra de negócio de criação de projeto mudar, alteramos create_project.ts e seu schema. O impacto é mínimo.

Onboarding rápido: Um novo desenvolvedor entende imediatamente onde colocar um novo endpoint ou modificar um existente.


7. Quando usaríamos Services/Controllers?
Essa abordagem não é um dogma. Em projetos onde a lógica de negócio é altamente complexa, envolvendo múltiplas transações, eventos ou integrações, uma camada de serviço pode fazer sentido.

No AMOTIF, porém:

A maior parte das rotas é CRUD com verificações de permissão simples.

As operações mais complexas (como aprovação de layer e notificações) ainda cabem perfeitamente dentro da rota, usando Prisma transações.

Mantivemos a flexibilidade: se um dia uma rota crescer demais, podemos extrair a lógica para uma função utilitária dentro do mesmo módulo, sem criar uma camada global de serviços.