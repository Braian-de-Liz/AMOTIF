-- CreateTable
CREATE TABLE "MuralPost" (
    "id" UUID NOT NULL,
    "conteudo" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "projetoId" UUID NOT NULL,
    "autorId" UUID NOT NULL,

    CONSTRAINT "MuralPost_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "MuralPost_projetoId_idx" ON "MuralPost"("projetoId");

-- AddForeignKey
ALTER TABLE "MuralPost" ADD CONSTRAINT "MuralPost_projetoId_fkey" FOREIGN KEY ("projetoId") REFERENCES "Projeto"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MuralPost" ADD CONSTRAINT "MuralPost_autorId_fkey" FOREIGN KEY ("autorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
