import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUserId } from "@/lib/auth";

// PATCH /api/notifications/[id] — 단건 읽음 처리
export async function PATCH(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const userId = await getSessionUserId();
    if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

    const id = Number((await params).id);
    if (isNaN(id)) return NextResponse.json({ error: "invalid id" }, { status: 400 });

    await prisma.$executeRaw`UPDATE "Notification" SET "isRead" = true WHERE id = ${id} AND "userId" = ${userId}`;

    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    console.error("[PATCH /api/notifications/[id]]", err);
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
