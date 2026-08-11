import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUserId } from "@/lib/auth";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const userId = await getSessionUserId();
    if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

    const postId = Number((await params).id);
    if (isNaN(postId)) return NextResponse.json({ error: "invalid" }, { status: 400 });

    const existing = await prisma.communityLike.findUnique({
      where: { userId_postId: { userId, postId } },
    });

    if (existing) {
      try {
        await prisma.communityLike.delete({ where: { userId_postId: { userId, postId } } });
      } catch { /* 동시 요청으로 이미 삭제됨 — 무시 */ }
      const count = await prisma.communityLike.count({ where: { postId } });
      return NextResponse.json({ liked: false, count });
    } else {
      try {
        await prisma.communityLike.create({ data: { userId, postId } });
      } catch (e: any) {
        if (e.code !== "P2002") throw e; // P2002 = 동시 요청으로 이미 생성됨 — 무시
      }
      const count = await prisma.communityLike.count({ where: { postId } });
      return NextResponse.json({ liked: true, count });
    }
  } catch (err) {
    console.error("[POST /api/community/[id]/like]", err);
    return NextResponse.json({ error: "internal" }, { status: 500 });
  }
}
