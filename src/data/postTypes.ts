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
  viewCount?: number;
  likeCount?: number;
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

export const ALL_KEYWORDS: string[] = [
  // 악기
  "기타", "베이스", "드럼", "피아노", "키보드", "바이올린", "첼로", "비올라",
  "플루트", "클라리넷", "색소폰", "트럼펫", "트롬본", "하프", "우쿨렐레",
  "만돌린", "밴조", "하모니카", "아코디언", "퍼커션", "타악기", "신디사이저",
  // 장르
  "팝", "록", "재즈", "클래식", "EDM", "R&B", "힙합", "발라드", "포크",
  "블루스", "컨트리", "소울", "펑크", "메탈", "인디", "보사노바", "라틴",
  // 활동
  "레슨", "합주", "세션", "밴드", "연습실", "음반", "공연", "작곡", "편곡",
  "녹음", "믹싱", "마스터링", "뮤직비디오", "유튜브", "스트리밍",
  // 대상
  "입문자", "초급", "중급", "고급", "어린이", "성인", "직장인", "대학생",
];
