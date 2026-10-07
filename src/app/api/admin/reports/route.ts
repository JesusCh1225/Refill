import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAdminSession } from "@/lib/admin";

const PAGE_SIZE = 20;

export async function GET(req: NextRequest) {
  if (!(await isAdminSession()))
    return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status") ?? "PENDING";
  const page = Math.max(1, Number(searchParams.get("page") ?? "1"));

  const where = status === "ALL" ? {} : { status: status as "PENDING" | "RESOLVED" | "DISMISSED" };

  const [total, reports] = await Promise.all([
    prisma.report.count({ where }),
    prisma.report.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      select: {
        id: true,
        reason: true,
        status: true,
        createdAt: true,
        reporter: { select: { id: true, name: true, nickname: true } },
        post: { select: { id: true, title: true } },
        communityPost: { select: { id: true, title: true } },
      },
    }),
  ]);

  return NextResponse.json({ reports, total, page, pageSize: PAGE_SIZE });
}
