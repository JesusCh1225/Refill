import type { SearchResultItem, PostDirection } from "@/data/sampleMockResults";

// 글쓰기 폼의 priceType id -> Prisma PriceType enum 값
export const PRICE_TYPE_MAP: Record<string, string> = {
  free: "FREE",
  monthly: "MONTHLY",
  yearly: "YEARLY",
  per_session: "PER_SESSION",
  negotiable: "NEGOTIABLE",
};

// 모든 post 조회 라우트에서 공통으로 사용하는 select 스펙
export const POST_SELECT = {
  id: true,
  title: true,
  description: true,
  priceType: true,
  priceAmount: true,
  priceDisplay: true,
  imageEmoji: true,
  location: true,
  lat: true,
  lng: true,
  direction: true,
  createdAt: true,
  authorId: true,
  author: { select: { name: true, nickname: true } },
  categories: { select: { category: { select: { slug: true, name: true } } } },
  hashtags: { select: { hashtag: { select: { name: true } } } },
  locationTags: { select: { tag: true } },
  images: { select: { url: true, order: true }, orderBy: { order: "asc" as const } },
} as const;

export type PostRow = {
  id: number;
  title: string;
  description: string | null;
  priceType: string;
  priceAmount: number | null;
  priceDisplay: string;
  imageEmoji: string;
  location: string;
  lat: number | null;
  lng: number | null;
  direction: string;
  createdAt: Date;
  authorId: number;
  author: { name: string; nickname: string | null } | null;
  categories: Array<{ category: { slug: string; name: string } }>;
  hashtags: Array<{ hashtag: { name: string } }>;
  locationTags: Array<{ tag: string }>;
  images: Array<{ url: string; order: number }>;
};

export function timeAgo(date: Date): string {
  const diff = Date.now() - date.getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return "방금 전";
  if (min < 60) return `${min}분 전`;
  const h = Math.floor(min / 60);
  if (h < 24) return `${h}시간 전`;
  const d = Math.floor(h / 24);
  if (d <= 5) return `${d}일 전`;
  // 5일 초과 — 날짜만 표시 (시간 제외)
  const y = date.getFullYear();
  const mo = String(date.getMonth() + 1).padStart(2, "0");
  const da = String(date.getDate()).padStart(2, "0");
  return `${y}.${mo}.${da}`;
}

export function mapPost(post: PostRow): SearchResultItem {
  return {
    id: post.id,
    title: post.title,
    category: post.categories.map((c) => c.category.name).join(" · ") || "기타",
    location: post.location,
    locationTags: post.locationTags.map((lt) => lt.tag),
    timeAgo: timeAgo(post.createdAt),
    price: post.priceDisplay,
    imageEmoji: post.imageEmoji,
    tags: post.categories.map((c) => c.category.slug),
    keywords: post.hashtags.map((h) => h.hashtag.name),
    description: post.description ?? undefined,
    author: post.author ? (post.author.nickname || post.author.name) : undefined,
    authorId: post.authorId,
    direction: post.direction.toLowerCase() as PostDirection,
    lat: post.lat ?? undefined,
    lng: post.lng ?? undefined,
    imageUrls: post.images.map((img) => img.url),
    imageUrl: post.images[0]?.url ?? undefined,
    priceType: post.priceType.toLowerCase(),
    priceAmount: post.priceAmount,
    createdAt: post.createdAt.toISOString(),
  };
}
