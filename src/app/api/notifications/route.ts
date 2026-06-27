import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUserId } from "@/lib/auth";

const NOTIFICATION_SELECT = {
  id: true,
  type: true,
  isRead: true,
  createdAt: true,
  postId: true,
  commentId: true,
  actor: { select: { id: true, name: true, nickname: true, avatarUrl: true } },
  post: { select: { title: true } },
  comment: { select: { content: true, isSecret: true } },
} as const;

// GET /api/notifications — 내 알림 목록
export async function GET() {
  try {
    const userId = await getSessionUserId();
    if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

    const [notifications, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        take: 50,
        select: NOTIFICATION_SELECT,
      }),
      prisma.notification.count({ where: { userId, isRead: false } }),
    ]);

    return NextResponse.json({ notifications, unreadCount });
  } catch (err: unknown) {
    console.error("[GET /api/notifications]", err);
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

// PATCH /api/notifications — 전체 읽음 처리
export async function PATCH() {
  try {
    const userId = await getSessionUserId();
    if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

    await prisma.$executeRaw`UPDATE "Notification" SET "isRead" = true WHERE "userId" = ${userId} AND "isRead" = false`;

    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    console.error("[PATCH /api/notifications]", err);
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
