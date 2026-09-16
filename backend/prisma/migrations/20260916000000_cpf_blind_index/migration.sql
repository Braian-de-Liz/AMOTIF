-- DropIndex (remove a unicidade do CPF criptografado; a busca passa a usar cpf_hash)
DROP INDEX IF EXISTS "User_cpf_key";

-- AlterTable: adiciona o blind index do CPF (HMAC).
-- Nullable nesta migration para não quebrar linhas existentes;
-- o backfill é feito pelo script scripts/reencrypt_cpf.ts e a
-- constraint NOT NULL/UNIQUE é aplicada na migration seguinte.
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "cpf_hash" TEXT;

-- CreateIndex: unicidade do blind index (permite NULLs enquanto o backfill não roda)
CREATE UNIQUE INDEX IF NOT EXISTS "User_cpf_hash_key" ON "User"("cpf_hash");
