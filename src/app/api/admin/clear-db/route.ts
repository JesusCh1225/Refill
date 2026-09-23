import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAdminSession } from "@/lib/admin";

export async function POST() {
  if (!(await isAdminSession()))
    return NextResponse.json({ error: "forbidden" }, { status: 403 });

  // FK 제약 순서대로 삭제 (leaf → root)
  await prisma.$transaction([
    prisma.notification.deleteMany({}),
    prisma.report.deleteMany({}),
    prisma.communityLike.deleteMany({}),
    prisma.communityComment.deleteMany({}),
    prisma.communityPost.deleteMany({}),
    prisma.like.deleteMany({}),
    prisma.bookmark.deleteMany({}),
    prisma.review.deleteMany({}),
    prisma.message.deleteMany({}),
    prisma.conversationLeft.deleteMany({}),
    prisma.userBlock.deleteMany({}),
    prisma.comment.deleteMany({}),
    prisma.postHashtag.deleteMany({}),
    prisma.postLocationTag.deleteMany({}),
    prisma.postImage.deleteMany({}),
    prisma.postCategory.deleteMany({}),
    prisma.post.deleteMany({}),
    prisma.hashtag.deleteMany({}),
    prisma.oAuthAccount.deleteMany({}),
    prisma.user.deleteMany({}),
  ]);

  return NextResponse.json({ ok: true });
}
