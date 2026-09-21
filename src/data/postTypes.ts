export type PostDirection = "offer" | "seek";

export interface SearchResultItem {
  id: number;
  title: string;
  category: string;
  location: string;
  locationTags: string[];
  timeAgo: string;
  price: string;
  imageEmoji: string;
  imageUrl?: string;
  tags: string[];
  keywords: string[];
  description?: string;
  author?: string;
  authorId?: number;
  authorAvatarUrl?: string | null;
  direction: PostDirection;
  lat?: number;
  lng?: number;
  imageUrls?: string[];
  priceType?: string;          // 수정 폼 pre-fill용
  priceAmount?: number | null;
  createdAt?: string;          // ISO 문자열 — 상세 페이지 정확한 날짜 표시용
}

// 글 작성 시 WritePostModal → API로 전달되는 데이터 타입
export interface PostDraft {
  title: string;
  description?: string;
  priceType: string;
  priceAmount: string;         // 숫자 문자열 (무료/협의면 "")
  priceDisplay: string;
  imageEmoji: string;
  imageUrls?: string[];
  location: string;
  locationTags: string[];
  tags: string[];              // 카테고리 슬러그 배열
  keywords: string[];          // 해시태그 배열
  direction: PostDirection;
  lat?: number;
  lng?: number;
}

export const ALL_KEYWORDS: string[] = [];
