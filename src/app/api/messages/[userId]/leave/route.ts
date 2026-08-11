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

  // upsert()는 Neon HTTP 어댑터에서 트랜잭션을 사용해 500을 반환함 → raw SQL로 대체
  await prisma.$executeRaw`
    INSERT INTO "ConversationLeft" ("userId", "partnerId", "leftAt")
    VALUES (${myId}, ${partnerId}, NOW())
    ON CONFLICT ("userId", "partnerId") DO UPDATE SET "leftAt" = NOW()
  `;

  return NextResponse.json({ ok: true });
}
