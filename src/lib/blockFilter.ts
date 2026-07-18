import { prisma } from "@/lib/prisma";

/** 현재 유저가 차단한 사용자 ID 목록 반환. 미로그인이면 빈 배열. */
export async function getBlockedIds(userId: number | null | undefined): Promise<number[]> {
  if (!userId) return [];
  const blocks = await prisma.userBlock.findMany({
    where: { blockerId: userId },
    select: { blockedId: true },
  });
  return blocks.map((b) => b.blockedId);
}
