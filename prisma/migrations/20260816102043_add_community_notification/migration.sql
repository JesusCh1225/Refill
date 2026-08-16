-- DropIndex
DROP INDEX "Message_senderId_receiverId_idx";

-- AlterTable
ALTER TABLE "Notification" ADD COLUMN     "communityCommentId" INTEGER,
ADD COLUMN     "communityPostId" INTEGER;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_communityPostId_fkey" FOREIGN KEY ("communityPostId") REFERENCES "CommunityPost"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_communityCommentId_fkey" FOREIGN KEY ("communityCommentId") REFERENCES "CommunityComment"("id") ON DELETE SET NULL ON UPDATE CASCADE;
