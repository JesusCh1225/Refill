import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUserId } from "@/lib/auth";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const id = Number((await params).id);
  if (isNaN(id)) return NextResponse.json({ error: "invalid" }, { status: 400 });

  const userId = await getSessionUserId();

  const post = await prisma.communityPost.findUnique({
    where: { id },
    include: {
      author: { select: { id: true, nickname: true, name: true, avatarUrl: true } },
      _count: { select: { comments: true, likes: true } },
      ...(userId ? { likes: { where: { userId }, select: { userId: true } } } : {}),
    },
  });

  if (!post) return NextResponse.json({ error: "not found" }, { status: 404 });

  return NextResponse.json({
    ...post,
    liked: userId ? (post as any).likes?.length > 0 : false,
  });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const id = Number((await params).id);
  const post = await prisma.communityPost.findUnique({ where: { id }, select: { authorId: true } });
  if (!post) return NextResponse.json({ error: "not found" }, { status: 404 });
  if (post.authorId !== userId) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  await prisma.communityPost.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
