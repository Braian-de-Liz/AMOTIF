/*
  Warnings:

  - Added the required column `remetenteId` to the `Convite` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Camada" DROP CONSTRAINT "Camada_userId_fkey";

-- DropForeignKey
ALTER TABLE "MuralPost" DROP CONSTRAINT "MuralPost_autorId_fkey";

-- AlterTable
ALTER TABLE "Convite" ADD COLUMN     "remetenteId" UUID NOT NULL;

-- CreateTable
CREATE TABLE "Favorite" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "projetoId" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Favorite_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Favorite_userId_idx" ON "Favorite"("userId");

-- CreateIndex
CREATE INDEX "Favorite_projetoId_idx" ON "Favorite"("projetoId");

-- CreateIndex
CREATE UNIQUE INDEX "Favorite_userId_projetoId_key" ON "Favorite"("userId", "projetoId");

-- CreateIndex
CREATE INDEX "Convite_remetenteId_idx" ON "Convite"("remetenteId");

-- AddForeignKey
ALTER TABLE "MuralPost" ADD CONSTRAINT "MuralPost_autorId_fkey" FOREIGN KEY ("autorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Convite" ADD CONSTRAINT "Convite_remetenteId_fkey" FOREIGN KEY ("remetenteId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Camada" ADD CONSTRAINT "Camada_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Favorite" ADD CONSTRAINT "Favorite_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Favorite" ADD CONSTRAINT "Favorite_projetoId_fkey" FOREIGN KEY ("projetoId") REFERENCES "Projeto"("id") ON DELETE CASCADE ON UPDATE CASCADE;
