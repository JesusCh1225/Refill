import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { POST_SELECT, mapPost, PRICE_TYPE_MAP, toDBDirection } from "@/lib/postMapper";
import { syncPostCategories, syncPostHashtags, syncPostLocationTags, syncPostImages } from "@/lib/postRelations";
import { getSessionUserId } from "@/lib/auth";
import { getBlockedIds } from "@/lib/blockFilter";

const PAGE_SIZE = 50;

// GET /api/posts?q=&category=&direction=&page=
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const q = (searchParams.get("q") ?? "").slice(0, 100);
    const category = (searchParams.get("category") ?? "").slice(0, 50);
    const direction = searchParams.get("direction") ?? "";
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1") || 1);

    const userId = await getSessionUserId();
    const blockedIds = await getBlockedIds(userId);

    const where = {
      status: "PUBLISHED" as const,
      ...(blockedIds.length > 0 ? { authorId: { notIn: blockedIds } } : {}),
      ...(q && { title: { contains: q } }),
      ...(category && { categories: { some: { category: { slug: category } } } }),
      ...(direction === "offer" && { direction: "OFFER" as const }),
      ...(direction === "seek" && { direction: "SEEK" as const }),
    };

    const [posts, total] = await Promise.all([
      prisma.post.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take: PAGE_SIZE,
        skip: (page - 1) * PAGE_SIZE,
        select: POST_SELECT,
      }),
      prisma.post.count({ where }),
    ]);

    return NextResponse.json({ posts: posts.map(mapPost), total, page, pageSize: PAGE_SIZE });
  } catch (err) {
    console.error("[GET /api/posts]", err);
    return NextResponse.json({ error: "internal" }, { status: 500 });
  }
}

// POST /api/posts — 새 게시글 작성 (로그인 필수)
export async function POST(req: NextRequest) {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }
  const {
    title, description, priceType, priceAmount, priceDisplay,
    imageEmoji, imageUrls, location, locationTags, tags, keywords, direction, lat, lng,
  } = body;

  if (!title?.trim()) return NextResponse.json({ error: "title required" }, { status: 400 });
  if (!location?.trim()) return NextResponse.json({ error: "location required" }, { status: 400 });
  if (!priceDisplay?.trim()) return NextResponse.json({ error: "price required" }, { status: 400 });

  try {
    const post = await prisma.post.create({
      data: {
        title: title.trim().slice(0, 100),
        description: description?.trim() || null,
        priceType: PRICE_TYPE_MAP[priceType] ?? "NEGOTIABLE",
        priceAmount: priceAmount ? parseInt(priceAmount) || null : null,
        priceDisplay: priceDisplay.trim().slice(0, 100),
        imageEmoji: (imageEmoji || "🎵").slice(0, 10),
        location: location.trim().slice(0, 100),
        lat: typeof lat === "number" ? lat : null,
        lng: typeof lng === "number" ? lng : null,
        direction: toDBDirection(direction),
        authorId: userId,
      },
      select: { id: true },
    });

    const postId = post.id;

    await Promise.all([
      syncPostCategories(postId, Array.isArray(tags) ? tags : []),
      syncPostHashtags(postId, Array.isArray(keywords) ? keywords : []),
      syncPostLocationTags(postId, Array.isArray(locationTags) ? locationTags : []),
      syncPostImages(postId, Array.isArray(imageUrls) ? imageUrls : []),
    ]);

    const created = await prisma.post.findUnique({
      where: { id: postId },
      select: POST_SELECT,
    });
    return NextResponse.json(mapPost(created!), { status: 201 });
  } catch (err) {
    console.error("[posts POST] error:", err);
    return NextResponse.json({ error: "internal" }, { status: 500 });
  }
}
