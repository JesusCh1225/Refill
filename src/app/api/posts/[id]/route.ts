import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { POST_SELECT, mapPost } from "@/lib/postMapper";
import { syncPostCategories, syncPostHashtags, syncPostLocationTags, syncPostImages } from "@/lib/postRelations";

// GET /api/posts/[id]
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const postId = Number((await params).id);
  if (isNaN(postId)) return NextResponse.json({ error: "invalid id" }, { status: 400 });

  const post = await prisma.post.findFirst({
    where: { id: postId, status: "PUBLISHED" },
    select: POST_SELECT,
  });

  if (!post) return NextResponse.json({ error: "not found" }, { status: 404 });

  // 조회수 증가 (fire-and-forget)
  prisma.post.update({ where: { id: postId }, data: { viewCount: { increment: 1 } } }).catch(() => {});

  return NextResponse.json(mapPost(post));
}

// DELETE /api/posts/[id] — 작성자만 삭제 가능 (soft delete)
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  const userId = (session?.user as any)?.id as number | undefined;
  if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const postId = Number((await params).id);
  if (isNaN(postId)) return NextResponse.json({ error: "invalid id" }, { status: 400 });

  const post = await prisma.post.findUnique({
    where: { id: postId },
    select: { authorId: true },
  });
  if (!post) return NextResponse.json({ error: "not found" }, { status: 404 });
  if (post.authorId !== userId) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  await prisma.post.update({ where: { id: postId }, data: { status: "DELETED" } });

  return NextResponse.json({ ok: true });
}

const PRICE_TYPE_MAP: Record<string, string> = {
  free: "FREE", monthly: "MONTHLY", yearly: "YEARLY",
  per_session: "PER_SESSION", negotiable: "NEGOTIABLE",
};

// PATCH /api/posts/[id] — 작성자만 수정 가능
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  const userId = (session?.user as any)?.id as number | undefined;
  if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const postId = Number((await params).id);
  if (isNaN(postId)) return NextResponse.json({ error: "invalid id" }, { status: 400 });

  const existing = await prisma.post.findUnique({ where: { id: postId }, select: { authorId: true } });
  if (!existing) return NextResponse.json({ error: "not found" }, { status: 404 });
  if (existing.authorId !== userId) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  try {
    const body = await req.json();
    const { title, description, priceType, priceAmount, priceDisplay, imageEmoji, location, locationTags, tags, keywords, direction, imageUrls } = body;

    await (prisma.post.update as any)({
      where: { id: postId },
      data: {
        title: title?.trim().slice(0, 100),
        description: description?.trim() || null,
        priceType: PRICE_TYPE_MAP[priceType] ?? "NEGOTIABLE",
        priceAmount: priceAmount ? parseInt(priceAmount) || null : null,
        priceDisplay: priceDisplay?.trim().slice(0, 100),
        imageEmoji: (imageEmoji || "🎵").slice(0, 10),
        location: location?.trim().slice(0, 100),
        direction: direction === "seek" ? "SEEK" : "OFFER",
      },
    });

    // 기존 관계 전부 비우고 새로 생성
    await Promise.all([
      prisma.postCategory.deleteMany({ where: { postId } }),
      prisma.postHashtag.deleteMany({ where: { postId } }),
      prisma.postLocationTag.deleteMany({ where: { postId } }),
      prisma.postImage.deleteMany({ where: { postId } }),
    ]);

    await Promise.all([
      syncPostCategories(postId, Array.isArray(tags) ? tags : []),
      syncPostHashtags(postId, keywords),
      syncPostLocationTags(postId, locationTags),
      syncPostImages(postId, imageUrls),
    ]);

    const updated = await prisma.post.findUnique({ where: { id: postId }, select: POST_SELECT });
    return NextResponse.json(mapPost(updated!));
  } catch (err) {
    console.error("[posts PATCH] error:", err);
    return NextResponse.json({ error: "internal" }, { status: 500 });
  }
}
