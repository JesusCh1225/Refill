import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUserId } from "@/lib/auth";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ userId: string }> },
) {
  const myId = await getSessionUserId();
  if (!myId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const partnerId = Number((await params).userId);
  if (isNaN(partnerId)) return NextResponse.json({ error: "invalid id" }, { status: 400 });

  const url = new URL(req.url);
  const since = Number(url.searchParams.get("since") ?? "0");

  const [messages, partner] = await Promise.all([
    prisma.message.findMany({
      where: {
        OR: [
          { senderId: myId, receiverId: partnerId },
          { senderId: partnerId, receiverId: myId },
        ],
        ...(since > 0 ? { id: { gt: since } } : {}),
      },
      orderBy: { createdAt: "asc" },
      take: 100,
      select: { id: true, content: true, createdAt: true, senderId: true },
    }),
    prisma.user.findUnique({
      where: { id: partnerId },
      select: { id: true, name: true, nickname: true, avatarUrl: true },
    }),
  ]);

  if (!partner) return NextResponse.json({ error: "user not found" }, { status: 404 });

  return NextResponse.json({
    messages: messages.map((m) => ({
      ...m,
      createdAt: m.createdAt.toISOString(),
      isFromMe: m.senderId === myId,
    })),
    partner,
  });
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ userId: string }> },
) {
  const myId = await getSessionUserId();
  if (!myId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const partnerId = Number((await params).userId);
  if (isNaN(partnerId) || partnerId === myId)
    return NextResponse.json({ error: "invalid" }, { status: 400 });

  const { content } = await req.json();
  if (!content?.trim()) return NextResponse.json({ error: "empty" }, { status: 400 });
  if (content.trim().length > 1000)
    return NextResponse.json({ error: "too long" }, { status: 400 });

  const msg = await prisma.message.create({
    data: { content: content.trim(), senderId: myId, receiverId: partnerId },
    select: { id: true, content: true, createdAt: true, senderId: true },
  });

  return NextResponse.json({
    ...msg,
    createdAt: msg.createdAt.toISOString(),
    isFromMe: true,
  }, { status: 201 });
}
