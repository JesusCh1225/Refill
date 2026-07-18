-- AlterTable
ALTER TABLE "Report" ADD COLUMN     "communityPostId" INTEGER;

-- AddForeignKey
ALTER TABLE "Report" ADD CONSTRAINT "Report_communityPostId_fkey" FOREIGN KEY ("communityPostId") REFERENCES "CommunityPost"("id") ON DELETE CASCADE ON UPDATE CASCADE;
