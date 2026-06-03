-- DropIndex
DROP INDEX IF EXISTS "Camada_projetoId_idx";

-- DropIndex
DROP INDEX IF EXISTS "Camada_esta_aprovada_idx";

-- CreateIndex
CREATE INDEX "Camada_projetoId_instrumento_tag_esta_aprovada_idx" ON "Camada"("projetoId", "instrumento_tag", "esta_aprovada");

-- CreateIndex
CREATE INDEX "Camada_projetoId_esta_aprovada_idx" ON "Camada"("projetoId", "esta_aprovada");

-- CreateIndex
CREATE INDEX "Projeto_createdAt_genero_idx" ON "Projeto"("createdAt", "genero");
