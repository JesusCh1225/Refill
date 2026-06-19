import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { POST_SELECT, mapPost } from "@/lib/postMapper";
import { getSessionUserId } from "@/lib/auth";

// GET /api/bookmarks         → postId 배열 (useBookmarks 훅용)
// GET /api/bookmarks?full=1  → 전체 게시글 데이터 (프로필 북마크 탭용)
export async function GET(req: NextRequest) {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json([]);

  const full = req.nextUrl.searchParams.get("full") === "1";

  if (full) {
    const bookmarks = await prisma.bookmark.findMany({
      where: { userId, post: { status: "PUBLISHED" } },
      orderBy: { createdAt: "desc" },
      select: { post: { select: POST_SELECT } },
    });
    return NextResponse.json(bookmarks.map((b) => mapPost(b.post)));
  }

  const rows = await prisma.bookmark.findMany({
    where: { userId },
    select: { postId: true },
  });
  return NextResponse.json(rows.map((r) => r.postId));
}
