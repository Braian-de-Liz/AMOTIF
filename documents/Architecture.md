# Architecture Document – AMOTIF

## 1. Visão Geral

AMOTIF é uma plataforma de colaboração musical assíncrona, projetada para funcionar como um **"Git para músicos"**.  
O sistema permite que um **Dono do Projeto** crie uma *track* base (ex.: Violão, BPM 120, Tom Sol Maior). Outros músicos podem enviar **Layers** (camadas de áudio) que, após aprovação do proprietário, tornam-se parte oficial do projeto.  
Metadados críticos como **BPM**, **Tonalidade** e **Offset (delay)** são armazenados para garantir a sincronia perfeita entre todas as camadas.

---

## 2. Arquitetura

A arquitetura adota uma abordagem flat e baseada em plugins do Fastify, com separação clara de responsabilidades entre rotas, hooks e schemas.

### 2.1 API Principal (Backend – Bun + Fastify)
- **Tecnologias**: Bun (runtime), Fastify v5, Prisma v7, TypeBox, TypeScript.
- **Função**: Gerencia toda a lógica de negócio, autenticação, autorização, relacionamentos (projetos, layers, colaboradores, seguidores), buscas, notificações e upload de áudio.
- **Upload de Áudio**: Utiliza `@fastify/multipart` para receber arquivos diretamente no servidor, com validação de tamanho (40MB) e tipo. O binário é transmitido via streaming para o **Supabase Storage**, sem carregar o arquivo completo em memória.
- **Por que Bun/Fastify?**  
  - **Bun** oferece startup extremamente rápido e baixo consumo de memória, ideal para um servidor de API com alta concorrência.  
  - **Fastify** é um dos frameworks Node.js mais performáticos, com schema-based validation (usando TypeBox) e suporte nativo a plugins.  
  - A combinação permite máxima eficiência no processamento de requisições e manutenção de uma base de código tipada.

### 2.2 Fluxo de Upload

O processo de envio de áudio é executado diretamente pela API principal:

1. O frontend envia o arquivo de áudio via `multipart/form-data` para o endpoint `POST /upload`.
2. A API valida o tamanho do arquivo (máximo 40MB) e o tipo MIME.
3. O binário é transmitido via streaming para o Supabase Storage.
4. A URL pública do arquivo é retornada ao frontend.
5. O frontend utiliza essa URL para criar ou atualizar uma layer via `POST /layers`.

---

## 3. Fluxo de Dados de Colaboração

O processo completo de envio e aprovação de uma layer é:

1. **Criação do Projeto**  
   - O *Dono* define metadados: título, BPM, tonalidade, instrumento base, etc.  
   - A API valida e persiste o projeto no PostgreSQL (via Prisma).

2. **Envio de Layer por Colaborador**  
   - O músico acessa o projeto e envia um arquivo de áudio.  
   - O frontend envia o arquivo para o endpoint `POST /upload`, que transmite via streaming para o Supabase e retorna a URL pública.  
   - Em seguida, o frontend chama a API `POST /layers` com os metadados da layer: URL, instrumento, BPM (opcional, pode herdar do projeto), tonalidade e **offset** (delay em milissegundos para sincronia).  
   - A API cria um registro de layer com status `PENDING`.

3. **Aprovação**  
   - O Dono do Projeto visualiza as layers pendentes e pode aprová‑las (`POST /layers/:id/authorize`).  
   - Uma vez aprovada, a layer se torna oficial, aparecendo na lista final do projeto.  
   - Se rejeitada, o status muda para `REJECTED` e a layer não é exibida publicamente.

4. **Notificações**  
   - A cada evento (envio, aprovação, convite, etc.), o sistema cria uma notificação no banco (migration `20260325172302_add_notifications`).  
   - O frontend pode consumir essas notificações para informar os usuários em tempo real.

---

## 4. Detalhamento das Pastas (Backend)

A estrutura do backend segue princípios de **modularidade** e **separação de responsabilidades**.

### 4.1 Hooks (`/hooks`)
Os hooks são middlewares Fastify que garantem a segurança em diferentes níveis:

- **`JWT_verific.ts`** – Valida o token JWT e anexa o usuário autenticado à requisição.
- **`verificar_dono_projeto.ts`** – Verifica se o usuário autenticado é o dono do projeto referenciado na rota.
- **`verificar_dono_layer.ts`** – Checa se o usuário é o autor da layer (usado para edição/exclusão).
- **`verificar_permicao.ts`** – Função genérica para verificar permissões customizadas (ex.: se o usuário pode acessar um projeto como colaborador).

Esses hooks são aplicados nas rotas correspondentes, garantindo que nenhuma operação sensível seja executada sem autorização explícita.

### 4.2 Routers e Schemas (`/routers` e `/schemas`)
- **Routers**: Cada domínio da aplicação (projetos, layers, colaboração, follows, user, search) possui seu próprio arquivo de rotas, mantendo a organização por contexto.
- **Schemas**: Definições **TypeBox** que descrevem a estrutura esperada de requisições (body, params, query).  
  - São usados para validação automática pelo Fastify, eliminando código boilerplate e garantindo **type-safety** entre o backend e o frontend (através de tipos exportados).  
  - A separação em pastas idênticas aos routers (`/schemas/projetos`, `/schemas/layers`, etc.) facilita a manutenção e a clara relação entre contrato e implementação.

Exemplo:  
- `routers/layers/create_layer.ts` utiliza o schema `create_schema_lyr.ts` para validar o corpo da requisição antes de persistir.

### 4.3 Prisma (`/prisma`)
- **`schema.prisma`**: Define os modelos de dados, incluindo relacionamentos entre `User`, `Project`, `Layer`, `Collaborator`, `Invite`, `Follow`, `Notification`.  
- As **migrations** são versionadas, garantindo evolução controlada do esquema. As pastas com timestamps representam alterações incrementais (ex.: colaboradores, follows, notificações).

---

## 5. Desafios Técnicos Resolvidos

### 5.1 Sincronia Rítmica (BPM e Offset)
Um dos maiores desafios é garantir que múltiplas camadas de áudio, enviadas por músicos diferentes, possam ser tocadas em perfeita sincronia.

- **BPM (Beats Per Minute)** é armazenado no projeto e pode ser sobrescrito por uma layer (caso o colaborador queira tocar em um andamento diferente, mas o projeto define o padrão).  
- **Offset** (campo `delayMs` na tabela `Layer`) armazena um valor em milissegundos que representa o atraso necessário para alinhar a camada com o projeto base.  
- O frontend (ou um futuro player colaborativo) utiliza esses dois valores para calcular o posicionamento temporal exato de cada layer.

Essa abordagem permite flexibilidade (cada músico pode gravar com seu próprio timing) sem comprometer o alinhamento final.

### 5.2 Validação de Permissões em Nível de Rota
O uso intensivo de hooks no Fastify garante que as verificações de propriedade (dono do projeto, autor da layer) sejam centralizadas e reutilizáveis, reduzindo drasticamente a duplicação de código e possíveis falhas de segurança.

---

## 6. Stack de Infraestrutura

| Componente       | Tecnologia                          | Justificativa                                                                                     |
|------------------|-------------------------------------|---------------------------------------------------------------------------------------------------|
| **Runtime**      | Bun                                 | Performance, baixo consumo de memória e startup rápido.                                          |
| **API Server**   | Fastify (Node.js)                   | Alto desempenho, schema validation nativa e suporte a plugins.                                   |
| **ORM**          | Prisma                              | Type-safe, migrations robustas, excelente para relações complexas.                               |
| **Validação**    | TypeBox                              | Integração perfeita com Fastify e TypeScript, garantindo tipos inferidos automaticamente.       |
| **Frontend**     | React + Vite                        | Vite para dev experience rápida, React para construção da UI.                                    |
| **Banco de Dados** | PostgreSQL (Neon)                  | Neon oferece banco serverless, com branching automático e baixa latência.                       |
| **Storage**      | Supabase Storage                    | API simples, integração com buckets e URLs públicas.                                             |
| **Deploy**       | Render                              | Plataforma PaaS com deploys automáticos via Git.                                                 |

---

## 7. Considerações Finais

A arquitetura do AMOTIF foi projetada para ser **escalável**, **segura** e **de fácil manutenção**.  
O uso de plugins e schemas do Fastify garante consistência e segurança na camada de negócios, enquanto a arquitetura flat (Rota → Prisma) reduz complexidade e overhead de indireção.

O modelo de dados, com campos como BPM e offset, resolve os desafios de sincronia inerentes à colaboração musical assíncrona, posicionando a plataforma como uma ferramenta inovadora para músicos.

--- 

**Documento mantido por:** Braian de Liz  
**Última revisão:** 27 de março de 2026