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

  let body: any;
  try { body = await req.json(); } catch { return NextResponse.json({ error: "invalid body" }, { status: 400 }); }
  const { content, parentId } = body;
  if (!content?.trim()) return NextResponse.json({ error: "empty" }, { status: 400 });
  if (content.trim().length > 2000) return NextResponse.json({ error: "too long" }, { status: 400 });

  const post = await prisma.communityPost.findUnique({ where: { id: postId }, select: { id: true } });
  if (!post) return NextResponse.json({ error: "post not found" }, { status: 404 });

  const resolvedParentId = parentId != null ? Number(parentId) : null;
  if (resolvedParentId) {
    const parent = await prisma.communityComment.findUnique({
      where: { id: resolvedParentId },
      select: { postId: true, parentId: true },
    });
    if (!parent || parent.postId !== postId) {
      return NextResponse.json({ error: "invalid parent" }, { status: 400 });
    }
    if (parent.parentId !== null) {
      return NextResponse.json({ error: "nested replies not allowed" }, { status: 400 });
    }
  }

  const { id: commentId } = await prisma.communityComment.create({
    data: { content: content.trim(), authorId: userId, postId, parentId: resolvedParentId },
    select: { id: true },
  });
  const comment = await prisma.communityComment.findUnique({
    where: { id: commentId },
    include: {
      author: { select: { id: true, nickname: true, name: true, avatarUrl: true } },
      replies: { include: { author: { select: { id: true, nickname: true, name: true, avatarUrl: true } } } },
    },
  });

  return NextResponse.json(comment, { status: 201 });
}
