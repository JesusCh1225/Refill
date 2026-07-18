// MOCK 데이터 제거 — 모든 데이터는 DB에서 가져옵니다.
// 이 파일은 타입 정의만 포함합니다.

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
  direction: PostDirection;
  lat?: number;
  lng?: number;
  imageUrls?: string[];       // 전체 이미지 URL 배열
  priceType?: string;         // 수정 폼 pre-fill용
  priceAmount?: number | null;
  createdAt?: string;         // ISO 문자열 — 상세 페이지 정확한 날짜 표시용
}

// 글 작성 시 WritePostModal → API로 전달되는 데이터 타입
export interface PostDraft {
  title: string;
  description?: string;
  priceType: string;    // "free" | "monthly" | "yearly" | "per_session" | "negotiable"
  priceAmount: string;  // 숫자 문자열 (무료/협의면 "")
  priceDisplay: string;
  imageEmoji: string;
  imageUrls?: string[];  // 업로드된 이미지 URL 배열
  location: string;
  locationTags: string[];
  tags: string[];      // 카테고리 슬러그 배열
  keywords: string[];  // 해시태그 배열
  direction: PostDirection;
  lat?: number;
  lng?: number;
}

// 해시태그 자동완성용 (DB에서 fetch하기 전까지 빈 배열)
export const ALL_KEYWORDS: string[] = [];
