import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUserId } from "@/lib/auth";
import { isAdminSession } from "@/lib/admin";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; commentId: string }> },
) {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { id: postIdStr, commentId } = await params;
  const postId = Number(postIdStr);
  const id = Number(commentId);
  if (isNaN(postId) || isNaN(id)) return NextResponse.json({ error: "invalid" }, { status: 400 });

  let body: any;
  try { body = await req.json(); } catch { return NextResponse.json({ error: "invalid body" }, { status: 400 }); }
  const { content } = body;
  if (!content?.trim()) return NextResponse.json({ error: "empty" }, { status: 400 });
  if (content.trim().length > 2000) return NextResponse.json({ error: "too long" }, { status: 400 });

  const comment = await prisma.communityComment.findUnique({ where: { id }, select: { authorId: true, postId: true } });
  if (!comment || comment.postId !== postId) return NextResponse.json({ error: "not found" }, { status: 404 });
  if (comment.authorId !== userId) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const updated = await prisma.communityComment.update({
    where: { id },
    data: { content: content.trim() },
    select: { id: true, content: true },
  });

  return NextResponse.json(updated);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; commentId: string }> },
) {
  const [userId, admin] = await Promise.all([getSessionUserId(), isAdminSession()]);
  if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { id: postIdStr, commentId } = await params;
  const postId = Number(postIdStr);
  const id = Number(commentId);
  if (isNaN(postId) || isNaN(id)) return NextResponse.json({ error: "invalid" }, { status: 400 });

  const comment = await prisma.communityComment.findUnique({ where: { id }, select: { authorId: true, postId: true } });
  if (!comment || comment.postId !== postId) return NextResponse.json({ error: "not found" }, { status: 404 });
  if (comment.authorId !== userId && !admin) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  await prisma.communityComment.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
