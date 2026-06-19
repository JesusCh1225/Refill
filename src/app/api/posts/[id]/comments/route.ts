import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUserId } from "@/lib/auth";

const REPLY_SELECT = {
  id: true,
  content: true,
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

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const postId = Number((await params).id);
  if (isNaN(postId)) return NextResponse.json({ error: "invalid id" }, { status: 400 });

  const comments = await prisma.comment.findMany({
    where: { postId, parentId: null }, // 최상위 댓글만
    orderBy: { createdAt: "asc" },
    select: COMMENT_SELECT,
  });

  return NextResponse.json(comments);
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

  const post = await prisma.post.findUnique({ where: { id: postId }, select: { id: true } });
  if (!post) return NextResponse.json({ error: "post not found" }, { status: 404 });

  // 대댓글인 경우 parentId 검증
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
    data: { postId, content, guestName: null, authorId: userId, parentId },
    select: { id: true },
  });

  const comment = await prisma.comment.findUnique({
    where: { id: commentId },
    select: REPLY_SELECT,
  });

  return NextResponse.json(comment, { status: 201 });
}
