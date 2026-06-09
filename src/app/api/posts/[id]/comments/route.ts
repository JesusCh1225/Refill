import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

const COMMENT_SELECT = {
  id: true,
  content: true,
  guestName: true,
  authorId: true,
  createdAt: true,
  updatedAt: true,
  author: { select: { name: true, nickname: true } },
} as const;

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const postId = Number((await params).id);
  if (isNaN(postId)) return NextResponse.json({ error: "invalid id" }, { status: 400 });

  const comments = await prisma.comment.findMany({
    where: { postId },
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

  const session = await auth();
  const userId = (session?.user as any)?.id as number | undefined;

  const body = await req.json();
  const content = (body.content ?? "").trim();
  if (!content) return NextResponse.json({ error: "content required" }, { status: 400 });
  if (content.length > 500) return NextResponse.json({ error: "too long" }, { status: 400 });

  const post = await prisma.post.findUnique({ where: { id: postId }, select: { id: true } });
  if (!post) return NextResponse.json({ error: "post not found" }, { status: 404 });

  // 로그인 유저: authorId 세팅, guestName 없음
  // 비로그인 유저: guestName 사용
  const guestName = userId ? null : ((body.guestName ?? "").trim().slice(0, 20) || "익명");

  const { id: commentId } = await prisma.comment.create({
    data: { postId, content, guestName, authorId: userId ?? null },
    select: { id: true },
  });

  const comment = await prisma.comment.findUnique({
    where: { id: commentId },
    select: COMMENT_SELECT,
  });

  return NextResponse.json(comment, { status: 201 });
}
