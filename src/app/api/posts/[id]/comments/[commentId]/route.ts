import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUserId } from "@/lib/auth";
import { isAdminSession } from "@/lib/admin";

// PATCH /api/posts/[id]/comments/[commentId] — 작성자만 수정
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; commentId: string }> },
) {
  const { commentId: cidStr } = await params;
  const commentId = Number(cidStr);
  if (isNaN(commentId)) return NextResponse.json({ error: "invalid" }, { status: 400 });

  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const comment = await prisma.comment.findUnique({
    where: { id: commentId },
    select: { id: true, authorId: true },
  });
  if (!comment) return NextResponse.json({ error: "not found" }, { status: 404 });
  if (comment.authorId !== userId) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const { content } = await req.json();
  const trimmed = (content ?? "").trim();
  if (!trimmed) return NextResponse.json({ error: "content required" }, { status: 400 });
  if (trimmed.length > 500) return NextResponse.json({ error: "too long" }, { status: 400 });

  const updated = await prisma.comment.update({
    where: { id: commentId },
    data: { content: trimmed },
    select: { id: true, content: true, updatedAt: true },
  });

  return NextResponse.json(updated);
}

// DELETE /api/posts/[id]/comments/[commentId] — 작성자 또는 관리자 삭제
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; commentId: string }> },
) {
  const { commentId: cidStr } = await params;
  const commentId = Number(cidStr);
  if (isNaN(commentId)) return NextResponse.json({ error: "invalid" }, { status: 400 });

  const [userId, admin] = await Promise.all([getSessionUserId(), isAdminSession()]);
  if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const comment = await prisma.comment.findUnique({
    where: { id: commentId },
    select: { id: true, authorId: true },
  });
  if (!comment) return NextResponse.json({ error: "not found" }, { status: 404 });
  if (comment.authorId !== userId && !admin) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  await prisma.comment.delete({ where: { id: commentId } });

  return NextResponse.json({ ok: true });
}
