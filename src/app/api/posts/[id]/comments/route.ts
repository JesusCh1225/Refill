import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUserId } from "@/lib/auth";

const REPLY_SELECT = {
  id: true,
  content: true,
  isSecret: true,
  guestName: true,
  authorId: true,
  parentId: true,
  createdAt: true,
  updatedAt: true,
  author: { select: { name: true, nickname: true } },
} as const;

const COMMENT_SELECT = {
  ...REPLY_SELECT,
  replies: {
    select: REPLY_SELECT,
    orderBy: { createdAt: "asc" as const },
  },
} as const;

type RawComment = {
  id: number;
  content: string | null;
  isSecret: boolean;
  guestName: string | null;
  authorId: number | null;
  parentId: number | null;
  createdAt: Date;
  updatedAt: Date;
  author: { name: string; nickname: string | null } | null;
  replies?: RawComment[];
};

function redact(c: RawComment, viewerId: number | null, postAuthorId: number): RawComment {
  const canSee =
    !c.isSecret ||
    (viewerId !== null && (viewerId === c.authorId || viewerId === postAuthorId));
  return {
    ...c,
    content: canSee ? c.content : null,
    replies: c.replies?.map((r) => redact(r, viewerId, postAuthorId)),
  };
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const postId = Number((await params).id);
  if (isNaN(postId)) return NextResponse.json({ error: "invalid id" }, { status: 400 });

  const [viewerId, post] = await Promise.all([
    getSessionUserId(),
    prisma.post.findUnique({ where: { id: postId }, select: { authorId: true } }),
  ]);

  if (!post) return NextResponse.json([], { status: 200 });

  const comments = await prisma.comment.findMany({
    where: { postId, parentId: null },
    orderBy: { createdAt: "asc" },
    select: COMMENT_SELECT,
  });

  return NextResponse.json(
    comments.map((c) => redact(c as unknown as RawComment, viewerId ?? null, post.authorId)),
  );
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const postId = Number((await params).id);
  if (isNaN(postId)) return NextResponse.json({ error: "invalid id" }, { status: 400 });

  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = await req.json();
  const content = (body.content ?? "").trim();
  if (!content) return NextResponse.json({ error: "content required" }, { status: 400 });
  if (content.length > 500) return NextResponse.json({ error: "too long" }, { status: 400 });

  const isSecret = body.isSecret === true;

  const post = await prisma.post.findUnique({ where: { id: postId }, select: { id: true, authorId: true } });
  if (!post) return NextResponse.json({ error: "post not found" }, { status: 404 });

  const parentId = body.parentId ? Number(body.parentId) : null;
  if (parentId) {
    const parent = await prisma.comment.findUnique({
      where: { id: parentId },
      select: { postId: true, parentId: true },
    });
    if (!parent || parent.postId !== postId) {
      return NextResponse.json({ error: "invalid parent" }, { status: 400 });
    }
    if (parent.parentId !== null) {
      return NextResponse.json({ error: "nested replies not allowed" }, { status: 400 });
    }
  }

  const { id: commentId } = await prisma.comment.create({
    data: { postId, content, guestName: null, authorId: userId, parentId, isSecret },
    select: { id: true },
  });

  // 알림 생성 (자신의 글/댓글에는 알림 안 보냄)
  if (parentId) {
    // 스레드 참여자 전원 조회: 최상위 댓글 작성자 + 기존 답글 작성자
    const [parentComment, existingReplies] = await Promise.all([
      prisma.comment.findUnique({ where: { id: parentId }, select: { authorId: true } }),
      prisma.comment.findMany({ where: { parentId }, select: { authorId: true } }),
    ]);

    const recipientIds = new Set<number>();
    if (parentComment?.authorId && parentComment.authorId !== userId) {
      recipientIds.add(parentComment.authorId);
    }
    for (const r of existingReplies) {
      if (r.authorId && r.authorId !== userId) recipientIds.add(r.authorId);
    }

    for (const recipientId of recipientIds) {
      await prisma.notification.create({
        data: { userId: recipientId, actorId: userId, type: "REPLY", postId, commentId },
      });
    }
  } else if (post.authorId !== userId) {
    await prisma.notification.create({
      data: { userId: post.authorId, actorId: userId, type: "COMMENT", postId, commentId },
    });
  }

  const comment = await prisma.comment.findUnique({
    where: { id: commentId },
    select: REPLY_SELECT,
  });

  return NextResponse.json(comment, { status: 201 });
}
