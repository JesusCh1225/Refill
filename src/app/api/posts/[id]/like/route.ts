import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUserId } from "@/lib/auth";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const postId = Number((await params).id);
  if (isNaN(postId)) return NextResponse.json({ error: "invalid id" }, { status: 400 });

  const post = await prisma.post.findUnique({
    where: { id: postId, status: "PUBLISHED" },
    select: { id: true },
  });
  if (!post) return NextResponse.json({ error: "not found" }, { status: 404 });

  const existing = await prisma.like.findUnique({
    where: { userId_postId: { userId, postId } },
  });

  if (existing) {
    await prisma.like.delete({ where: { userId_postId: { userId, postId } } });
  } else {
    await prisma.like.create({ data: { userId, postId } });
  }

  const count = await prisma.like.count({ where: { postId } });
  return NextResponse.json({ liked: !existing, count });
}
