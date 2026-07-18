import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { POST_SELECT, mapPost, timeAgo } from "@/lib/postMapper";
import { getSessionUserId } from "@/lib/auth";

// GET /api/profile/posts — 내가 작성한 글 목록 (음악맵 + 커뮤니티)
export async function GET() {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const [mapPosts, communityPosts] = await Promise.all([
    prisma.post.findMany({
      where: { authorId: userId, status: { not: "DELETED" as any } },
      orderBy: { createdAt: "desc" },
      take: 50,
      select: POST_SELECT,
    }),
    prisma.communityPost.findMany({
      where: { authorId: userId },
      orderBy: { createdAt: "desc" },
      take: 50,
      select: { id: true, title: true, category: true, createdAt: true },
    }),
  ]);

  const combined = [
    ...mapPosts.map((p) => {
      const m = mapPost(p);
      return {
        type: "map" as const,
        id: m.id,
        title: m.title,
        imageEmoji: m.imageEmoji,
        location: m.location,
        price: m.price,
        timeAgo: m.timeAgo,
        createdAt: p.createdAt.toISOString(),
      };
    }),
    ...communityPosts.map((p) => ({
      type: "community" as const,
      id: p.id,
      title: p.title,
      category: p.category,
      timeAgo: timeAgo(p.createdAt),
      createdAt: p.createdAt.toISOString(),
    })),
  ];

  combined.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return NextResponse.json(combined);
}
