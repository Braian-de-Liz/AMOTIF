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
import { Plugin_Routes } from './routers/plugin_routes'

const app = fastify()
app.register(Plugin_Routes, { prefix: "/api" }) // todas as rotas como um plugin

```

Encapsulamento automático: Cada plugin herda os hooks e decorators do contexto pai, mas pode ter seu próprio escopo.
Nenhuma necessidade de classes de Controller: As rotas são funções que recebem fastify e registram endpoints. O request e reply estão disponíveis diretamente.

```typescript
// routers/projetos/create_project.ts
import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox'
import { autenticarJWT } from '../../hooks/JWT_verific'
import { createProjectSchema } from '../../schemas/projetos/creat_project_schema'

export const post_project: FastifyPluginAsyncTypebox = async (Fastify) => {
  Fastify.addHook("onRequest", autenticarJWT);

  Fastify.post('/projeto', {
    schema: createProjectSchema,
  }, async (request, reply) => {
    const { titulo, genero, bpm } = request.body
    const project = await Fastify.prisma.projeto.create({ data: { ... } })
    return reply.status(201).send(project)
  })
}

```

Isso elimina a camada de Controller que apenas serviria como passagem de dados. 
A lógica de negócio fica onde deve estar: na rota, com acesso direto ao Prisma.


## 2. Schema‑First Design (TypeBox + Fastify)

A pasta `schemas/` contém todas as definições de validação utilizando TypeBox. Esses schemas são a única fonte da verdade para:

- Validação de body, params, query, headers
- Geração automática de tipos TypeScript (inferidos a partir do TypeBox)
- Compilação JIT (Just‑In‑Time) pelo Fastify, garantindo validação extremamente rápida

```typescript
// schemas/projetos/creat_project_schema.ts
import { Type } from '@sinclair/typebox'

export const createProjectSchema = {
  body: Type.Object({
    titulo: Type.String({ minLength: 2 }),
    genero: Type.Union([Type.Literal("ROCK"), Type.Literal("POP"), /* ...18 gêneros */]),
    bpm: Type.Number({ minimum: 40, maximum: 300 }),
    escala: Type.Optional(Type.String()),
    audio_guia: Type.String({ format: 'uri' })
  })
}

```

Benefícios:

- Sem validação manual em services ou controllers.
- Performance: Fastify compila os schemas em funções nativas, reduzindo overhead.
- Type‑safety: Os tipos inferidos são usados em toda a aplicação, garantindo que `request.body` tenha a forma esperada.

## 3. Encapsulamento via Hooks

Toda lógica de autorização e pré‑processamento que tradicionalmente estaria em um Controller ou Middleware foi movida para hooks reutilizáveis.

```typescript
// hooks/verificar_dono_projeto.ts
import { FastifyReply, FastifyRequest } from "fastify";

async function verificar_dono_projeto(request: FastifyRequest, reply: FastifyReply) {
    const { projetoId } = request.params as { projetoId: string };
    const projeto = await Fastify.prisma.projeto.findUnique({
      where: { id: projetoId }
    });
    if (!projeto || projeto.userId !== request.user.id) {
      return reply.status(403).send({ error: 'Forbidden' })
    }
}

```

Esses hooks são registrados globalmente ou aplicados seletivamente nas rotas via `preHandler`.

Reutilização: `verificar_dono_projeto` é usado em rotas de edição, deleção e aprovação de layers.

Rotas enxutas: O código da rota fica focado exclusivamente na execução da regra de negócio.

Segurança: A verificação de permissão é centralizada, reduzindo o risco de esquecê‑la em uma rota.

---

## 4. Redução de Boilerplate e Indireção

Em uma arquitetura MVC tradicional, teríamos:

```txt
Controller → Service → Repository → Prisma
```

Cada camada adiciona indireção e boilerplate. Muitas vezes, os services apenas repassam dados sem transformação significativa (pass‑through).

No AMOTIF, a estrutura é flat:

```txt
Rota → Prisma (via Fastify.prisma)
```

Menos arquivos: Não criamos dezenas de classes só para seguir um padrão.

Desenvolvimento mais rápido: Para alterar um endpoint, basta editar o arquivo da rota e seu schema correspondente.

Menos bugs: Menos código significa menos superfície para erros.

---

## 5. Performance com Bun

Executamos nossa API com Bun, um runtime compatível com Node.js, mas muito mais rápido em inicialização e consumo de memória.

Funções puras vs classes: Nossa estrutura baseada em funções (rotas, hooks) é mais amigável ao JIT do Bun. Instâncias de classes (como Controllers injetados) criam overhead desnecessário.

Boot rápido: O servidor sobe em milissegundos, ideal para ambientes serverless ou deploys frequentes.

Menor footprint: A ausência de múltiplas camadas de abstração reduz a quantidade de objetos em memória.

---

## 6. Manutenibilidade

A organização dos diretórios reflete a estrutura modular:

```txt
src/
  routers/
    user/
      cadastro.ts
      login.ts
      logout.ts
      ...
    projetos/
      create_project.ts
      get_projects.ts
      mural_project.ts
      togle_favorites.ts
      ...
    layers/
      create_layer.ts
      delete_layer.ts
      update_layers.ts
      autorizar_layer.ts
    colaboration/
      convite_project.ts
      accept_invite.ts
      ...
    versions/
      get_versions.ts
      manage_branches.ts
    sugestoes/
      criar_sugestao.ts
      listar_sugestoes.ts
      ...
    notification/
    search/
    follows/
    likes/
    upload/
    health/
  schemas/
    user_schema/
    projetos/
    layers/
    colaboration/
    versions/
    sugestoes/
    notification/
    search/
    follows/
    likes/
    upload/
    error/
  hooks/
    JWT_verific.ts
    verificar_dono_projeto.ts
    verificar_dono_layer.ts
    verificar_colaborador.ts
    verificar_permissao.ts
  lib/
    prisma.ts
    upload.ts
    global_Error.ts
    refreshToken.ts
    cpf.ts
  services/
    versionService.ts
```

Espelhamento: Cada rota tem seu schema na mesma estrutura de pastas. Para encontrar a validação de uma rota, basta ir para `schemas/` e seguir o mesmo caminho.

Alterações localizadas: Se a regra de negócio de criação de projeto mudar, alteramos `create_project.ts` e seu schema. O impacto é mínimo.

Onboarding rápido: Um novo desenvolvedor entende imediatamente onde colocar um novo endpoint ou modificar um existente.

---

## 7. Quando Extrair Services?

A abordagem flat não é um dogma. Extraímos uma camada de service quando a lógica é **compartilhada entre múltiplas rotas** e **complexa o suficiente** para justificar a separação.

No AMOTIF, a primeira extração foi o `versionService.ts`:

```typescript
// services/versionService.ts
async function createNewVersion(prisma, camadaId, userId, data, mensagem?) {
  const nextVersion = await getNextVersionNumber(prisma, camadaId);
  const version = await prisma.layerVersion.create({ data: { ... } });
  await prisma.camada.update({ where: { id: camadaId }, data: { currentVersionId: version.id } });
  return version;
}
```

Esse service é chamado tanto pelo `create_layer.ts` (versão inicial) quanto pelo `update_layers.ts` (nova versão). Sem a extração, a lógica de versionamento estaria duplicada em duas rotas.

Critérios para extrair um service:
- Lógica compartilhada entre 2+ rotas
- Operações com múltiplas queries Prisma que formam uma unidade de negócio
- Complexidade que compromete a legibilidade da rota

Para a maioria das rotas (CRUD + verificações de permissão simples), a abordagem flat continua sendo a mais eficiente.

---

## 8. Tratamento Centralizado de Erros

O `lib/global_Error.ts` implementa um handler de erros que mapeia automaticamente:

- **Códigos Prisma** (P2000-P2034) → respostas HTTP apropriadas (400, 404, 409, 500, etc.)
- **Erros JWT** (token ausente, inválido, expirado) → 401
- **Erros de validação Fastify** → 400 com detalhes do campo
- **Erros de conexão com o banco** → 503 com mensagem amigável

Isso elimina a necessidade de try/catch repetido em cada rota e garante respostas consistentes para o frontend.

---

## 9. Organização dos 13 Domínios de Rota

Cada domínio é um plugin Fastify registrado em `plugin_routes.ts`:

| Domínio | Responsabilidade |
|---------|-----------------|
| `user/` | Autenticação, perfil, recuperação de senha |
| `projetos/` | CRUD de projetos, feed, mural, favoritos |
| `layers/` | Envio, edição, exclusão, aprovação de camadas |
| `colaboration/` | Convites, aceite, rejeição, listagem de colaboradores |
| `versions/` | Versionamento de layers, rollback |
| `sugestoes/` | Sugestões de colaboradores sobre projetos |
| `follows/` | Seguir/deixar de seguir usuários |
| `likes/` | Curtir projetos |
| `notification/` | Notificações do sistema |
| `search/` | Busca de projetos e usuários por instrumento |
| `upload/` | Upload de áudio para Supabase |
| `health/` | Health check e validação de integridade |

O arquivo `plugin_routes.ts` atua como o **registro central** de todos os plugins, mantendo uma visão clara de todas as rotas disponíveis.

---

## 10. Conclusão

A arquitetura do AMOTIF prova que é possível construir um backend robusto e escalável **sem** seguir MVC rigidamente. O关键是:

1. **Plugins do Fastify** substituem Controllers e Middlewares
2. **TypeBox schemas** substituem validação manual
3. **Hooks reutilizáveis** centralizam autorização
4. **Acesso direto ao Prisma** elimina a camada de Repository
5. **Services apenas quando necessário** — não como regra

O resultado é uma base de código com **menos arquivos**, **menos boilerplate**, **mais performance** e **facilidade de manutenção**.

---

**Documento mantido por:** Braian de Liz  
**Última revisão:** 20 de agosto de 2026
