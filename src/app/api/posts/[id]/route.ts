import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { POST_SELECT, mapPost } from "@/lib/postMapper";

// GET /api/posts/[id]
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const postId = Number((await params).id);
  if (isNaN(postId)) return NextResponse.json({ error: "invalid id" }, { status: 400 });

  const post = await prisma.post.findFirst({
    where: { id: postId, status: "PUBLISHED" },
    select: POST_SELECT,
  });

  if (!post) return NextResponse.json({ error: "not found" }, { status: 404 });

  // 조회수 증가 (fire-and-forget)
  prisma.post.update({ where: { id: postId }, data: { viewCount: { increment: 1 } } }).catch(() => {});

  return NextResponse.json(mapPost(post));
}

// DELETE /api/posts/[id] — 작성자만 삭제 가능 (soft delete)
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  const userId = (session?.user as any)?.id as number | undefined;
  if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const postId = Number((await params).id);
  if (isNaN(postId)) return NextResponse.json({ error: "invalid id" }, { status: 400 });

  const post = await prisma.post.findUnique({
    where: { id: postId },
    select: { authorId: true },
  });
  if (!post) return NextResponse.json({ error: "not found" }, { status: 404 });
  if (post.authorId !== userId) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  await prisma.post.update({ where: { id: postId }, data: { status: "DELETED" } });

  return NextResponse.json({ ok: true });
}
