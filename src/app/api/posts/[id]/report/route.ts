import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUserId } from "@/lib/auth";

const VALID_REASONS = ["스팸/광고", "불법 정보", "욕설/혐오", "사기 의심", "기타"];

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const reporterId = await getSessionUserId();
  if (!reporterId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const postId = Number((await params).id);
  if (isNaN(postId)) return NextResponse.json({ error: "invalid id" }, { status: 400 });

  const body = await req.json();
  const reason = (body.reason ?? "").trim();
  if (!VALID_REASONS.includes(reason)) {
    return NextResponse.json({ error: "invalid reason" }, { status: 400 });
  }

  const post = await prisma.post.findUnique({ where: { id: postId }, select: { authorId: true } });
  if (!post) return NextResponse.json({ error: "not found" }, { status: 404 });
  if (post.authorId === reporterId) {
    return NextResponse.json({ error: "자신의 게시글은 신고할 수 없어요." }, { status: 400 });
  }

  // 동일 사유 중복 신고 방지
  const existing = await prisma.report.findFirst({
    where: { reporterId, postId, reason },
    select: { id: true },
  });
  if (existing) return NextResponse.json({ error: "already_reported" }, { status: 409 });

  await prisma.report.create({ data: { reporterId, postId, reason } });
  return NextResponse.json({ ok: true }, { status: 201 });
}
