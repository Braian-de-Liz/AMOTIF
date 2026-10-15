-- Comentários presos a um instante do áudio de uma camada.
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'NEW_COMMENT';

CREATE TABLE "Comentario" (
    "id" UUID NOT NULL,
    "camadaId" UUID NOT NULL,
    "autorId" UUID NOT NULL,
    "segundos" DOUBLE PRECISION NOT NULL,
    "texto" TEXT NOT NULL,
    "versaoNumero" INTEGER,
    "resolvido" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Comentario_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Comentario_camadaId_segundos_idx" ON "Comentario"("camadaId", "segundos");
CREATE INDEX "Comentario_autorId_idx" ON "Comentario"("autorId");

ALTER TABLE "Comentario" ADD CONSTRAINT "Comentario_camadaId_fkey" FOREIGN KEY ("camadaId") REFERENCES "Camada"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Comentario" ADD CONSTRAINT "Comentario_autorId_fkey" FOREIGN KEY ("autorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
