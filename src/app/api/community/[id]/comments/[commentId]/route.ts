import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUserId } from "@/lib/auth";
import { isAdminSession } from "@/lib/admin";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; commentId: string }> },
) {
  const [userId, admin] = await Promise.all([getSessionUserId(), isAdminSession()]);
  if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { commentId } = await params;
  const id = Number(commentId);
  if (isNaN(id)) return NextResponse.json({ error: "invalid" }, { status: 400 });

  const comment = await prisma.communityComment.findUnique({ where: { id }, select: { authorId: true } });
  if (!comment) return NextResponse.json({ error: "not found" }, { status: 404 });
  if (comment.authorId !== userId && !admin) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  await prisma.communityComment.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
