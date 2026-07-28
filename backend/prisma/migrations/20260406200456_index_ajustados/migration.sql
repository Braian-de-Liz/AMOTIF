-- DropIndex
DROP INDEX "Notification_createdAt_idx";

-- AlterTable
ALTER TABLE "Camada" ADD COLUMN     "deletedAt" TIMESTAMP(3),
ADD COLUMN     "duracao_ms" INTEGER,
ADD COLUMN     "formato_audio" TEXT NOT NULL DEFAULT 'mp3';

-- AlterTable
ALTER TABLE "Projeto" ADD COLUMN     "deletedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "deletedAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "Camada_esta_aprovada_idx" ON "Camada"("esta_aprovada");

-- CreateIndex
CREATE INDEX "Colaborador_userId_idx" ON "Colaborador"("userId");

-- CreateIndex
CREATE INDEX "Like_userId_idx" ON "Like"("userId");

-- CreateIndex
CREATE INDEX "MuralPost_autorId_idx" ON "MuralPost"("autorId");

-- CreateIndex
CREATE INDEX "Notification_userId_lida_idx" ON "Notification"("userId", "lida");

-- CreateIndex
CREATE INDEX "Notification_createdAt_idx" ON "Notification"("createdAt" DESC);

-- CreateIndex
CREATE INDEX "Notification_tipo_idx" ON "Notification"("tipo");

-- CreateIndex
CREATE INDEX "Projeto_userId_deletedAt_idx" ON "Projeto"("userId", "deletedAt");
