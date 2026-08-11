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

  // upsert()는 Neon HTTP 어댑터에서 트랜잭션을 사용해 500을 반환함 → raw SQL로 대체
  await prisma.$executeRaw`
    INSERT INTO "UserBlock" ("blockerId", "blockedId", "createdAt")
    VALUES (${ids.myId}, ${ids.targetId}, NOW())
    ON CONFLICT ("blockerId", "blockedId") DO NOTHING
  `;

  return NextResponse.json({ ok: true });
}

// DELETE /api/users/[id]/block — 차단 해제
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const ids = await getIds(params);
  if (!ids) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  try {
    await prisma.userBlock.delete({
      where: { blockerId_blockedId: { blockerId: ids.myId, blockedId: ids.targetId } },
    });
  } catch { /* 이미 차단 해제된 경우 무시 */ }

  return NextResponse.json({ ok: true });
}
