// 임의 데이터 - 카테고리 정보

export interface Category {
  id: string;
  label: string;
}

export const CATEGORIES: Category[] = [
  { id: "all", label: "전체" },
  { id: "lesson", label: "레슨" },
  { id: "band", label: "밴드/합주" },
  { id: "guitar", label: "기타/베이스" },
  { id: "drum", label: "드럼" },
  { id: "piano", label: "피아노/건반" },
  { id: "vocal", label: "보컬/노래" },
  { id: "wind", label: "관악기" },
  { id: "string", label: "현악기" },
  { id: "dj", label: "DJ/전자음악" },
  { id: "record", label: "음반/LP" },
  { id: "instrument", label: "악기거래" },
  { id: "equipment", label: "음향장비" },
  { id: "etc", label: "기타" },
];

export const CATEGORY_TAG_MAP: Record<string, string[]> = {
  all: [],
  lesson: ["lesson"],
  band: ["band"],
  guitar: ["guitar"],
  drum: ["drum"],
  piano: ["piano"],
  vocal: ["vocal"],
  wind: ["wind"],
  string: ["string"],
  dj: ["dj"],
  record: ["record"],
  instrument: ["instrument"],
  equipment: ["equipment"],
};

export const CATEGORY_LOCATION: Record<string, string[]> = {
  all: [],
};
