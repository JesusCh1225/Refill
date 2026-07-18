import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUserId } from "@/lib/auth";

export async function PATCH(
  _req: NextRequest,
  { params }: { params: Promise<{ userId: string }> },
) {
  const myId = await getSessionUserId();
  if (!myId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const partnerId = Number((await params).userId);
  if (isNaN(partnerId)) return NextResponse.json({ error: "invalid id" }, { status: 400 });

  await prisma.$executeRaw`
    UPDATE "Message"
    SET "isRead" = true
    WHERE "senderId" = ${partnerId} AND "receiverId" = ${myId} AND "isRead" = false
  `;

  return NextResponse.json({ ok: true });
}
