-- AlterEnum: Add missing values to NotificationType
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'PROJECT_REJECT';
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'PROJECT_RELEASED';
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'NEW_LIKE';

-- CreateTable
CREATE TABLE "LayerVersion" (
    "id" UUID NOT NULL,
    "camadaId" UUID NOT NULL,
    "audio_url" TEXT NOT NULL,
    "nome_trilha" TEXT NOT NULL,
    "instrumento_tag" TEXT NOT NULL,
    "delay_offset" INTEGER NOT NULL DEFAULT 0,
    "volume_padrao" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "versionNumber" INTEGER NOT NULL,
    "mensagem" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "branchId" UUID,
    "autorId" UUID NOT NULL,

    CONSTRAINT "LayerVersion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LayerBranch" (
    "id" UUID NOT NULL,
    "camadaId" UUID NOT NULL,
    "nome" TEXT NOT NULL,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LayerBranch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RefreshToken" (
    "id" UUID NOT NULL,
    "token" TEXT NOT NULL,
    "userId" UUID NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RefreshToken_pkey" PRIMARY KEY ("id")
);

-- CreateEnum
CREATE TYPE "SugestaoStatus" AS ENUM ('ABERTA', 'EM_ANDAMENTO', 'RESOLVIDA');

-- CreateTable
CREATE TABLE "Sugestao" (
    "id" UUID NOT NULL,
    "titulo" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,
    "status" "SugestaoStatus" NOT NULL DEFAULT 'ABERTA',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "projetoId" UUID NOT NULL,
    "autorId" UUID NOT NULL,

    CONSTRAINT "Sugestao_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "LayerBranch_camadaId_nome_key" ON "LayerBranch"("camadaId", "nome");
CREATE INDEX "LayerVersion_camadaId_versionNumber_idx" ON "LayerVersion"("camadaId", "versionNumber");
CREATE INDEX "LayerVersion_camadaId_createdAt_idx" ON "LayerVersion"("camadaId", "createdAt");
CREATE INDEX "LayerVersion_autorId_idx" ON "LayerVersion"("autorId");
CREATE INDEX "LayerBranch_camadaId_idx" ON "LayerBranch"("camadaId");
CREATE UNIQUE INDEX "RefreshToken_token_key" ON "RefreshToken"("token");
CREATE INDEX "RefreshToken_userId_idx" ON "RefreshToken"("userId");
CREATE INDEX "RefreshToken_token_idx" ON "RefreshToken"("token");
CREATE INDEX "Sugestao_autorId_idx" ON "Sugestao"("autorId");
CREATE INDEX "Sugestao_projetoId_idx" ON "Sugestao"("projetoId");
CREATE INDEX "Sugestao_status_idx" ON "Sugestao"("status");

-- AlterTable: Add currentVersionId to Camada
ALTER TABLE "Camada" ADD COLUMN "currentVersionId" UUID;
CREATE UNIQUE INDEX "Camada_currentVersionId_key" ON "Camada"("currentVersionId");

-- AddForeignKey
ALTER TABLE "LayerVersion" ADD CONSTRAINT "LayerVersion_camadaId_fkey" FOREIGN KEY ("camadaId") REFERENCES "Camada"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "LayerVersion" ADD CONSTRAINT "LayerVersion_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "LayerBranch"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "LayerVersion" ADD CONSTRAINT "LayerVersion_autorId_fkey" FOREIGN KEY ("autorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "LayerBranch" ADD CONSTRAINT "LayerBranch_camadaId_fkey" FOREIGN KEY ("camadaId") REFERENCES "Camada"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Camada" ADD CONSTRAINT "Camada_currentVersionId_fkey" FOREIGN KEY ("currentVersionId") REFERENCES "LayerVersion"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "RefreshToken" ADD CONSTRAINT "RefreshToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Sugestao" ADD CONSTRAINT "Sugestao_projetoId_fkey" FOREIGN KEY ("projetoId") REFERENCES "Projeto"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Sugestao" ADD CONSTRAINT "Sugestao_autorId_fkey" FOREIGN KEY ("autorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
