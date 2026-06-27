import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const userId = Number((await params).id);
  if (isNaN(userId)) return NextResponse.json({ error: "invalid id" }, { status: 400 });

  const [user, reviewStats] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        nickname: true,
        avatarUrl: true,
        bio: true,
        contact: true,
        representativeSong: true,
        createdAt: true,
        posts: {
          where: { status: "PUBLISHED" },
          orderBy: { createdAt: "desc" },
          take: 6,
          select: {
            id: true,
            title: true,
            priceDisplay: true,
            imageEmoji: true,
            location: true,
            createdAt: true,
            direction: true,
            categories: { select: { category: { select: { name: true } } } },
          },
        },
        reviewsReceived: {
          orderBy: { createdAt: "desc" },
          take: 10,
          select: {
            id: true,
            rating: true,
            content: true,
            createdAt: true,
            postId: true,
            reviewer: { select: { id: true, name: true, nickname: true, avatarUrl: true } },
          },
        },
      },
    }),
    prisma.review.aggregate({
      where: { revieweeId: userId },
      _avg: { rating: true },
      _count: { _all: true },
    }),
  ]);

  if (!user) return NextResponse.json({ error: "not found" }, { status: 404 });

  const avgRating = reviewStats._avg.rating
    ? Math.round(reviewStats._avg.rating * 10) / 10
    : null;

  return NextResponse.json({ ...user, avgRating, reviewCount: reviewStats._count._all });
}
