import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAdminSession } from "@/lib/admin";

const PAGE_SIZE = 20;

// GET /api/admin/messages?page=1&q=
// 전체 대화 목록 (사용자 이름/이메일 검색 가능)
export async function GET(req: NextRequest) {
  if (!(await isAdminSession()))
    return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const page = Math.max(1, Number(searchParams.get("page") ?? "1"));
  const q = (searchParams.get("q") ?? "").trim();

  // 검색어가 있으면 해당 사용자 ID만 필터
  let userIdFilter: number[] | null = null;
  if (q) {
    const matched = await prisma.user.findMany({
      where: {
        OR: [
          { name: { contains: q, mode: "insensitive" } },
          { nickname: { contains: q, mode: "insensitive" } },
          { email: { contains: q, mode: "insensitive" } },
        ],
      },
      select: { id: true },
      take: 200,
    });
    userIdFilter = matched.map((u) => u.id);
    if (userIdFilter.length === 0)
      return NextResponse.json({ conversations: [], total: 0, page, pageSize: PAGE_SIZE });
  }

  const messages = await prisma.message.findMany({
    where: userIdFilter
      ? { OR: [{ senderId: { in: userIdFilter } }, { receiverId: { in: userIdFilter } }] }
      : {},
    orderBy: { createdAt: "desc" },
    take: 10_000,
    select: {
      id: true,
      content: true,
      createdAt: true,
      senderId: true,
      receiverId: true,
      sender: { select: { id: true, name: true, nickname: true, email: true, avatarUrl: true } },
      receiver: { select: { id: true, name: true, nickname: true, email: true, avatarUrl: true } },
    },
  });

  // 사용자 쌍별로 그룹핑 (senderId < receiverId 기준)
  const pairMap = new Map<string, {
    user1: typeof messages[0]["sender"];
    user2: typeof messages[0]["receiver"];
    lastMessage: string;
    latestAt: string;
    count: number;
  }>();

  for (const msg of messages) {
    const isAsc = msg.senderId < msg.receiverId;
    const u1 = isAsc ? msg.sender : msg.receiver;
    const u2 = isAsc ? msg.receiver : msg.sender;
    const key = `${Math.min(msg.senderId, msg.receiverId)}-${Math.max(msg.senderId, msg.receiverId)}`;
    if (!pairMap.has(key)) {
      pairMap.set(key, {
        user1: u1,
        user2: u2,
        lastMessage: msg.content,
        latestAt: msg.createdAt.toISOString(),
        count: 1,
      });
    } else {
      pairMap.get(key)!.count++;
    }
  }

  const all = Array.from(pairMap.values());
  const total = all.length;
  const conversations = all.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return NextResponse.json({ conversations, total, page, pageSize: PAGE_SIZE });
}
