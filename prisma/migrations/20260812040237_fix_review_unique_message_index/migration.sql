-- postId가 NULL인 일반 리뷰에 대한 부분 유니크 인덱스
-- @@unique([reviewerId, revieweeId, postId])는 postId=NULL인 경우 중복을 막지 못함
-- (PostgreSQL에서 NULL != NULL이므로 유니크 제약이 적용되지 않음)
CREATE UNIQUE INDEX "Review_general_unique_idx"
  ON "Review" ("reviewerId", "revieweeId")
  WHERE "postId" IS NULL;

-- 메시지 대화 쌍 조회 성능을 위한 복합 인덱스
-- WHERE (senderId=$a AND receiverId=$b) OR (senderId=$b AND receiverId=$a) 쿼리에 사용
CREATE INDEX "Message_senderId_receiverId_idx" ON "Message"("senderId", "receiverId");
