-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('INVITE_RECEIVED', 'INVITE_ACCEPTED', 'NEW_LAYER', 'LAYER_APPROVED', 'NEW_FOLLOWER');

-- CreateTable
CREATE TABLE "Notification" (
    "id" UUID NOT NULL,
    "tipo" "NotificationType" NOT NULL,
    "mensagem" TEXT NOT NULL,
    "lida" BOOLEAN NOT NULL DEFAULT false,
    "userId" UUID NOT NULL,
    "projetoId" UUID,
    "actorId" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Notification_userId_idx" ON "Notification"("userId");

-- CreateIndex
CREATE INDEX "Notification_createdAt_idx" ON "Notification"("createdAt");

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
