-- Ajuste de tempo e tom por camada (aplicado na reprodução, sem alterar o arquivo).
ALTER TABLE "Camada" ADD COLUMN "bpm_original" INTEGER;
ALTER TABLE "Camada" ADD COLUMN "transposicao_semitons" INTEGER NOT NULL DEFAULT 0;

ALTER TABLE "LayerVersion" ADD COLUMN "bpm_original" INTEGER;
ALTER TABLE "LayerVersion" ADD COLUMN "transposicao_semitons" INTEGER NOT NULL DEFAULT 0;
