import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUserId } from "@/lib/auth";

async function resolveOwnership(commentId: number) {
  const userId = await getSessionUserId();
  if (!userId) return { error: "unauthorized", status: 401 } as const;

  const comment = await prisma.comment.findUnique({
    where: { id: commentId },
    select: { id: true, authorId: true },
  });
  if (!comment) return { error: "not found", status: 404 } as const;
  if (comment.authorId !== userId) return { error: "forbidden", status: 403 } as const;

  return { userId, commentId } as const;
}

// PATCH /api/posts/[id]/comments/[commentId]
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; commentId: string }> },
) {
  const { commentId: cidStr } = await params;
  const commentId = Number(cidStr);
  if (isNaN(commentId)) return NextResponse.json({ error: "invalid" }, { status: 400 });

  const result = await resolveOwnership(commentId);
  if ("error" in result) return NextResponse.json({ error: result.error }, { status: result.status });

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

// DELETE /api/posts/[id]/comments/[commentId]
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; commentId: string }> },
) {
  const { commentId: cidStr } = await params;
  const commentId = Number(cidStr);
  if (isNaN(commentId)) return NextResponse.json({ error: "invalid" }, { status: 400 });

  const result = await resolveOwnership(commentId);
  if ("error" in result) return NextResponse.json({ error: result.error }, { status: result.status });

  await prisma.comment.delete({ where: { id: commentId } });

  return NextResponse.json({ ok: true });
}
