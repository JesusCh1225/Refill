-- CreateIndex
CREATE INDEX "Comment_postId_idx" ON "Comment"("postId");

-- CreateIndex
CREATE INDEX "Comment_parentId_idx" ON "Comment"("parentId");

-- CreateIndex
CREATE INDEX "Message_receiverId_isRead_idx" ON "Message"("receiverId", "isRead");

-- CreateIndex
CREATE INDEX "PostImage_postId_idx" ON "PostImage"("postId");
