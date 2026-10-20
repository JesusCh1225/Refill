import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUserId } from "@/lib/auth";
import { REPORT_REASONS } from "@/data/reportReasons";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const postId = Number((await params).id);
  if (isNaN(postId)) return NextResponse.json({ error: "invalid" }, { status: 400 });

  let body: any;
  try { body = await req.json(); } catch { return NextResponse.json({ error: "invalid body" }, { status: 400 }); }
  const reason = (body.reason ?? "").trim();
  if (!REPORT_REASONS.includes(reason as any)) {
    return NextResponse.json({ error: "invalid reason" }, { status: 400 });
  }

  const post = await prisma.communityPost.findUnique({ where: { id: postId }, select: { authorId: true } });
  if (!post) return NextResponse.json({ error: "not found" }, { status: 404 });
  if (post.authorId === userId) return NextResponse.json({ error: "cannot report own post" }, { status: 400 });

  const existing = await prisma.report.findFirst({
    where: { reporterId: userId, communityPostId: postId, reason },
  });
  if (existing) return NextResponse.json({ error: "already reported" }, { status: 409 });

  await prisma.report.create({
    data: { reporterId: userId, communityPostId: postId, reason: reason.trim().slice(0, 200) },
  });

  return NextResponse.json({ ok: true });
}
