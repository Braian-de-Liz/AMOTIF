/*
  Warnings:

  - Added the required column `genero` to the `Projeto` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "MusicGenre" AS ENUM ('ROCK', 'POP', 'JAZZ', 'BLUES', 'FORRO', 'METAL', 'HIP_HOP', 'ELECTRONIC', 'CLASSICAL', 'LO_FI', 'INDIE', 'SERTANEJO', 'SAMBA', 'MPB', 'COUNTRY', 'FUNK', 'SOUNDTRACK', 'REGGAE');

-- AlterTable
ALTER TABLE "Projeto" ADD COLUMN     "genero" "MusicGenre" NOT NULL;

-- CreateIndex
CREATE INDEX "Projeto_genero_idx" ON "Projeto"("genero");
