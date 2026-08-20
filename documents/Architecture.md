# Architecture Document – AMOTIF

## 1. Visão Geral

AMOTIF é uma plataforma de colaboração musical assíncrona, projetada para funcionar como um **"Git para músicos"**.  
O sistema permite que um **Dono do Projeto** crie uma *track* base (ex.: Violão, BPM 120, Tom Sol Maior). Outros músicos podem enviar **Layers** (camadas de áudio) que, após aprovação do proprietário, tornam-se parte oficial do projeto.  
Metadados críticos como **BPM**, **Tonalidade** e **Offset (delay)** são armazenados para garantir a sincronia perfeita entre todas as camadas.

---

## 2. Arquitetura

A arquitetura adota uma abordagem flat e baseada em plugins do Fastify, com separação clara de responsabilidades entre rotas, hooks e schemas.

### 2.1 API Principal (Backend – Bun + Fastify)
- **Tecnologias**: Bun (runtime), Fastify v5, Prisma v7, TypeBox (definição de schemas), AJV (validação JSON Schema), TypeScript.
- **Função**: Gerencia toda a lógica de negócio, autenticação, autorização, relacionamentos (projetos, layers, colaboradores, seguidores), buscas, notificações, sugestões, mural e upload de áudio.
- **Upload de Áudio**: Utiliza `@fastify/multipart` para receber arquivos diretamente no servidor, com validação de tamanho (40MB) e tipo MIME. O binário é transmitido via streaming para o **Supabase Storage**, sem carregar o arquivo completo em memória. Tipos aceitos: MP3, WAV, OGG, FLAC, AAC, M4A.
- **Autenticação**: JWT via `@fastify/jwt` com tokens de acesso (4h) e refresh tokens rotativos armazenados no banco. Cookies `HttpOnly` via `@fastify/cookie` com SameSite=None.
- **Documentação**: Swagger/OpenAPI integrado via `@fastify/swagger` e `@fastify/swagger-ui`, acessível em `/docs`.
- **Por que Bun/Fastify?**  
  - **Bun** oferece startup extremamente rápido e baixo consumo de memória, ideal para um servidor de API com alta concorrência.  
  - **Fastify** é um dos frameworks Node.js mais performáticos, com schema-based validation (usando TypeBox) e suporte nativo a plugins.  
  - A combinação permite máxima eficiência no processamento de requisições e manutenção de uma base de código tipada.

### 2.2 Fluxo de Upload

O processo de envio de áudio é executado diretamente pela API principal:

1. O frontend envia o arquivo de áudio via `multipart/form-data` para o endpoint `POST /api/upload`.
2. A API valida o tamanho do arquivo (máximo 40MB) e o tipo MIME (MP3, WAV, OGG, FLAC, AAC, M4A).
3. O binário é transmitido via streaming para o Supabase Storage no bucket `audios-projetos`.
4. A URL pública do arquivo é retornada ao frontend.
5. O frontend utiliza essa URL para criar ou atualizar uma layer via `POST /api/projeto/:projetoId`.

---

## 3. Modelo de Dados

O banco de dados PostgreSQL contém 14 modelos, gerenciados pelo Prisma com 15 migrations versionadas.

### 3.1 Modelos Principais

| Modelo | Descrição |
|--------|-----------|
| **User** | Usuário da plataforma (nome, email, CPF, bio, instrumentos, avatar) |
| **Projeto** | Projeto musical (título, gênero, BPM, escala, descrição, áudio guia, metadata) |
| **Camada** | Layer de áudio enviada por um colaborador (nome, URL, instrumento, delay, volume, status de aprovação) |
| **LayerVersion** | Versão de uma camada (snapshots de áudio/metadata com numeração sequencial) |
| **Colaborador** | Relação usuário-projeto com cargo (membro, etc.) |
| **Convite** | Convite pendente para colaboração (token, expiração, mensagem) |
| **Follows** | Relação de seguidores entre usuários |
| **Like** | Curtida de um usuário em um projeto |
| **Favorite** | Projeto favoritado por um usuário |
| **Notification** | Notificações do sistema (convite, nova layer, aprovação, follow, like) |
| **MuralPost** | Post no mural interno de um projeto |
| **Sugestao** | Sugestão criada por um colaborador sobre um projeto |
| **RefreshToken** | Tokens de refresh para renovação de sessão (rotação, expiração 7 dias) |

### 3.2 Enums

- **MusicGenre**: 18 gêneros — ROCK, POP, JAZZ, BLUES, FORRO, METAL, HIP_HOP, ELECTRONIC, CLASSICAL, LO_FI, INDIE, SERTANEJO, SAMBA, MPB, COUNTRY, FUNK, SOUNDTRACK, REGGAE
- **NotificationType**: INVITE_RECEIVED, INVITE_ACCEPTED, NEW_LAYER, LAYER_APPROVED, PROJECT_REJECT, NEW_FOLLOWER, PROJECT_RELEASED, NEW_LIKE
- **SugestaoStatus**: ABERTA, EM_ANDAMENTO, RESOLVIDA

### 3.3 Índices

O schema utiliza índices compostos para otimizar consultas frequentes:
- `Projeto`: `[userId, createdAt(desc)]`, `[createdAt, genero]`, `[genero]`, `[userId, deletedAt]`
- `Camada`: `[projetoId, instrumento_tag, esta_aprovada]`, `[projetoId, esta_aprovada]`, `[userId]`, `[createdAt]`
- `LayerVersion`: `[camadaId, versionNumber]`, `[camadaId, createdAt]`, `[autorId]`
- `Notification`: `[userId, createdAt(desc)]`, `[userId, lida]`, `[tipo]`, `[actorId]`
- `Follows`, `Like`, `Favorite`: índices em ambas as direções de userId

---

## 4. Fluxo de Dados de Colaboração

O processo completo de envio e aprovação de uma layer é:

1. **Criação do Projeto**  
   - O *Dono* define metadados: título, gênero, BPM, escala, descrição, áudio guia.  
   - A API valida e persiste o projeto no PostgreSQL (via Prisma).

2. **Envio de Layer por Colaborador**  
   - O músico acessa o projeto e envia um arquivo de áudio.  
   - O frontend envia o arquivo para o endpoint `POST /api/upload`, que transmite via streaming para o Supabase e retorna a URL pública.  
   - Em seguida, o frontend chama a API `POST /api/projeto/:projetoId` com os metadados da layer: URL, instrumento, BPM (opcional, pode herdar do projeto), tonalidade e **offset** (delay em milissegundos para sincronia).  
   - A API cria um registro de layer com status `PENDING` e gera automaticamente a **versão inicial** (v1) via `createInitialVersion`.

3. **Versionamento de Layers**  
   - Toda vez que uma layer é atualizada (`PUT /api/layer/:id`), uma nova versão é criada automaticamente se os dados de áudio ou metadata mudarem.  
   - Cada versão é um snapshot completo (áudio URL, nome, instrumento, delay, volume) com numeração sequencial.  
   - O campo `currentVersionId` na `Camada` aponta para a versão ativa.  
   - É possível fazer **rollback** para qualquer versão anterior (`POST /api/layer/:id/rollback/:versionId`), que cria uma nova versão com os dados da versão-alvo.

4. **Aprovação**  
   - O Dono do Projeto visualiza as layers pendentes e pode aprová‑las (`PATCH /api/layer/:id/authorize`).  
   - Uma vez aprovada, a layer se torna oficial, aparecendo na lista final do projeto.  
   - Se rejeitada, o status muda para `REJECTED` e a layer não é exibida publicamente.

5. **Notificações**  
   - A cada evento (envio, aprovação, convite, follow, like), o sistema cria uma notificação no banco.  
   - Cada notificação pode ter um **ator** (usuário que originou a ação) para enriquecer a experiência do destinatário.  
   - O frontend consome notificações via polling (`pull_notifications.tsx`).

---

## 5. Detalhamento das Pastas (Backend)

A estrutura do backend segue princípios de **modularidade** e **separação de responsabilidades**.

### 5.1 Hooks (`src/hooks`)
Os hooks são middlewares Fastify que garantem a segurança em diferentes níveis:

- **`JWT_verific.ts`** – Valida o token JWT e anexa o usuário autenticado à requisição. Usado como `onRequest` hook na maioria das rotas autenticadas.
- **`verificar_dono_projeto.ts`** – Verifica se o usuário autenticado é o dono do projeto referenciado na rota.
- **`verificar_dono_layer.ts`** – Checa se o usuário é o autor da layer (usado para edição/exclusão).
- **`verificar_colaborador.ts`** – Verifica se o usuário é um colaborador ativo do projeto (necessário para operações de versão e rollback).
- **`verificar_permissao.ts`** – Função genérica para verificar permissões de acesso a dados de outro usuário.

Esses hooks são aplicados nas rotas correspondentes via `preHandler`, garantindo que nenhuma operação sensível seja executada sem autorização explícita.

### 5.2 Routers e Schemas (`src/routers` e `src/schemas`)

13 domínios de rotas, cada um com seu diretório espelhado em schemas:

| Domínio | Arquivos | Descrição |
|---------|----------|-----------|
| **user/** | 10 | Cadastro, login, logout, delete, get, bio, instrumentos, forgot_password, refresh, get_user_with_counts |
| **projetos/** | 11 | CRUD de projetos, feed, mural (criar/listar/deletar posts), favorites (toggle/list) |
| **layers/** | 4 | create, delete, update, authorize |
| **colaboration/** | 7 | invite, accept, reject, list, delete, list_user_invites, colaboretors |
| **follows/** | 3 | follow, unfollow, list_followers |
| **likes/** | 1 | like_create |
| **notification/** | 3 | get, read, read_all |
| **search/** | 2 | search_project, search_by_instrument |
| **versions/** | 2 | get_versions (com paginação cursor-based), manage_branches (rollback) |
| **sugestoes/** | 4 | CRUD de sugestões sobre projetos |
| **upload/** | 1 | upload_point (endpoint de upload de áudio) |
| **health/** | 2 | health check, validation |

- **Routers**: Cada domínio registra um plugin Fastify com seus endpoints.
- **Schemas**: Definições **TypeBox** que descrevem a estrutura esperada de requisições (body, params, query).  
  - São usados para validação automática pelo Fastify, eliminando código boilerplate e garantindo **type-safety** entre o backend e o frontend.  
  - A separação em pastas idênticas aos routers facilita a manutenção e a clara relação entre contrato e implementação.

### 5.3 Services (`src/services`)

Contém lógica de negócio extraída quando compartilhada entre múltiplas rotas:

- **`versionService.ts`** – Gerencia o ciclo de vida das versões de layers:
  - `createInitialVersion` – Cria a versão v1 ao criar uma layer.
  - `createNewVersion` – Cria uma nova versão ao atualizar uma layer (comparando dados antes).
  - `rollbackToVersion` – Restaura uma versão anterior criando uma nova versão com os dados da versão-alvo.
  - `getNextVersionNumber` – Calcula o próximo número de versão sequencial.

### 5.4 Lib (`src/lib`)

Utilitários compartilhados registrados como plugins Fastify:

- **`prisma.ts`** – Plugin que decora a instância Fastify com `prisma` para acesso direto nas rotas.
- **`upload.ts`** – Plugin que decora `Fastify.storage` com métodos `uploadAudio` e `deleteAudio` para Supabase Storage. Valida tipos MIME, tamanho, e usa streaming.
- **`global_Error.ts`** – Handler de erros centralizado com mapeamento de códigos Prisma (P2000-P2034), erros JWT, erros de validação e erros de conexão com o banco.
- **`refreshToken.ts`** – Lógica de refresh tokens: geração, validação, rotação e exclusão. Tokens expiram em 7 dias e são invalidados após uso.
- **`cpf.ts`** – Validação de CPF.

### 5.5 Prisma (`prisma/`)
- **`schema.prisma`**: Define os 14 modelos de dados, incluindo relacionamentos complexos, 3 enums e índices compostos otimizados.
- **Migrations**: 15 migrations versionadas, documentando a evolução do esquema desde o schema inicial até as features mais recentes (favoritos, metadata de áudio, versionamento de layers, refresh tokens).

### 5.6 Plugins Fastify Registrados

O servidor (`server.ts`) registra os seguintes plugins na ordem:

1. `@fastify/cors` — CORS para localhost:5173 e amotif-music.onrender.com
2. `@fastify/swagger` + `@fastify/swagger-ui` — Documentação OpenAPI em `/docs`
3. `@fastify/multipart` — Upload de arquivos (limite 40MB)
4. `health_route` — Endpoint de health check
5. `prisma_plugin` — Decoração da instância Prisma
6. `globalErrorHandler` — Handler de erros centralizado
7. `Upload_Service` — Serviço de upload Supabase
8. `@fastify/cookie` — Cookies HttpOnly (SameSite=None, Secure)
9. `@fastify/jwt` — Autenticação JWT (expiração 4h, issuer/amortiguiação)
10. `Plugin_Routes` — Todas as rotas da API com prefixo `/api`

---

## 6. Desafios Técnicos Resolvidos

### 6.1 Sincronia Rítmica (BPM e Offset)
Um dos maiores desafios é garantir que múltiplas camadas de áudio, enviadas por músicos diferentes, possam ser tocadas em perfeita sincronia.

- **BPM (Beats Per Minute)** é armazenado no projeto e pode ser sobrescrito por uma layer (caso o colaborador queira tocar em um andamento diferente, mas o projeto define o padrão).  
- **Offset** (campo `delay_offset` na tabela `Camada`) armazena um valor em milissegundos que representa o atraso necessário para alinhar a camada com o projeto base.  
- O frontend (ou um futuro player colaborativo) utiliza esses dois valores para calcular o posicionamento temporal exato de cada layer.

Essa abordagem permite flexibilidade (cada músico pode gravar com seu próprio timing) sem comprometer o alinhamento final.

### 6.2 Validação de Permissões em Nível de Rota
O uso intensivo de hooks no Fastify garante que as verificações de propriedade (dono do projeto, autor da layer, colaborador ativo) sejam centralizadas e reutilizáveis, reduzindo drasticamente a duplicação de código e possíveis falhas de segurança.

### 6.3 Versionamento de Layers
O sistema de versionamento implementa um modelo similar ao Git para layers de áudio:

- Cada atualização cria uma nova versão com snapshot completo dos dados.
- O rollback não deleta versões — cria uma nova versão com dados de uma versão anterior, preservando o histórico completo.
- A paginação cursor-based nas listagens de versões garante performance mesmo com muitas versões.

### 6.4 Tratamento Centralizado de Erros
O `globalErrorHandler` mapeia automaticamente códigos de erro do Prisma para respostas HTTP apropriadas, tratando erros de validação, duplicatas, foreign keys, timeouts e conexão com o banco. Erros JWT e de validação do Fastify também são tratados centralmente.

---

## 7. Stack de Infraestrutura

| Componente       | Tecnologia                          | Justificativa                                                                                     |
|------------------|-------------------------------------|---------------------------------------------------------------------------------------------------|
| **Runtime**      | Bun                                 | Performance, baixo consumo de memória e startup rápido.                                          |
| **API Server**   | Fastify v5                          | Alto desempenho, schema validation nativa e suporte a plugins.                                   |
| **ORM**          | Prisma v7                           | Type-safe, migrations robustas, excelente para relações complexas.                               |
| **Validação**    | TypeBox + AJV                        | TypeBox define schemas em TypeScript, AJV valida JSON Schema com performance JIT.               |
| **Frontend**     | React 19 + Vite 7                   | Vite para dev experience rápida, React para construção da UI com code-splitting via lazy().      |
| **Estilização**  | CSS Modular                         | Arquivos CSS por página/feature, sem dependência de frameworks CSS.                              |
| **Validação (FE)**| Zod                                 | Schemas de validação no frontend, espelhando os TypeBox do backend.                              |
| **Banco de Dados** | PostgreSQL (Neon)                  | Neon oferece banco serverless, com branching automático e baixa latência.                       |
| **Storage**      | Supabase Storage                    | Streaming de upload, buckets organizados por userId, URLs públicas.                              |
| **Deploy**       | Render                              | Plataforma PaaS com deploys automáticos via Git (backend + frontend).                           |
| **Desktop**      | WebView2 + Inno Setup               | App desktop Windows com instalador nativo (ainda em andamento).                                                       
| **Documentação** | Swagger/OpenAPI                     | Gerada automaticamente via @fastify/swagger, acessível em `/docs`.                               |

---

## 8. Considerações Finais

A arquitetura do AMOTIF foi projetada para ser **escalável**, **segura** e **de fácil manutenção**.  
O uso de plugins e schemas do Fastify garante consistência e segurança na camada de negócios, enquanto a arquitetura flat (Rota → Prisma) reduz complexidade e overhead de indireção.

O modelo de dados, com campos como BPM e offset, resolve os desafios de sincronia inerentes à colaboração musical assíncrona, posicionando a plataforma como uma ferramenta inovadora para músicos.

O sistema de versionamento de layers, inspirado no Git, traz um nível de controle de versão raramente encontrado em plataformas de colaboração musical, permitindo rollback seguro e histórico completo de cada camada de áudio.

--- 

**Documento mantido por:** Braian de Liz  
**Última revisão:** 20 de agosto de 2026
