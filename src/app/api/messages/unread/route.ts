import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUserId } from "@/lib/auth";

export async function GET() {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ count: 0 });

  const count = await prisma.message.count({
    where: { receiverId: userId, isRead: false },
  });
  return NextResponse.json({ count });
}
