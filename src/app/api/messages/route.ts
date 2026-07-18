import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUserId } from "@/lib/auth";

export async function GET() {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const [all, blocks, leftConvs] = await Promise.all([
    prisma.message.findMany({
      where: { OR: [{ senderId: userId }, { receiverId: userId }] },
      orderBy: { createdAt: "desc" },
      take: 500,
      select: {
        id: true,
        content: true,
        isRead: true,
        createdAt: true,
        senderId: true,
        receiverId: true,
        sender: { select: { id: true, name: true, nickname: true, avatarUrl: true } },
        receiver: { select: { id: true, name: true, nickname: true, avatarUrl: true } },
      },
    }),
    prisma.userBlock.findMany({
      where: { OR: [{ blockerId: userId }, { blockedId: userId }] },
      select: { blockerId: true, blockedId: true },
    }),
    prisma.conversationLeft.findMany({
      where: { userId },
      select: { partnerId: true, leftAt: true },
    }),
  ]);

  const blockedIds = new Set(
    blocks.map((b) => (b.blockerId === userId ? b.blockedId : b.blockerId)),
  );
  const leftMap = new Map(leftConvs.map((c) => [c.partnerId, c.leftAt]));

  const map = new Map<number, {
    partner: { id: number; name: string; nickname: string | null; avatarUrl: string | null };
    lastMessage: { content: string; createdAt: string; isFromMe: boolean };
    unreadCount: number;
  }>();

  for (const msg of all) {
    const isFromMe = msg.senderId === userId;
    const partnerId = isFromMe ? msg.receiverId : msg.senderId;
    const partner = isFromMe ? msg.receiver : msg.sender;
    if (blockedIds.has(partnerId)) continue;
    if (!map.has(partnerId)) {
      map.set(partnerId, {
        partner,
        lastMessage: { content: msg.content, createdAt: msg.createdAt.toISOString(), isFromMe },
        unreadCount: 0,
      });
    }
    if (!msg.isRead && msg.receiverId === userId) {
      map.get(partnerId)!.unreadCount++;
    }
  }

  // 채팅방 나간 경우: 나간 후 새 메시지가 없으면 숨김
  const conversations = Array.from(map.entries())
    .filter(([partnerId, conv]) => {
      const leftAt = leftMap.get(partnerId);
      if (!leftAt) return true;
      return new Date(conv.lastMessage.createdAt) > leftAt;
    })
    .map(([, conv]) => conv);

  const totalUnread = conversations.reduce((s, c) => s + c.unreadCount, 0);
  return NextResponse.json({ conversations, totalUnread });
}
