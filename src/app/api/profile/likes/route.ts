import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUserId } from "@/lib/auth";

export async function GET() {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const likes = await prisma.communityLike.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    select: {
      createdAt: true,
      post: {
        select: {
          id: true,
          title: true,
          category: true,
          createdAt: true,
          _count: { select: { comments: true, likes: true } },
        },
      },
    },
  });

  return NextResponse.json(
    likes.map((l) => ({ ...l.post, likedAt: l.createdAt })),
  );
}
