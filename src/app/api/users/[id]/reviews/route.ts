import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUserId } from "@/lib/auth";

// GET /api/users/[id]/reviews — 받은 리뷰 목록
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const revieweeId = Number((await params).id);
  if (isNaN(revieweeId)) return NextResponse.json({ error: "invalid id" }, { status: 400 });

  const reviews = await prisma.review.findMany({
    where: { revieweeId },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      rating: true,
      content: true,
      createdAt: true,
      postId: true,
      reviewer: { select: { id: true, name: true, nickname: true, avatarUrl: true } },
    },
  });

  return NextResponse.json(reviews);
}

// POST /api/users/[id]/reviews — 리뷰 작성
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const reviewerId = await getSessionUserId();
  if (!reviewerId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const revieweeId = Number((await params).id);
  if (isNaN(revieweeId)) return NextResponse.json({ error: "invalid id" }, { status: 400 });
  if (reviewerId === revieweeId) return NextResponse.json({ error: "self review not allowed" }, { status: 400 });

  const body = await req.json();
  const rating = Number(body.rating);
  const content = (body.content ?? "").trim() || null;
  const postId = body.postId ? Number(body.postId) : null;

  if (!rating || rating < 1 || rating > 5) {
    return NextResponse.json({ error: "rating must be 1–5" }, { status: 400 });
  }

  // 소통 여부 확인: 리뷰어가 리뷰이의 게시글에 댓글을 달았는지 확인
  const interacted = await prisma.comment.findFirst({
    where: {
      authorId: reviewerId,
      post: { authorId: revieweeId },
    },
    select: { id: true },
  });

  if (!interacted) {
    return NextResponse.json(
      { error: "직접 소통한 이력이 없는 사용자에게는 리뷰를 남길 수 없어요." },
      { status: 403 },
    );
  }

  // 중복 확인 (같은 postId 기준)
  const existing = await prisma.review.findFirst({
    where: { reviewerId, revieweeId, postId },
    select: { id: true },
  });
  if (existing) {
    return NextResponse.json({ error: "이미 리뷰를 남겼어요." }, { status: 409 });
  }

  const review = await prisma.review.create({
    data: { reviewerId, revieweeId, rating, content, postId },
    select: {
      id: true,
      rating: true,
      content: true,
      createdAt: true,
      postId: true,
      reviewer: { select: { id: true, name: true, nickname: true, avatarUrl: true } },
    },
  });

  return NextResponse.json(review, { status: 201 });
}

// DELETE /api/users/[id]/reviews?reviewId=X
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const reviewerId = await getSessionUserId();
  if (!reviewerId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const revieweeId = Number((await params).id);
  const reviewId = Number(new URL(req.url).searchParams.get("reviewId"));
  if (isNaN(reviewId)) return NextResponse.json({ error: "invalid reviewId" }, { status: 400 });

  const review = await prisma.review.findUnique({ where: { id: reviewId }, select: { reviewerId: true } });
  if (!review || review.reviewerId !== reviewerId) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  await prisma.review.delete({ where: { id: reviewId } });
  return NextResponse.json({ ok: true });
}
