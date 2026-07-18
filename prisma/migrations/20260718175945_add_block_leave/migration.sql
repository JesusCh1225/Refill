-- CreateTable
CREATE TABLE "UserBlock" (
    "blockerId" INTEGER NOT NULL,
    "blockedId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserBlock_pkey" PRIMARY KEY ("blockerId","blockedId")
);

-- CreateTable
CREATE TABLE "ConversationLeft" (
    "userId" INTEGER NOT NULL,
    "partnerId" INTEGER NOT NULL,
    "leftAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ConversationLeft_pkey" PRIMARY KEY ("userId","partnerId")
);

-- CreateIndex
CREATE INDEX "UserBlock_blockerId_idx" ON "UserBlock"("blockerId");

-- CreateIndex
CREATE INDEX "UserBlock_blockedId_idx" ON "UserBlock"("blockedId");

-- CreateIndex
CREATE INDEX "ConversationLeft_userId_idx" ON "ConversationLeft"("userId");

-- AddForeignKey
ALTER TABLE "UserBlock" ADD CONSTRAINT "UserBlock_blockerId_fkey" FOREIGN KEY ("blockerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserBlock" ADD CONSTRAINT "UserBlock_blockedId_fkey" FOREIGN KEY ("blockedId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConversationLeft" ADD CONSTRAINT "ConversationLeft_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConversationLeft" ADD CONSTRAINT "ConversationLeft_partnerId_fkey" FOREIGN KEY ("partnerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
