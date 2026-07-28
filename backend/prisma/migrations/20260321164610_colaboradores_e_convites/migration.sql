-- DropForeignKey
ALTER TABLE "Camada" DROP CONSTRAINT "Camada_projetoId_fkey";

-- DropForeignKey
ALTER TABLE "Projeto" DROP CONSTRAINT "Projeto_userId_fkey";

-- CreateTable
CREATE TABLE "Convite" (
    "id" UUID NOT NULL,
    "projetoId" UUID NOT NULL,
    "email_destinatario" TEXT NOT NULL,
    "cargo" TEXT NOT NULL DEFAULT 'membro',
    "mensagem" TEXT,
    "token_convite" TEXT NOT NULL,
    "expira_em" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Convite_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Colaborador" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "projetoId" UUID NOT NULL,
    "cargo" TEXT NOT NULL DEFAULT 'membro',
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Colaborador_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Convite_token_convite_key" ON "Convite"("token_convite");

-- CreateIndex
CREATE INDEX "Convite_projetoId_idx" ON "Convite"("projetoId");

-- CreateIndex
CREATE INDEX "Convite_email_destinatario_idx" ON "Convite"("email_destinatario");

-- CreateIndex
CREATE INDEX "Colaborador_projetoId_idx" ON "Colaborador"("projetoId");

-- CreateIndex
CREATE UNIQUE INDEX "Colaborador_userId_projetoId_key" ON "Colaborador"("userId", "projetoId");

-- AddForeignKey
ALTER TABLE "Projeto" ADD CONSTRAINT "Projeto_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Convite" ADD CONSTRAINT "Convite_projetoId_fkey" FOREIGN KEY ("projetoId") REFERENCES "Projeto"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Colaborador" ADD CONSTRAINT "Colaborador_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Colaborador" ADD CONSTRAINT "Colaborador_projetoId_fkey" FOREIGN KEY ("projetoId") REFERENCES "Projeto"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Camada" ADD CONSTRAINT "Camada_projetoId_fkey" FOREIGN KEY ("projetoId") REFERENCES "Projeto"("id") ON DELETE CASCADE ON UPDATE CASCADE;
