import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUserId } from "@/lib/auth";

async function getIds(params: Promise<{ id: string }>) {
  const myId = await getSessionUserId();
  if (!myId) return null;
  const targetId = Number((await params).id);
  if (isNaN(targetId) || targetId === myId) return null;
  return { myId, targetId };
}

// GET /api/users/[id]/block — 차단 여부 확인
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const ids = await getIds(params);
  if (!ids) return NextResponse.json({ blocked: false });

  const block = await prisma.userBlock.findUnique({
    where: { blockerId_blockedId: { blockerId: ids.myId, blockedId: ids.targetId } },
    select: { blockerId: true },
  });

  return NextResponse.json({ blocked: !!block });
}

// POST /api/users/[id]/block — 차단
export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const ids = await getIds(params);
  if (!ids) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  await prisma.userBlock.upsert({
    where: { blockerId_blockedId: { blockerId: ids.myId, blockedId: ids.targetId } },
    create: { blockerId: ids.myId, blockedId: ids.targetId },
    update: {},
  });

  return NextResponse.json({ ok: true });
}

// DELETE /api/users/[id]/block — 차단 해제
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const ids = await getIds(params);
  if (!ids) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  await prisma.userBlock.deleteMany({
    where: { blockerId: ids.myId, blockedId: ids.targetId },
  });

  return NextResponse.json({ ok: true });
}
