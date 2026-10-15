-- Corrige bancos em que a tabela LayerBranch e a coluna LayerVersion.tag nunca foram criadas
-- (a migração 20260806 é um no-op e nenhuma outra criava `tag`). Idempotente: não afeta bancos que já têm tudo.
ALTER TABLE "LayerVersion" ADD COLUMN IF NOT EXISTS "tag" TEXT;

CREATE TABLE IF NOT EXISTS "LayerBranch" (
    "id" UUID NOT NULL,
    "nome" TEXT NOT NULL,
    "camadaId" UUID NOT NULL,
    "baseVersionId" UUID NOT NULL,
    "headVersionId" UUID NOT NULL,
    "isMain" BOOLEAN NOT NULL DEFAULT false,
    "createdById" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LayerBranch_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "LayerBranch_camadaId_idx" ON "LayerBranch"("camadaId");
CREATE INDEX IF NOT EXISTS "LayerBranch_createdById_idx" ON "LayerBranch"("createdById");
CREATE UNIQUE INDEX IF NOT EXISTS "LayerBranch_camadaId_nome_key" ON "LayerBranch"("camadaId", "nome");

DO $$ BEGIN
    ALTER TABLE "LayerBranch" ADD CONSTRAINT "LayerBranch_camadaId_fkey" FOREIGN KEY ("camadaId") REFERENCES "Camada"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    ALTER TABLE "LayerBranch" ADD CONSTRAINT "LayerBranch_baseVersionId_fkey" FOREIGN KEY ("baseVersionId") REFERENCES "LayerVersion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    ALTER TABLE "LayerBranch" ADD CONSTRAINT "LayerBranch_headVersionId_fkey" FOREIGN KEY ("headVersionId") REFERENCES "LayerVersion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    ALTER TABLE "LayerBranch" ADD CONSTRAINT "LayerBranch_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
