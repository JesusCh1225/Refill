import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAdminSession } from "@/lib/admin";

// 각 테이블의 현재 max(id)를 기준으로 시퀀스를 리셋
// 테이블이 비어있으면 → 다음 id = 1
// 테이블에 데이터가 있으면 → 다음 id = max(id) + 1 (기존 데이터와 충돌 방지)
const SEQUENCES = [
  { seq: "Post_id_seq",             table: "Post" },
  { seq: "PostImage_id_seq",        table: "PostImage" },
  { seq: "PostLocationTag_id_seq",  table: "PostLocationTag" },
  { seq: "Comment_id_seq",          table: "Comment" },
  { seq: "Hashtag_id_seq",          table: "Hashtag" },
  { seq: "CommunityPost_id_seq",    table: "CommunityPost" },
  { seq: "CommunityComment_id_seq", table: "CommunityComment" },
  { seq: "Message_id_seq",          table: "Message" },
  { seq: "Review_id_seq",           table: "Review" },
  { seq: "Notification_id_seq",     table: "Notification" },
  { seq: "Report_id_seq",           table: "Report" },
];

export async function POST() {
  if (!(await isAdminSession()))
    return NextResponse.json({ error: "forbidden" }, { status: 403 });

  for (const { seq, table } of SEQUENCES) {
    await prisma.$executeRawUnsafe(
      `SELECT setval('"${seq}"', COALESCE((SELECT MAX(id) FROM "${table}"), 0) + 1, false)`
    );
  }

  return NextResponse.json({ ok: true });
}
