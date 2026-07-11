import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAdminSession } from "@/lib/admin";

const PAGE_SIZE = 20;

export async function GET(req: NextRequest) {
  if (!(await isAdminSession()))
    return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const page = Math.max(1, Number(new URL(req.url).searchParams.get("page") ?? "1"));

  const [total, users] = await Promise.all([
    prisma.user.count(),
    prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      select: {
        id: true,
        name: true,
        email: true,
        nickname: true,
        avatarUrl: true,
        createdAt: true,
        _count: { select: { communityPosts: true, posts: true } },
      },
    }),
  ]);

  return NextResponse.json({ users, total, page, pageSize: PAGE_SIZE });
}
