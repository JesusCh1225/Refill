import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUserId } from "@/lib/auth";

// GET /api/profile/blocks — 내가 차단한 사용자 목록
export async function GET() {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const blocks = await prisma.userBlock.findMany({
    where: { blockerId: userId },
    orderBy: { createdAt: "desc" },
    include: {
      blocked: { select: { id: true, name: true, nickname: true, avatarUrl: true } },
    },
  });

  return NextResponse.json(blocks.map((b) => b.blocked));
}
