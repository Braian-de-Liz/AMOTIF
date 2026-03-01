# 🎸 AMOTIF - Colaboração Musical Assíncrona

O **AMOTIF** é uma plataforma digital de colaboração musical assíncrona que permite a criação coletiva de obras musicais através da contribuição estruturada de camadas instrumentais independentes.

## 🎯 Conceito e Objetivos

Diferente das redes sociais tradicionais voltadas para a publicação de conteúdo finalizado, o AMOTIF foi projetado para atuar **durante o processo criativo**. A plataforma permite que músicos participem na construção de uma música mesmo sem contacto direto entre si, removendo barreiras geográficas e logísticas.

* **Projetos Musicais Partilhados:** Cada projeto é uma composição em desenvolvimento com informações técnicas fundamentais: andamento (BPM), tonalidade e uma faixa guia inicial.
* **Camadas Independentes (Layers):** Cada contribuição (vocais, guitarra, bateria, etc.) é registada como uma camada separada, preservando o histórico criativo e permitindo a rastreabilidade de autoria.
* **Controlo Artístico:** O criador do projeto detém o mecanismo de aprovação, decidindo quais as contribuições que passam a integrar oficialmente a composição.
* **Versionamento Criativo:** Inspirado em conceitos de versionamento distribuído, o sistema permite que a obra evolua progressivamente através de uma linha do tempo transparente.

---

## 🛠️ Stack Tecnológica

A arquitetura do AMOTIF utiliza uma abordagem de **microsserviços híbridos** para garantir que a manipulação de ficheiros pesados não comprometa a lógica de negócio do sistema.

| Peça | Tecnologia | Motivação |
| :--- | :--- | :--- |
| **Backend Principal** | **Fastify (Node.js)** | Gestão de rotas, permissões, autenticação e validação rigorosa de esquemas de dados. |
| **Serviço de Upload** | **Go (Fiber)** | Microsserviço especializado no tráfego de binários de áudio com latência mínima e alta eficiência de recursos. |
| **ORM** | **Prisma** | Abstração da base de dados para garantir integridade e agilidade no desenvolvimento entre TypeScript e PostgreSQL. |
| **Validação** | **Zod** | Garantia de que os metadados técnicos (BPM, CPF, etc.) e limites de ficheiros são respeitados. |
| **Storage** | **Supabase Storage** | Armazenamento físico dos ficheiros (.mp3/.wav), otimizando custos e entrega. |

---

## 🏗️ Arquitetura de Processamento de Áudio (Go)

Para suportar múltiplos uploads simultâneos sem "engarrafar" o servidor principal, foi implementado um serviço dedicado em **Go**.

* **Concorrência Nativa (Goroutines):** Processamento paralelo de ficheiros com consumo insignificante de CPU e RAM.
* **Eficiência de Streaming:** O sistema utiliza *pipes* para canalizar o áudio diretamente para o Storage à medida que os dados chegam, evitando o carregamento total do ficheiro na memória RAM.
* **Segurança Zero Trust:** O serviço valida o **JWT (JSON Web Token)** partilhado com o backend principal, garantindo que apenas utilizadores autorizados realizem uploads.



---

## 🔄 Fluxo de Dados e Camadas

O ecossistema de dados do AMOTIF está dividido em três pilares técnicos:

### A. Utilizador (A Identidade)
* **Identificação:** Nome completo para créditos autorais e CPF para segurança e validação de identidade real.
* **Perfil Técnico:** Bio e lista de instrumentos para facilitar a descoberta por outros produtores.

### B. Projeto (A Estrutura)
* **Metadados Técnicos:** Título, BPM (o "relógio" da música) e Escala/Tom (ex: Dó Maior), garantindo que todos os colaboradores gravem em sintonia.
* **Áudio Guia:** A base inicial que serve de referência para todas as camadas subsequentes.

### C. Camadas (As Contribuições)
* **Sincronização:** Cada camada possui um registo de **Delay/Offset** em milissegundos para garantir o alinhamento perfeito com a faixa guia.
* **Ficheiro de Áudio:** Armazenamento via URL segura apontando para o binário processado no Supabase.



---

## 🌟 Valor do Ecossistema
O AMOTIF estabelece um ambiente que valoriza a autoria e a cooperação, permitindo que músicos de diferentes locais contribuam para uma mesma obra de forma organizada, técnica e segura, evoluindo a música desde um simples rascunho até uma composição multipessoal.
