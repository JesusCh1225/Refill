import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUserId } from "@/lib/auth";

export async function GET() {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const all = await prisma.message.findMany({
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
  });

  const map = new Map<number, {
    partner: { id: number; name: string; nickname: string | null; avatarUrl: string | null };
    lastMessage: { content: string; createdAt: string; isFromMe: boolean };
    unreadCount: number;
  }>();

  for (const msg of all) {
    const isFromMe = msg.senderId === userId;
    const partnerId = isFromMe ? msg.receiverId : msg.senderId;
    const partner = isFromMe ? msg.receiver : msg.sender;
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

  const conversations = Array.from(map.values());
  const totalUnread = conversations.reduce((s, c) => s + c.unreadCount, 0);
  return NextResponse.json({ conversations, totalUnread });
}
