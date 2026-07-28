-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "NotificationType" ADD VALUE 'PROJECT_REJECT';
ALTER TYPE "NotificationType" ADD VALUE 'NEW_LIKE';

-- CreateTable
CREATE TABLE "Like" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "projetoId" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Like_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Like_projetoId_idx" ON "Like"("projetoId");

-- CreateIndex
CREATE UNIQUE INDEX "Like_userId_projetoId_key" ON "Like"("userId", "projetoId");

-- AddForeignKey
ALTER TABLE "Like" ADD CONSTRAINT "Like_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Like" ADD CONSTRAINT "Like_projetoId_fkey" FOREIGN KEY ("projetoId") REFERENCES "Projeto"("id") ON DELETE CASCADE ON UPDATE CASCADE;
