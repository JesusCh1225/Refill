"use client";

import { WRITE_CATEGORIES } from "@/data/Categories";
import type { PostDirection } from "@/data/sampleMockResults";

// 카테고리 ID → 방향 버튼 그룹 매핑
const LESSON_IDS = new Set(["lesson"]);
const TRADE_IDS  = new Set(["instrument", "guitar", "drum", "piano", "vocal", "wind", "string", "dj", "equipment"]);
const BAND_IDS   = new Set(["band"]);

interface DirectionRow {
  key: string;
  label: string;
  offer: string;
  seek: string;
}

function getDirectionRows(selected: Set<string>): DirectionRow[] {
  const rows: DirectionRow[] = [];
  if ([...selected].some((id) => LESSON_IDS.has(id)))
    rows.push({ key: "lesson", label: "레슨",  offer: "가르칩니다",   seek: "배웁니다" });
  if ([...selected].some((id) => TRADE_IDS.has(id)))
    rows.push({ key: "trade",  label: "거래",   offer: "팝니다",      seek: "삽니다" });
  if ([...selected].some((id) => BAND_IDS.has(id)))
    rows.push({ key: "band",   label: "밴드",   offer: "모집합니다",  seek: "합류 원합니다" });
  return rows;
}

interface CategorySelectorProps {
  selected: Set<string>;
  onToggle: (id: string) => void;
  direction: PostDirection;
  onDirectionChange: (d: PostDirection) => void;
}

export default function CategorySelector({ selected, onToggle, direction, onDirectionChange }: CategorySelectorProps) {
  const rows = getDirectionRows(selected);
  const multiRow = rows.length > 1;

  return (
    <div className="flex flex-col gap-3">
      {/* 카테고리 칩 */}
      <div className="flex flex-wrap gap-2">
        {WRITE_CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            type="button"
            onClick={() => onToggle(cat.id)}
            className={`px-3 py-1.5 rounded-full text-[13px] font-semibold border cursor-pointer transition-colors ${
              selected.has(cat.id)
                ? "bg-brand text-white border-brand"
                : "bg-white text-text-muted border-border-base hover:border-brand hover:text-brand"
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* 방향 버튼 — 선택된 카테고리 종류별로 맥락에 맞는 레이블 */}
      {rows.length > 0 && (
        <div className="flex flex-col gap-2">
          {rows.map((row) => (
            <div key={row.key} className="flex items-center gap-2">
              {multiRow && (
                <span className="text-[12px] font-semibold text-text-muted shrink-0 w-10">{row.label}</span>
              )}
              <div className="flex gap-2 flex-1">
                <button
                  type="button"
                  onClick={() => onDirectionChange("offer")}
                  className={`flex-1 py-2 rounded-xl text-[13px] font-semibold border cursor-pointer transition-colors ${
                    direction === "offer"
                      ? "bg-brand text-white border-brand"
                      : "bg-white text-text-muted border-border-base hover:border-brand"
                  }`}
                >
                  {row.offer}
                </button>
                <button
                  type="button"
                  onClick={() => onDirectionChange("seek")}
                  className={`flex-1 py-2 rounded-xl text-[13px] font-semibold border cursor-pointer transition-colors ${
                    direction === "seek"
                      ? "bg-sky-500 text-white border-sky-500"
                      : "bg-white text-text-muted border-border-base hover:border-sky-400"
                  }`}
                >
                  {row.seek}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
