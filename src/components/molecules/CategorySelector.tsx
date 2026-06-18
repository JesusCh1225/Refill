"use client";

const TYPE_OPTIONS = [
  { value: "lesson", label: "레슨" },
  { value: "trade",  label: "악기거래" },
  { value: "band",   label: "밴드/합주" },
  { value: "etc",    label: "기타" },
] as const;

export type EntryType = "lesson" | "trade" | "band" | "etc";

const SUBCATS: Record<EntryType, { id: string; label: string }[]> = {
  lesson: [
    { id: "guitar",    label: "기타/베이스" },
    { id: "drum",      label: "드럼" },
    { id: "piano",     label: "피아노/건반" },
    { id: "vocal",     label: "보컬/노래" },
    { id: "wind",      label: "관악기" },
    { id: "string",    label: "현악기" },
    { id: "dj",        label: "DJ/전자음악" },
    { id: "equipment", label: "음향장비" },
  ],
  trade: [
    { id: "guitar",    label: "기타/베이스" },
    { id: "drum",      label: "드럼" },
    { id: "piano",     label: "피아노/건반" },
    { id: "wind",      label: "관악기" },
    { id: "string",    label: "현악기" },
    { id: "dj",        label: "DJ/전자음악" },
    { id: "equipment", label: "음향장비" },
  ],
  band: [],
  etc: [
    { id: "record", label: "음반/LP" },
    { id: "book",   label: "교재/악보" },
  ],
};

export const DIR_LABELS: Record<EntryType, { offer: string; seek: string }> = {
  lesson: { offer: "가르칩니다", seek: "배웁니다" },
  trade:  { offer: "팝니다",     seek: "삽니다" },
  band:   { offer: "모집합니다", seek: "합류 원합니다" },
  etc:    { offer: "팝니다",     seek: "삽니다" },
};

export interface CategoryEntry {
  id: string;
  type: EntryType;
  subcat: string;
  direction: "offer" | "seek";
}

interface Props {
  entries: CategoryEntry[];
  onChange: (entries: CategoryEntry[]) => void;
}

export default function CategorySelector({ entries, onChange }: Props) {
  const update = (id: string, patch: Partial<CategoryEntry>) =>
    onChange(entries.map((e) => (e.id === id ? { ...e, ...patch } : e)));

  const remove = (id: string) => onChange(entries.filter((e) => e.id !== id));

  const add = () =>
    onChange([
      ...entries,
      { id: String(Date.now()), type: "lesson", subcat: "", direction: "offer" },
    ]);

  return (
    <div className="flex flex-col gap-2.5">
      {entries.map((entry) => {
        const subcats = SUBCATS[entry.type];
        const dir = DIR_LABELS[entry.type];

        return (
          <div
            key={entry.id}
            className="rounded-xl border border-border-base bg-surface-card p-3 flex flex-col gap-2.5"
          >
            {/* 유형 드롭다운 + 삭제 */}
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-semibold text-text-muted shrink-0">유형</span>
              <select
                value={entry.type}
                onChange={(e) => {
                  const newType = e.target.value as EntryType;
                  const keepSubcat = SUBCATS[newType].some((s) => s.id === entry.subcat)
                    ? entry.subcat
                    : "";
                  update(entry.id, { type: newType, subcat: keepSubcat });
                }}
                className="flex-1 h-8 px-2 rounded-lg border border-border-base text-[13px] text-text-body bg-white cursor-pointer focus:outline-none focus:border-brand transition-colors"
              >
                {TYPE_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
              {entries.length > 1 && (
                <button
                  type="button"
                  onClick={() => remove(entry.id)}
                  className="w-7 h-7 rounded-full border border-border-base text-text-muted text-[13px] leading-none flex items-center justify-center cursor-pointer bg-transparent hover:border-red-400 hover:text-red-500 transition-colors shrink-0"
                >
                  ×
                </button>
              )}
            </div>

            {/* 악기/세부 분류 칩 */}
            {subcats.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                <button
                  type="button"
                  onClick={() => update(entry.id, { subcat: "" })}
                  className={`px-2.5 py-1 rounded-full text-[12px] font-semibold border cursor-pointer transition-colors ${
                    entry.subcat === ""
                      ? "bg-brand text-white border-brand"
                      : "bg-white text-text-muted border-border-base hover:border-brand hover:text-brand"
                  }`}
                >
                  전체
                </button>
                {subcats.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => update(entry.id, { subcat: s.id })}
                    className={`px-2.5 py-1 rounded-full text-[12px] font-semibold border cursor-pointer transition-colors ${
                      entry.subcat === s.id
                        ? "bg-brand text-white border-brand"
                        : "bg-white text-text-muted border-border-base hover:border-brand hover:text-brand"
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            )}

            {/* 방향 버튼 */}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => update(entry.id, { direction: "offer" })}
                className={`flex-1 h-9 rounded-xl text-[13px] font-semibold border cursor-pointer transition-colors ${
                  entry.direction === "offer"
                    ? "bg-brand text-white border-brand"
                    : "bg-white text-text-muted border-border-base hover:border-brand hover:text-brand"
                }`}
              >
                {dir.offer}
              </button>
              <button
                type="button"
                onClick={() => update(entry.id, { direction: "seek" })}
                className={`flex-1 h-9 rounded-xl text-[13px] font-semibold border cursor-pointer transition-colors ${
                  entry.direction === "seek"
                    ? "bg-sky-500 text-white border-sky-500"
                    : "bg-white text-text-muted border-border-base hover:border-sky-400 hover:text-sky-500"
                }`}
              >
                {dir.seek}
              </button>
            </div>
          </div>
        );
      })}

      {/* 추가 버튼 */}
      <button
        type="button"
        onClick={add}
        className="w-full h-9 rounded-xl border-2 border-dashed border-border-base text-[13px] font-semibold text-text-muted cursor-pointer bg-transparent hover:border-brand hover:text-brand transition-colors"
      >
        ＋ 카테고리 추가
      </button>
    </div>
  );
}
