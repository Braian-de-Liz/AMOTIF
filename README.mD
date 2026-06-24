# AMOTIF

Plataforma de desenvolvimento musical colaborativo e assincrono. Inspirada em conceitos de versionamento distribuido, funciona como um "Git para musicos".

---

## Visao Geral

O AMOTIF nasce da lacuna existente entre ferramentas de DAW locais e plataformas genericas de compartilhamento de arquivos. A plataforma oferece um ambiente nativo para o fluxo de trabalho colaborativo da musica moderna, permitindo que musicos, produtores e compositores criem projetos, registrem versoes de faixas e stems, colaborem de forma assincrona e sincronizem camadas de audio com controle preciso de offset temporal.

O funcionamento baseia-se na ideia de projetos musicais compartilhados. Cada projeto representa uma composicao em desenvolvimento e contem informacoes tecnicas fundamentais como andamento (BPM), tonalidade, descricao artistica e uma faixa guia inicial. A partir desse ponto, outros musicos podem adicionar novas camadas instrumentais -- vocais, guitarra, bateria, sintetizadores.

Cada contribuicao e registrada como uma camada independente (layer), mantendo rastreabilidade completa de autoria, tempo de entrada na musica e alinhamento com a faixa original. O modelo garante que a obra evolua sem sobrescrever contribuicoes anteriores, preservando o historico criativo.

O sistema adota um mecanismo de aprovacao controlado pelo criador do projeto, que decide quais contribuicoes passam a integrar oficialmente a composicao. Equilibra-se colaboracao aberta com direcao artistica centralizada.

O objetivo principal e remover barreiras geograficas e logisticas da producao musical colaborativa, permitindo que artistas de diferentes locais contribuam para uma mesma obra de forma organizada, tecnica e segura.

---

## Funcionalidades

### Gestao de Projetos Musicais
- Criacao de projetos com parametros tecnicos: BPM (20-300), tonalidade, genero musical, audio guia
- Edicao de metadados e exclusao pelo autor
- Feed de projetos publicos com filtros por genero e faixa de BPM
- Sistema de favoritos

### Camadas de Audio (Layers)
- Envio de camadas instrumentais com URL do arquivo no cloud storage
- Offset de sincronizacao em milissegundos para alinhamento temporal entre camadas
- Override opcional de BPM por layer
- Fluxo de aprovacao: pending, approved, rejected
- Controle total do autor sobre quais contribuicoes se tornam oficiais

### Colaboracao
- Sistema de convites por email para projetos especificos
- Accept/reject de convites com notificacao automatica
- Gestao de colaboradores ativos por projeto
- Remocao de colaboradores pelo autor

### Interacao Social
- Perfil de usuario com biografia, instrumentos e estatisticas
- Sistema de seguidores (follow/unfollow)
- Notificacoes em tempo real para eventos relevantes
- Mural de comunicacao por projeto

### Busca e Exploracao
- Busca por usuarios filtrando por instrumento
- Busca por projetos com filtros combinaveis (query, genero, BPM min/max)

### Estudio Virtual
- Mixer com controles de volume, pan e mute por camada
- Visualizacao de formas de onda
- Controles de play/pause globais e individuais

---

## Fluxo de Colaboracao (Exemplo Pratico)

1. **Joao** cria o projeto "Samba de Verao", define BPM 110 e sobe um audio de violao.
2. **Maria** ve o projeto, baixa o audio do violao, grava uma flauta em sua casa e faz o upload da Camada.
3. **Joao** recebe uma notificacao, da o "play" e ouve o violao dele + a flauta da Maria sincronizados.
4. **Joao** clica em "Aprovar" e agora o projeto "Samba de Verao" tem dois instrumentos oficiais.

---

## Arquitetura

A aplicacao adota uma arquitetura de microsservicos hibridos com separacao clara de responsabilidades.

### API Principal (Fastify + Bun)

Backend responsavel por toda a logica de negocio: autenticacao JWT, autorizacao via hooks, gestao de entidades (projetos, layers, colaboradores, follows, notificacoes), buscas e integracao com o banco de dados.

A arquitetura interna segue o modelo de plugins do Fastify, onde cada dominio e encapsulado como um plugin autonomo com suas rotas e schemas associados. A validacao de requisicoes e feita via schemas TypeBox com compilacao JIT, garantindo type-safety em runtime e eliminando codigo boilerplate.

### Servico de Upload (Go)

Microsservico dedicado ao trafego de arquivos de audio. Utiliza goroutines para processamento paralelo e streaming direto ao Supabase Storage, evitando o carregamento completo do binario em memoria (zero-RAM loading). O servico valida a assinatura JWT gerada pela API principal antes de processar qualquer upload.

Essa separacao garante que operacoes I/O-intensivas de upload nao impactem a performance da API principal, mantendo o event loop do Bun responsivo para requisicoes de logica de negocio.

### Fluxo de Arquivos

O trafego de audio segue um caminho otimizado para evitar gargalos:

1. **Validacao de Negocio (API):** Verificacao de permissoes, autenticacao (JWT) e existencia do projeto.
2. **Handover de Dados (Go):** O frontend envia o binario diretamente ao servico de upload (porta 4444).
3. **Processamento e Pipe:** O Go valida schema do arquivo (tamanho maximo e extensao) e inicia um pipe HTTP para o Supabase Storage.
4. **Persistencia:** Apos o sucesso, a URL final e vinculada a Layer no banco de dados via Prisma.

Detalhes: [documents/Architecture.md](./documents/Architecture.md)

---

## Stack Tecnologica

| Componente         | Tecnologia                       | Funcao                                                           |
|--------------------|----------------------------------|------------------------------------------------------------------|
| Backend API        | Fastify v5 + Bun                 | API REST com validacao JIT e plugins encapsulados                |
| Upload Service     | Go (Fiber)                       | Streaming e upload de audio com concorrencia nativa              |
| Banco de Dados     | PostgreSQL (Neon)                | Persistencia relacional com branching serverless                 |
| ORM                | Prisma v7                        | Type-safe access layer com migrations versionadas                |
| Validacao          | TypeBox                          | Schemas executaveis com geracao automatica de tipos              |
| Frontend           | React 19 + Vite + TypeScript     | Interface com React Compiler e CSS modular                       |
| Armazenamento      | Supabase Storage                 | Entrega global de arquivos binarios                              |
| Deploy             | Render                           | PaaS com deploys automaticos via Git                             |

### Por que cada tecnologia?

- **Fastify:** Framework mais rapido do ecossistema Node.js (~45k req/s vs ~15k do Express). Validacao nativa de schemas com performance minima.
- **Bun:** Startup em ~50ms (vs ~200ms do Node.js), throughput HTTP de ~50k req/s, consumo base de ~30MB de memoria. Compativel com todo o ecossistema Node.js.
- **Prisma:** Type-safe database access em TypeScript. Se amanha mudar do Neon para outro provider, o codigo e quase o mesmo.
- **TypeBox:** Garante que o usuario nao envie um "texto" onde deveria ser um "CPF". Type-safety em runtime com schemas reutilizaveis.
- **Go (Fiber):** Goroutines permitem processar multiplos uploads simultaneos com uso insignificante de CPU e RAM. Binario nativo leve, sem overhead de maquinas virtuais.
- **Supabase Storage:** O banco de dados (Neon) guarda o link, o Supabase guarda o arquivo fisico. Melhor forma de manter custo zero.

---

## Modelo de Dados

### Usuario (A Identidade)
Identidade do musico com validacao de CPF. Cada campo tem funcao tecnica ou social:
- **Nome Completo:** Para creditos autorais (essencial em musica).
- **Email:** Login e notificacoes.
- **Senha:** Protecao da conta (armazenada via Hash/Argon2id).
- **CPF:** Seguranca e validacao de usuario real. Util para futura implementacao de protecao de direitos autorais.
- **Bio/Instrumentos:** Permite que outros musicos encontrem e convidem o usuario para projetos.

### Projeto (A Musica)
Composicao em desenvolvimento com parametros tecnicos:
- **Titulo:** Nome da obra.
- **BPM (Batidas por Minuto):** O "relogio" da musica. Sem isso, o colaborador nao sabe em que velocidade gravar.
- **Escala/Tom:** Diz ao musico quais notas ele pode tocar.
- **Audio Guia:** A primeira track que serve de base para todos os outros.
- **Genero:** Enum (ROCK, POP, JAZZ, CLASSICAL, ELECTRONIC, MPB, OTHER).

### Layer (A Contribuicao)
Camada independente de audio:
- **Arquivo de Audio (URL):** Link para o arquivo .mp3 ou .wav no Supabase Storage.
- **Tipo de Instrumento:** Tag para filtrar (ex: "Percussao", "Sintetizador").
- **Delay/Offset (Tecnico):** Ajuste em milissegundos para garantir alinhamento perfeito com a base.
- **Status:** pending, approved, rejected.

### Entidades Auxiliares
- **Convite:** Token unico para convite de colaboracao, com expiracao de 7 dias.
- **Colaboracao:** Relacionamento many-to-many entre usuarios e projetos.
- **Follow:** Relacionamento de seguidor/seguido.
- **Notificacao:** Registro de eventos: convite recebido, layer aprovada, novo seguidor, like, etc.
- **Favorito:** Projetos salvos pelo usuario.

---

## Decisoes Tecnicas

### Fastify-native vs MVC Tradicional

A aplicacao nao utiliza o padrao MVC com camadas de Controllers, Services e Repositories. A estrutura e flat: cada rota e um plugin Fastify que acessa o Prisma diretamente. Hooks reutilizaveis cuidam de autenticacao e autorizacao.

Em uma estrutura MVC tradicional, a requisicao percorre Controller -> Service -> Repository -> Prisma. No AMOTIF: Rota -> Prisma.

Detalhes: [documents/organization.md](./documents/organization.md)

### Type-Safety End-to-End

A combinacao Bun + Fastify + TypeBox proporciona type-safety em todas as camadas:
- Types compartilhados entre backend e frontend
- Validacao em boundaries: cada requisicao e validada antes de tocar logica de negocio
- Consistencia de dados: o mesmo schema usado para validacao e usado para serializacao de resposta

| Abordagem                  | Linhas de codigo (validar 5 campos) |
|----------------------------|--------------------------------------|
| Manual (if/else)           | ~30 linhas                           |
| Yup/Joi                    | ~15 linhas                           |
| TypeBox + Fastify          | ~5 linhas                            |

Detalhes: [documents/typebox-fastify-bun.md](./documents/typebox-fastify-bun.md)

---

## Estrutura do Projeto

```
AMOTIF/
├── back_end/
│   ├── src/
│   │   ├── server.ts              # Entrypoint do servidor
│   │   ├── hooks/                 # Middlewares (JWT, verificacao de dono)
│   │   ├── lib/                   # Prisma client, error handler global
│   │   ├── routers/               # Rotas por dominio
│   │   │   ├── user/              # Cadastro, login, perfil, instrumentos
│   │   │   ├── projetos/          # CRUD, feed, mural, favoritos
│   │   │   ├── layers/            # Criar, editar, autorizar, deletar
│   │   │   ├── colaboration/      # Convites, accept/reject, gestao
│   │   │   ├── follows/           # Follow/unfollow, listagem
│   │   │   ├── likes/             # Curtir projetos
│   │   │   ├── notification/      # Listagem e mark-all-read
│   │   │   ├── search/            # Busca por usuarios e projetos
│   │   │   └── health/            # Health check e benchmark
│   │   └── schemas/               # Definicoes TypeBox por dominio
│   ├── prisma/
│   │   ├── schema.prisma          # Modelo de dados
│   │   └── migrations/            # Migrations versionadas
│   └── tests/                     # Testes de integracao (Bun test)
├── front_end/
│   ├── src/
│   │   ├── pages/                 # Paginas da aplicacao
│   │   ├── components/            # Componentes React
│   │   ├── styles/                # CSS modular por pagina
│   │   ├── schemas/               # Validacao Zod no frontend
│   │   └── utility/               # Helpers e utilitarios
│   └── public/                    # Assets estaticos
├── upload_service/
│   ├── main.go                    # Entrypoint do servico Go
│   ├── config/                    # Configuracao
│   ├── handlers/                  # Handlers HTTP
│   ├── middleware/                 # Auth middleware
│   └── service/                   # Logica de upload ao Supabase
└── documents/                     # Documentacao tecnica
```

---

## Documentacao da API

A documentacao interativa das rotas esta disponivel via Swagger UI:

```
https://amotif.onrender.com/docs
```

---

## Testes

A suite de testes utiliza o runner nativo do Bun e cobre integracao das principais rotas com Fastify inject (sem servidor HTTP real), mockando o Prisma e aplicando schemas de validacao.

```bash
bun test                        # Executa todos os testes
bun test tests/user.test.ts     # Executa testes de usuario especificamente
```

---

## Autor

**Braian de Liz da Silva**
