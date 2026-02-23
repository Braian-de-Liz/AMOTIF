/*
  Warnings:

  - The primary key for the `Camada` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `Projeto` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `User` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - Changed the type of `id` on the `Camada` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `projetoId` on the `Camada` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `userId` on the `Camada` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `id` on the `Projeto` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `userId` on the `Projeto` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `id` on the `User` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- DropForeignKey
ALTER TABLE "Camada" DROP CONSTRAINT "Camada_projetoId_fkey";

-- DropForeignKey
ALTER TABLE "Camada" DROP CONSTRAINT "Camada_userId_fkey";

-- DropForeignKey
ALTER TABLE "Projeto" DROP CONSTRAINT "Projeto_userId_fkey";

-- AlterTable
ALTER TABLE "Camada" DROP CONSTRAINT "Camada_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" UUID NOT NULL,
DROP COLUMN "projetoId",
ADD COLUMN     "projetoId" UUID NOT NULL,
DROP COLUMN "userId",
ADD COLUMN     "userId" UUID NOT NULL,
ADD CONSTRAINT "Camada_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "Projeto" DROP CONSTRAINT "Projeto_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" UUID NOT NULL,
DROP COLUMN "userId",
ADD COLUMN     "userId" UUID NOT NULL,
ADD CONSTRAINT "Projeto_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "User" DROP CONSTRAINT "User_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" UUID NOT NULL,
ADD CONSTRAINT "User_pkey" PRIMARY KEY ("id");

-- CreateIndex
CREATE INDEX "Camada_projetoId_idx" ON "Camada"("projetoId");

-- CreateIndex
CREATE INDEX "Camada_userId_idx" ON "Camada"("userId");

-- CreateIndex
CREATE INDEX "Camada_createdAt_idx" ON "Camada"("createdAt");

-- CreateIndex
CREATE INDEX "Projeto_userId_idx" ON "Projeto"("userId");

-- CreateIndex
CREATE INDEX "Projeto_createdAt_idx" ON "Projeto"("createdAt");

-- AddForeignKey
ALTER TABLE "Projeto" ADD CONSTRAINT "Projeto_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Camada" ADD CONSTRAINT "Camada_projetoId_fkey" FOREIGN KEY ("projetoId") REFERENCES "Projeto"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Camada" ADD CONSTRAINT "Camada_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
