-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('INVITE_RECEIVED', 'INVITE_ACCEPTED', 'NEW_LAYER', 'LAYER_APPROVED', 'PROJECT_REJECT', 'NEW_FOLLOWER', 'PROJECT_RELEASED', 'NEW_LIKE');

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

-- CreateIndex
CREATE UNIQUE INDEX "LayerBranch_camadaId_nome_key" ON "LayerBranch"("camadaId", "nome");

-- CreateIndex
CREATE INDEX "LayerVersion_camadaId_versionNumber_idx" ON "LayerVersion"("camadaId", "versionNumber");

-- CreateIndex
CREATE INDEX "LayerVersion_camadaId_createdAt_idx" ON "LayerVersion"("camadaId", "createdAt");

-- CreateIndex
CREATE INDEX "LayerVersion_autorId_idx" ON "LayerVersion"("autorId");

-- CreateIndex
CREATE INDEX "LayerBranch_camadaId_idx" ON "LayerBranch"("camadaId");

-- AddForeignKey
ALTER TABLE "LayerVersion" ADD CONSTRAINT "LayerVersion_camadaId_fkey" FOREIGN KEY ("camadaId") REFERENCES "Camada"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LayerVersion" ADD CONSTRAINT "LayerVersion_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "LayerBranch"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LayerVersion" ADD CONSTRAINT "LayerVersion_autorId_fkey" FOREIGN KEY ("autorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LayerBranch" ADD CONSTRAINT "LayerBranch_camadaId_fkey" FOREIGN KEY ("camadaId") REFERENCES "Camada"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AlterTable: Add currentVersionId to Camada
ALTER TABLE "Camada" ADD COLUMN "currentVersionId" UUID;

-- CreateIndex
CREATE UNIQUE INDEX "Camada_currentVersionId_key" ON "Camada"("currentVersionId");

-- AddForeignKey
ALTER TABLE "Camada" ADD CONSTRAINT "Camada_currentVersionId_fkey" FOREIGN KEY ("currentVersionId") REFERENCES "LayerVersion"("id") ON DELETE SET NULL ON UPDATE CASCADE;
