import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUserId } from "@/lib/auth";

// PATCH /api/messages/[userId]/leave — 채팅방 나가기
export async function PATCH(
  _req: NextRequest,
  { params }: { params: Promise<{ userId: string }> },
) {
  const myId = await getSessionUserId();
  if (!myId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const partnerId = Number((await params).userId);
  if (isNaN(partnerId)) return NextResponse.json({ error: "invalid" }, { status: 400 });

  await prisma.conversationLeft.upsert({
    where: { userId_partnerId: { userId: myId, partnerId } },
    create: { userId: myId, partnerId, leftAt: new Date() },
    update: { leftAt: new Date() },
  });

  return NextResponse.json({ ok: true });
}
