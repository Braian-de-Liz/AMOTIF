-- AlterEnum
ALTER TYPE "NotificationType" ADD VALUE 'PROJECT_RELEASED';

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
