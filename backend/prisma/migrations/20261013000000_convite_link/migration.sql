-- CreateTable
CREATE TABLE "ConviteLink" (
    "id" UUID NOT NULL,
    "projetoId" UUID NOT NULL,
    "criadoPorId" UUID NOT NULL,
    "token" TEXT NOT NULL,
    "cargo" TEXT NOT NULL DEFAULT 'membro',
    "max_usos" INTEGER NOT NULL,
    "usos" INTEGER NOT NULL DEFAULT 0,
    "expira_em" TIMESTAMP(3) NOT NULL,
    "revogadoEm" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ConviteLink_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ConviteLink_token_key" ON "ConviteLink"("token");

-- CreateIndex
CREATE INDEX "ConviteLink_projetoId_idx" ON "ConviteLink"("projetoId");

-- CreateIndex
CREATE INDEX "ConviteLink_criadoPorId_idx" ON "ConviteLink"("criadoPorId");

-- AddForeignKey
ALTER TABLE "ConviteLink" ADD CONSTRAINT "ConviteLink_projetoId_fkey" FOREIGN KEY ("projetoId") REFERENCES "Projeto"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConviteLink" ADD CONSTRAINT "ConviteLink_criadoPorId_fkey" FOREIGN KEY ("criadoPorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
