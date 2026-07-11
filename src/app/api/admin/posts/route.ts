import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAdminSession } from "@/lib/admin";

const PAGE_SIZE = 20;

export async function GET(req: NextRequest) {
  if (!(await isAdminSession()))
    return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const page = Math.max(1, Number(new URL(req.url).searchParams.get("page") ?? "1"));

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
