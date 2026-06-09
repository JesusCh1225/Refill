import type { SearchResultItem, PostDirection } from "@/data/sampleMockResults";

// 모든 post 조회 라우트에서 공통으로 사용하는 select 스펙
export const POST_SELECT = {
  id: true,
  title: true,
  description: true,
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
} as const;

export type PostRow = {
  id: number;
  title: string;
  description: string | null;
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
};

export function timeAgo(date: Date): string {
  const diff = Date.now() - date.getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return "방금 전";
  if (min < 60) return `${min}분 전`;
  const h = Math.floor(min / 60);
  if (h < 24) return `${h}시간 전`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d}일 전`;
  const mo = Math.floor(d / 30);
  if (mo < 12) return `${mo}개월 전`;
  return `${Math.floor(mo / 12)}년 전`;
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
  };
}
