-- AlterTable
ALTER TABLE "RefreshToken" ADD COLUMN "usedAt" TIMESTAMP(3);

-- Limpeza periódica por expiração
CREATE INDEX "RefreshToken_expiresAt_idx" ON "RefreshToken"("expiresAt");
