# 🎸 AMOTIF - Colaboração Musical Assíncrona

O **AMOTIF** é uma plataforma digital de colaboração musical que viabiliza a criação coletiva de obras através da contribuição estruturada de camadas instrumentais independentes.

## 🎯 Conceito e Objetivos

Diferente de redes sociais voltadas ao conteúdo finalizado, o AMOTIF atua **durante o processo criativo**. A plataforma permite que músicos participem na construção de uma obra sem a necessidade de contato direto ou simultâneo, eliminando barreiras geográficas e logísticas.

* **Projetos Musicais Estruturados:** Cada projeto é uma composição em desenvolvimento contendo parâmetros técnicos fundamentais: andamento (**BPM**), **escala/tonalidade** e uma faixa guia de referência.
* **Camadas Independentes (Layers):** Cada contribuição é registrada como uma trilha isolada, preservando o histórico criativo e garantindo a rastreabilidade de autoria.
* **Controle Artístico e Curadoria:** O criador do projeto detém o mecanismo de aprovação, decidindo quais contribuições integram oficialmente a linha do tempo da composição.
* **Versionamento Criativo:** Inspirado em conceitos de controle de versão, o sistema permite que a obra evolua progressivamente através de uma árvore de contribuições transparente.

---

## 🛠️ Stack Tecnológica

A arquitetura utiliza uma abordagem de **microsserviços híbridos**, garantindo que o processamento de grandes volumes de dados de áudio não comprometa a estabilidade da lógica de negócio.

| Componente | Tecnologia | Logo | Motivação |
| :--- | :--- | :---: | :--- |
| **Backend API** | **Fastify (Bun)** | ![Fastify](https://img.shields.io/badge/fastify-%23000000.svg?style=for-the-badge&logo=fastify&logoColor=white) | Gestão de rotas e permissões com validação rigorosa via **TypeBox**. |
| **Upload Service** | **Go (Fiber)** | ![Go](https://img.shields.io/badge/go-%2300ADD8.svg?style=for-the-badge&logo=go&logoColor=white) | Microsserviço especializado em tráfego de áudio com latência mínima e concorrência nativa. |
| **Banco de Dados** | **PostgreSQL** | ![PostgreSQL](https://img.shields.io/badge/postgresql-%23316192.svg?style=for-the-badge&logo=postgresql&logoColor=white) | Persistência relacional robusta e integridade de dados. |
| **ORM** | **Prisma** | ![Prisma](https://img.shields.io/badge/Prisma-3982CE?style=for-the-badge&logo=Prisma&logoColor=white) | Abstração de banco de dados para garantir agilidade entre TypeScript e SQL. |
| **Frontend** | **React 19** | ![React](https://img.shields.io/badge/react-%2320232a.svg?style=for-the-badge&logo=react&logoColor=%2361DAFB) | Interface de alta performance utilizando o novo **React Compiler**. |
| **Cloud Storage** | **Supabase** | ![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white) | Infraestrutura para armazenamento físico e entrega global de arquivos binários. |

---

## 🏗️ Engenharia de Processamento de Áudio (Go)

Para suportar múltiplos uploads simultâneos sem sobrecarregar o *Event Loop* do backend principal, implementamos um serviço dedicado em **Go**:

* **Concorrência Nativa (Goroutines):** Processamento paralelo de ficheiros com consumo insignificante de CPU e RAM.
* **Eficiência de Streaming:** Utilização de *pipes* para canalizar o áudio diretamente para o Storage à medida que os dados chegam, evitando o carregamento total do binário na memória RAM (*Zero-RAM loading*).
* **Segurança Zero Trust:** O serviço valida a assinatura do **JWT (JSON Web Token)** gerado pelo backend principal.



---

## 🔄 Fluxo de Dados e Pilares Técnicos

O ecossistema de dados está estruturado em três pilares fundamentais:

### A. Utilizador (A Identidade)
* **Identificação:** Créditos autorais vinculados à identidade real, com validação de CPF e perfis técnicos.

### B. Projeto (A Estrutura)
* **Metadados Técnicos:** Definição do BPM e tonalidade para garantir sincronia absoluta entre colaboradores.
* **Documentação Interativa:** Documentação automática das rotas via **Swagger** ![Swagger](https://img.shields.io/badge/-Swagger-%23C1E1C1?style=for-the-badge&logo=swagger&logoColor=black).

### C. Camadas (As Contribuições)
* **Sincronização:** Registro de **Delay/Offset** em milissegundos para compensar latências de gravação.
* **Persistência:** Mapeamento de URLs seguras para os objetos processados no Cloud Storage.

---
[Entenda nossa modelo de servidor Principal](./documents/organization.md)


[Entenda nossa Arquitetura](./documents/Architecture.md)
---

## 🌟 Valor do Ecossistema

O AMOTIF estabelece um ambiente que valoriza a autoria e a cooperação técnica. Ao transformar o processo de gravação em um fluxo assíncrono e organizado, a plataforma permite que músicos evoluam uma ideia desde um rascunho solitário até uma composição multipessoal complexa.
