import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUserId } from "@/lib/auth";

const PAGE_SIZE = 10;

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const category = searchParams.get("category") ?? "";
  const q = searchParams.get("q") ?? "";
  const page = Math.max(1, Number(searchParams.get("page") ?? "1"));

  const where = {
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
      include: {
        author: { select: { id: true, nickname: true, name: true, avatarUrl: true } },
        _count: { select: { comments: true, likes: true } },
      },
    }),
  ]);

  return NextResponse.json({ posts, total, page, pageSize: PAGE_SIZE });
}

export async function POST(req: NextRequest) {
  try {
    const userId = await getSessionUserId();
    if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

    const { title, category, content } = await req.json();
    if (!title?.trim() || !content?.trim() || !["자유", "문의"].includes(category)) {
      return NextResponse.json({ error: "invalid" }, { status: 400 });
    }

    const created = await prisma.communityPost.create({
      data: {
        title: title.trim().slice(0, 200),
        category,
        content,
        authorId: userId,
      },
    });

    const post = await prisma.communityPost.findUnique({
      where: { id: created.id },
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
