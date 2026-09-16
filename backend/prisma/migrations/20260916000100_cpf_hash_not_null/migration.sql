-- Aplica NOT NULL ao cpf_hash APÓS o backfill (scripts/reencrypt_cpf.ts).
-- Se ainda houver linhas com cpf_hash NULL, esta migration vai falhar de
-- propósito: rode o script de re-criptografia antes de aplicá-la.
ALTER TABLE "User" ALTER COLUMN "cpf_hash" SET NOT NULL;
