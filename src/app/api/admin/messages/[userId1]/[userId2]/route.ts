import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAdminSession } from "@/lib/admin";

// GET /api/admin/messages/[userId1]/[userId2]
// 두 사용자 간 전체 채팅 로그
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ userId1: string; userId2: string }> },
) {
  if (!(await isAdminSession()))
    return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const { userId1, userId2 } = await params;
  const id1 = Number(userId1);
  const id2 = Number(userId2);
  if (isNaN(id1) || isNaN(id2))
    return NextResponse.json({ error: "invalid" }, { status: 400 });

  const [messages, user1, user2] = await Promise.all([
    prisma.message.findMany({
      where: {
        OR: [
          { senderId: id1, receiverId: id2 },
          { senderId: id2, receiverId: id1 },
        ],
      },
      orderBy: { createdAt: "asc" },
      take: 2000,
      select: {
        id: true,
        content: true,
        createdAt: true,
        senderId: true,
        isRead: true,
      },
    }),
    prisma.user.findUnique({
      where: { id: id1 },
      select: { id: true, name: true, nickname: true, avatarUrl: true, email: true },
    }),
    prisma.user.findUnique({
      where: { id: id2 },
      select: { id: true, name: true, nickname: true, avatarUrl: true, email: true },
    }),
  ]);

  return NextResponse.json({
    user1,
    user2,
    messages: messages.map((m) => ({ ...m, createdAt: m.createdAt.toISOString() })),
  });
}
