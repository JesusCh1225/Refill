import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUserId } from "@/lib/auth";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const postId = Number((await params).id);
  if (isNaN(postId)) return NextResponse.json({ error: "invalid" }, { status: 400 });

  const { reason } = await req.json();
  if (!reason?.trim()) return NextResponse.json({ error: "reason required" }, { status: 400 });

  const post = await prisma.communityPost.findUnique({ where: { id: postId }, select: { authorId: true } });
  if (!post) return NextResponse.json({ error: "not found" }, { status: 404 });
  if (post.authorId === userId) return NextResponse.json({ error: "cannot report own post" }, { status: 400 });

  await prisma.report.create({
    data: { reporterId: userId, communityPostId: postId, reason: reason.trim().slice(0, 200) },
  });

  return NextResponse.json({ ok: true });
}
