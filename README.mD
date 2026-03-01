# 🎸 AMOTIF - Colaboração Musical Assíncrona

O **AMOTIF** é uma plataforma digital de colaboração musical projetada para transformar o processo criativo. Diferente de plataformas voltadas para conteúdo finalizado, o AMOTIF foca na **construção coletiva**, permitindo que músicos adicionem camadas (layers) a projetos em desenvolvimento de forma estruturada e sincronizada.



## 🚀 O Conceito
O sistema funciona como um "versionamento criativo" para música:
- **Projetos:** Centralizam as diretrizes técnicas (BPM, Tom, Faixa Guia).
- **Camadas (Layers):** Contribuições independentes que não sobrescrevem o original.
- **Aprovação:** O criador do projeto mantém a curadoria artística, validando quais contribuições entram na mixagem oficial.

## 🏗️ Arquitetura e Stack Técnica
Utilizamos uma abordagem de **microsserviços híbridos** para separar a lógica de negócio do processamento intensivo de dados.

| Tecnologia | Função | Motivação |
| :--- | :--- | :--- |
| **React + Vite** | Frontend | Interface reativa de baixa latência para o utilizador. |
| **Fastify (Node.js)** | Backend Principal | Gestão ágil de rotas, permissões e validação de esquemas (Zod). |
| **Go (Fiber)** | Upload Service | Microsserviço de alta performance para streaming de binários de áudio. |
| **Prisma ORM** | Persistência | Abstração robusta para o banco de dados PostgreSQL (Neon). |
| **Supabase Storage** | Cloud Storage | Armazenamento otimizado para arquivos de áudio pesados (.wav/.mp3). |

### ⚡ Engenharia de Performance: Go vs. Node.js
Para otimizar o processamento de áudio, isolamos o tráfego de ficheiros num serviço em **Go**. Em testes de carga (Autocannon), a diferença de eficiência foi nítida:

* **Go (Fiber):** ~6.500 req/sec | Latência estável em 15ms.
* **Node (Fastify):** ~2.000 req/sec | Latência média de 50ms.
* **Vantagem:** O serviço em Go consome significativamente menos memória e CPU, permitindo uma escalabilidade horizontal muito mais barata e eficiente.



## 📂 Estrutura do Repositório

```text
braian-de-liz-amotif/
├── back_end/          # API Fastify (Auth, Projetos, Prisma)
├── front_end/         # Aplicação React (UI/UX)
└── upload_service/    # Microsserviço em Go (Streaming de Áudio)
🛠️ Como Rodar o Projeto
Clonar e Instalar:

Bash
git clone [https://github.com/seu-usuario/amotif.git](https://github.com/seu-usuario/amotif.git)
Serviço de Upload (Go):

Bash
cd upload_service
go run main.go
Backend Principal (Node):

Bash
cd back_end
pnpm install
pnpm dev
🛡️ Segurança e Fluxo
O sistema adota uma política de Zero Trust no upload:

O utilizador autentica-se no Backend principal.

O upload_service em Go valida o JWT partilhado.

O ficheiro é enviado via Stream Pipe diretamente para o Supabase, garantindo que o servidor nunca fique com a memória cheia, independentemente do tamanho do ficheiro.

Desenvolvido por Braian de Liz - Engenharia de Software focada em Performance Musical.