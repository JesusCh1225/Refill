import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUserId } from "@/lib/auth";
import { sanitizePostContent } from "@/lib/sanitize";
import { getBlockedIds } from "@/lib/blockFilter";

const MAX_CONTENT_LENGTH = 50_000;

const PAGE_SIZE = 10;

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const category = searchParams.get("category") ?? "";
  const q = searchParams.get("q") ?? "";
  const page = Math.max(1, Number(searchParams.get("page") ?? "1"));

  const userId = await getSessionUserId();
  const blockedIds = await getBlockedIds(userId);

  const where = {
    ...(blockedIds.length > 0 ? { authorId: { notIn: blockedIds } } : {}),
    ...(category ? { category } : {}),
    ...(q ? {
      OR: [
        { title: { contains: q, mode: "insensitive" as const } },
        { content: { contains: q, mode: "insensitive" as const } },
      ],
    } : {}),
  };

  const [total, posts] = await Promise.all([
    prisma.communityPost.count({ where }),
    prisma.communityPost.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      select: {
        id: true,
        title: true,
        category: true,
        content: true,
        createdAt: true,
        updatedAt: true,
        author: { select: { id: true, nickname: true, name: true, avatarUrl: true } },
        _count: { select: { comments: true, likes: true } },
      },
    }),
  ]);

  // 목록에서는 content를 미리보기용 120자로 잘라서 반환 (전체 HTML 전송 방지)
  const trimmedPosts = posts.map((p) => ({
    ...p,
    content: p.content.replace(/<[^>]*>/g, "").slice(0, 120),
  }));

  return NextResponse.json({ posts: trimmedPosts, total, page, pageSize: PAGE_SIZE });
}

export async function POST(req: NextRequest) {
  try {
    const userId = await getSessionUserId();
    if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

    let body: any;
    try { body = await req.json(); } catch { return NextResponse.json({ error: "invalid body" }, { status: 400 }); }
    const { title, category, content } = body;
    if (!title?.trim() || !content?.trim() || !["자유", "문의"].includes(category)) {
      return NextResponse.json({ error: "invalid" }, { status: 400 });
    }
    if (content.length > MAX_CONTENT_LENGTH) {
      return NextResponse.json({ error: "content too long" }, { status: 400 });
    }

    const clean = sanitizePostContent(content);

    const post = await prisma.communityPost.create({
      data: {
        title: title.trim().slice(0, 200),
        category,
        content: clean,
        authorId: userId,
      },
      include: {
        author: { select: { id: true, nickname: true, name: true, avatarUrl: true } },
      },
    });

    return NextResponse.json(post, { status: 201 });
  } catch (err) {
    console.error("[POST /api/community]", err);
    return NextResponse.json({ error: "internal" }, { status: 500 });
  }
}
