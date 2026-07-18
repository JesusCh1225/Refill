import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUserId } from "@/lib/auth";
import { getBlockedIds } from "@/lib/blockFilter";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const postId = Number((await params).id);
  if (isNaN(postId)) return NextResponse.json({ error: "invalid" }, { status: 400 });

  const [viewerId, comments] = await Promise.all([
    getSessionUserId(),
    prisma.communityComment.findMany({
      where: { postId, parentId: null },
      orderBy: { createdAt: "asc" },
      include: {
        author: { select: { id: true, nickname: true, name: true, avatarUrl: true } },
        replies: {
          orderBy: { createdAt: "asc" },
          include: {
            author: { select: { id: true, nickname: true, name: true, avatarUrl: true } },
          },
        },
      },
    }),
  ]);

  const blockedIds = await getBlockedIds(viewerId);
  const blockedSet = new Set(blockedIds);

  function maskBlocked(c: any): any {
    const isBlocked = c.author?.id != null && blockedSet.has(c.author.id);
    return {
      ...c,
      content: isBlocked ? "차단한 사용자입니다." : c.content,
      author: isBlocked
        ? { ...c.author, name: "차단된 사용자", nickname: null, avatarUrl: null }
        : c.author,
      replies: c.replies?.map(maskBlocked),
    };
  }

  return NextResponse.json(blockedSet.size > 0 ? comments.map(maskBlocked) : comments);
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const postId = Number((await params).id);
  if (isNaN(postId)) return NextResponse.json({ error: "invalid" }, { status: 400 });

  const { content, parentId } = await req.json();
  if (!content?.trim()) return NextResponse.json({ error: "empty" }, { status: 400 });
  if (content.trim().length > 2000) return NextResponse.json({ error: "too long" }, { status: 400 });

  const created = await prisma.communityComment.create({
    data: {
      content: content.trim(),
      authorId: userId,
      postId,
      parentId: parentId ?? null,
    },
  });

  const comment = await prisma.communityComment.findUnique({
    where: { id: created.id },
    include: {
      author: { select: { id: true, nickname: true, name: true, avatarUrl: true } },
      replies: { include: { author: { select: { id: true, nickname: true, name: true, avatarUrl: true } } } },
    },
  });

  return NextResponse.json(comment, { status: 201 });
}
