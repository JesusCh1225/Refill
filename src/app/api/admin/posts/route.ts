import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAdminSession } from "@/lib/admin";

const PAGE_SIZE = 20;

export async function GET(req: NextRequest) {
  if (!(await isAdminSession()))
    return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type") ?? "community";
  const page = Math.max(1, Number(searchParams.get("page") ?? "1"));

  if (type === "map") {
    const [total, posts] = await Promise.all([
      prisma.post.count({ where: { status: { not: "DELETED" } } }),
      prisma.post.findMany({
        where: { status: { not: "DELETED" } },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * PAGE_SIZE,
        take: PAGE_SIZE,
        select: {
          id: true,
          title: true,
          location: true,
          status: true,
          createdAt: true,
          author: { select: { id: true, nickname: true, name: true, email: true } },
          categories: { select: { category: { select: { name: true } } } },
          _count: { select: { comments: true } },
        },
      }),
    ]);
    return NextResponse.json({ posts, total, page, pageSize: PAGE_SIZE });
  }

  // community (default)
  const [total, posts] = await Promise.all([
    prisma.communityPost.count(),
    prisma.communityPost.findMany({
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: {
        author: { select: { id: true, nickname: true, name: true, email: true } },
        _count: { select: { comments: true } },
      },
    }),
  ]);

  return NextResponse.json({ posts, total, page, pageSize: PAGE_SIZE });
}
