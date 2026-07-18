import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUserId } from "@/lib/auth";

const REVIEWS_PAGE_SIZE = 10;

// GET /api/users/[id]/reviews?skip=N — 받은 리뷰 목록 (페이지네이션)
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const revieweeId = Number((await params).id);
  if (isNaN(revieweeId)) return NextResponse.json({ error: "invalid id" }, { status: 400 });

  const skip = Math.max(0, Number(new URL(req.url).searchParams.get("skip") ?? "0"));

  const reviews = await prisma.review.findMany({
    where: { revieweeId },
    orderBy: { createdAt: "desc" },
    skip,
    take: REVIEWS_PAGE_SIZE,
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
  const rawContent = (body.content ?? "").trim();
  if (rawContent.length > 1000) return NextResponse.json({ error: "too long" }, { status: 400 });
  const content = rawContent || null;
  const postId = body.postId ? Number(body.postId) : null;

  if (!rating || rating < 1 || rating > 5) {
    return NextResponse.json({ error: "rating must be 1–5" }, { status: 400 });
  }

  // 소통 여부 확인: 댓글 또는 채팅 이력 중 하나라도 있으면 허용
  const [commentInteraction, messageInteraction] = await Promise.all([
    prisma.comment.findFirst({
      where: { authorId: reviewerId, post: { authorId: revieweeId } },
      select: { id: true },
    }),
    prisma.message.findFirst({
      where: {
        OR: [
          { senderId: reviewerId, receiverId: revieweeId },
          { senderId: revieweeId, receiverId: reviewerId },
        ],
      },
      select: { id: true },
    }),
  ]);

  if (!commentInteraction && !messageInteraction) {
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

  try {
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
  } catch (e: unknown) {
    const code = (e as { code?: string })?.code;
    if (code === "P2002") return NextResponse.json({ error: "이미 리뷰를 남겼어요." }, { status: 409 });
    throw e;
  }
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
