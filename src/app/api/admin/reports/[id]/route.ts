import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAdminSession } from "@/lib/admin";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!(await isAdminSession()))
    return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const id = Number((await params).id);
  if (isNaN(id)) return NextResponse.json({ error: "invalid" }, { status: 400 });

  let body: any;
  try { body = await req.json(); } catch { return NextResponse.json({ error: "invalid body" }, { status: 400 }); }

  const { status, hidePost } = body;
  if (!["RESOLVED", "DISMISSED"].includes(status))
    return NextResponse.json({ error: "invalid status" }, { status: 400 });

  const report = await prisma.report.findUnique({
    where: { id },
    select: { id: true, postId: true, communityPostId: true },
  });
  if (!report) return NextResponse.json({ error: "not found" }, { status: 404 });

  await prisma.report.update({ where: { id }, data: { status } });

  // 신고 처리와 함께 게시글 숨기기 옵션
  if (hidePost && status === "RESOLVED") {
    if (report.postId) {
      await prisma.post.update({
        where: { id: report.postId },
        data: { status: "HIDDEN" },
      });
    }
    if (report.communityPostId) {
      // CommunityPost에는 status 필드가 없으므로 삭제 처리
      await prisma.communityPost.delete({ where: { id: report.communityPostId } }).catch(() => {});
    }
  }

  return NextResponse.json({ ok: true });
}
