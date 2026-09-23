import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAdminSession } from "@/lib/admin";

type Target = "posts" | "community" | "messages" | "reviews" | "reports" | "notifications" | "users";

export async function POST(req: NextRequest) {
  if (!(await isAdminSession()))
    return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const body = await req.json().catch(() => ({}));
  const targets = new Set<Target>(body.targets ?? []);

  if (targets.size === 0)
    return NextResponse.json({ error: "targets required" }, { status: 400 });

  const has = (t: Target) => targets.has(t);
  const deleted: Record<string, number> = {};

  // ── 1. 알림 ─────────────────────────────────────────────────
  // posts/community 삭제 시 cascade로 자동 삭제되지만, 단독 선택도 지원
  if (has("notifications") || has("posts") || has("community") || has("users")) {
    const r = await prisma.notification.deleteMany({});
    deleted.notifications = r.count;
  }

  // ── 2. 신고 ─────────────────────────────────────────────────
  if (has("reports") || has("posts") || has("community") || has("users")) {
    const r = await prisma.report.deleteMany({});
    deleted.reports = r.count;
  }

  // ── 3. 리뷰 ─────────────────────────────────────────────────
  if (has("reviews") || has("users")) {
    const r = await prisma.review.deleteMany({});
    deleted.reviews = r.count;
  }

  // ── 4. 메시지·채팅 ──────────────────────────────────────────
  if (has("messages") || has("users")) {
    const m = await prisma.message.deleteMany({});
    const c = await prisma.conversationLeft.deleteMany({});
    deleted.messages = m.count;
    deleted.conversationLeft = c.count;
  }

  // ── 5. 커뮤니티 ─────────────────────────────────────────────
  if (has("community") || has("users")) {
    await prisma.communityComment.deleteMany({ where: { parentId: { not: null } } });
    const cc = await prisma.communityComment.deleteMany({});
    const cl = await prisma.communityLike.deleteMany({});
    const cp = await prisma.communityPost.deleteMany({});
    deleted.communityComments = cc.count;
    deleted.communityLikes = cl.count;
    deleted.communityPosts = cp.count;
  }

  // ── 6. 지도글 ───────────────────────────────────────────────
  if (has("posts") || has("users")) {
    await prisma.comment.deleteMany({ where: { parentId: { not: null } } });
    const cm = await prisma.comment.deleteMany({});
    const lk = await prisma.like.deleteMany({});
    const bk = await prisma.bookmark.deleteMany({});
    const p  = await prisma.post.deleteMany({});   // cascade: PostCategory/Image/LocationTag/Hashtag
    const ht = await prisma.hashtag.deleteMany({});
    deleted.comments = cm.count;
    deleted.likes = lk.count;
    deleted.bookmarks = bk.count;
    deleted.posts = p.count;
    deleted.hashtags = ht.count;
  }

  // ── 7. 회원 ─────────────────────────────────────────────────
  if (has("users")) {
    const ub = await prisma.userBlock.deleteMany({});
    const oa = await prisma.oAuthAccount.deleteMany({});
    const u  = await prisma.user.deleteMany({});
    deleted.userBlocks = ub.count;
    deleted.oAuthAccounts = oa.count;
    deleted.users = u.count;
  }

  return NextResponse.json({ ok: true, deleted });
}
