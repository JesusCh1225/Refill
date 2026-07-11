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

    // commentId로 댓글 내용 별도 조회 (Notification 모델에 comment 관계 없음)
    const commentIds = notifications
      .map((n) => n.commentId)
      .filter((id): id is number => id !== null);

    const commentMap = new Map<number, { content: string | null; isSecret: boolean }>();
    if (commentIds.length > 0) {
      const comments = await prisma.comment.findMany({
        where: { id: { in: commentIds } },
        select: { id: true, content: true, isSecret: true },
      });
      for (const c of comments) commentMap.set(c.id, { content: c.content, isSecret: c.isSecret });
    }

    const result = notifications.map((n) => ({
      ...n,
      comment: n.commentId ? (commentMap.get(n.commentId) ?? null) : null,
    }));

    return NextResponse.json({ notifications: result, unreadCount });
  } catch (err: unknown) {
    console.error("[GET /api/notifications]", err);
    return NextResponse.json({ error: "internal server error" }, { status: 500 });
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
    return NextResponse.json({ error: "internal server error" }, { status: 500 });
  }
}
