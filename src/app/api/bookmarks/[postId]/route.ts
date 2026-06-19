import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUserId as getUserId } from "@/lib/auth";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ postId: string }> },
) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const postId = parseInt((await params).postId);
  if (isNaN(postId)) return NextResponse.json({ error: "invalid" }, { status: 400 });

  const postExists = await prisma.post.findUnique({ where: { id: postId }, select: { id: true } });
  if (!postExists) return NextResponse.json({ error: "post not found" }, { status: 404 });

  const existing = await prisma.bookmark.findUnique({
    where: { userId_postId: { userId, postId } },
    select: { userId: true },
  });
  if (!existing) {
    await prisma.bookmark.create({ data: { userId, postId } });
  }

  return NextResponse.json({ ok: true });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ postId: string }> },
) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const postId = parseInt((await params).postId);
  if (isNaN(postId)) return NextResponse.json({ error: "invalid" }, { status: 400 });

  await prisma.bookmark.deleteMany({ where: { userId, postId } });

  return NextResponse.json({ ok: true });
}
