// ── 방향 내포 메인 카테고리 (검색 필터 드롭다운 / 글쓰기 폼) ─────────────────
export interface MainCategory {
  id: string;
  label: string;
  tag: string | null;       // DB slug (e.g. "lesson")
  direction: "offer" | "seek" | null;
  emoji: string;
}

export const MAIN_CATEGORIES: MainCategory[] = [
  { id: "all",             label: "전체",          tag: null,         direction: null,    emoji: "🎵" },
  { id: "lesson_offer",    label: "레슨 합니다",   tag: "lesson",     direction: "offer", emoji: "🎓" },
  { id: "lesson_seek",     label: "레슨 구합니다", tag: "lesson",     direction: "seek",  emoji: "✋" },
  { id: "instrument_sell", label: "악기 팝니다",   tag: "instrument", direction: "offer", emoji: "🎸" },
  { id: "instrument_buy",  label: "악기 삽니다",   tag: "instrument", direction: "seek",  emoji: "🛒" },
  { id: "equipment_sell",  label: "장비 팝니다",   tag: "equipment",  direction: "offer", emoji: "🔊" },
  { id: "equipment_buy",   label: "장비 삽니다",   tag: "equipment",  direction: "seek",  emoji: "🎚️" },
  { id: "band",            label: "밴드/합주",     tag: "band",       direction: null,    emoji: "🎼" },
  { id: "record",          label: "음반/LP",       tag: "record",     direction: null,    emoji: "💿" },
];

// 악기 세부 카테고리 (레슨/악기거래 선택 시 추가 필터)
export const INSTRUMENT_SUBCATS = [
  { id: "guitar", label: "기타/베이스" },
  { id: "drum",   label: "드럼" },
  { id: "piano",  label: "피아노/건반" },
  { id: "vocal",  label: "보컬/노래" },
  { id: "wind",   label: "관악기" },
  { id: "string", label: "현악기" },
  { id: "dj",     label: "DJ/전자음악" },
];

// 세부 카테고리를 보여줄 메인 카테고리 ID
export const SUBCATS_VISIBLE = new Set(["lesson_offer", "lesson_seek", "instrument_sell", "instrument_buy"]);

// tags[] + direction → mainCatId 변환 (수정 모드 초기화용)
export function tagsAndDirToMainCatId(tags: string[], direction: string): string {
  for (const cat of MAIN_CATEGORIES) {
    if (!cat.tag) continue;
    if (tags.includes(cat.tag) && cat.direction === direction) return cat.id;
  }
  for (const cat of MAIN_CATEGORIES) {
    if (!cat.tag) continue;
    if (tags.includes(cat.tag) && cat.direction === null) return cat.id;
  }
  return "lesson_offer";
}

// ── 지도 페이지용 레거시 ─────────────────────────────────────────────────────
export interface Category {
  id: string;
  label: string;
}

export const CATEGORIES: Category[] = [
  { id: "all",        label: "전체" },
  { id: "lesson",     label: "레슨" },
  { id: "band",       label: "밴드/합주" },
  { id: "guitar",     label: "기타/베이스" },
  { id: "drum",       label: "드럼" },
  { id: "piano",      label: "피아노/건반" },
  { id: "vocal",      label: "보컬/노래" },
  { id: "wind",       label: "관악기" },
  { id: "string",     label: "현악기" },
  { id: "dj",         label: "DJ/전자음악" },
  { id: "record",     label: "음반/LP" },
  { id: "instrument", label: "악기거래" },
  { id: "equipment",  label: "음향장비" },
  { id: "etc",        label: "기타" },
];

export const CATEGORY_TAG_MAP: Record<string, string[]> = {
  all: [], lesson: ["lesson"], band: ["band"], guitar: ["guitar"],
  drum: ["drum"], piano: ["piano"], vocal: ["vocal"], wind: ["wind"],
  string: ["string"], dj: ["dj"], record: ["record"],
  instrument: ["instrument"], equipment: ["equipment"],
};

export interface WriteCategory extends Category { tags: string[]; }
export const WRITE_CATEGORIES: WriteCategory[] = CATEGORIES.filter(
  (c) => !["all", "record", "etc"].includes(c.id),
).map((c) => ({ ...c, tags: CATEGORY_TAG_MAP[c.id] ?? [c.id] }));

const SELL_CAT_IDS = new Set(["instrument", "dj", "equipment", "record"]);
export function getDirectionLabels(selectedCategories: Set<string>) {
  if (selectedCategories.size === 0) return { offer: "합니다·팝니다", seek: "구합니다·삽니다" };
  const cats = [...selectedCategories];
  const allSell  = cats.every((id) => SELL_CAT_IDS.has(id));
  const allOther = cats.every((id) => !SELL_CAT_IDS.has(id));
  if (allSell)  return { offer: "팝니다", seek: "삽니다" };
  if (allOther) return { offer: "합니다", seek: "구합니다" };
  return { offer: "합니다·팝니다", seek: "구합니다·삽니다" };
}

export function inferCategoriesFromTokens(tokens: string[]): Set<string> {
  const matched = new Set<string>();
  for (const token of tokens) {
    for (const cat of MAIN_CATEGORIES) {
      if (cat.id === "all") continue;
      if (cat.label.toLowerCase().includes(token)) matched.add(cat.id);
    }
    for (const sub of INSTRUMENT_SUBCATS) {
      if (sub.label.toLowerCase().includes(token)) matched.add(sub.id);
    }
  }
  return matched;
}
