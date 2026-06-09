"use client";

import FilterChip from "@/components/atom/FilterChip";
import PriceRangeSlider from "@/components/molecules/PriceRangeSlider";
import { WRITE_CATEGORIES } from "@/data/Categories";
import { PRICE_RANGES, SLIDER_MAX } from "@/data/postOptions";

type Direction = "all" | "offer" | "seek";

interface Props {
  selectedCategories: Set<string>;
  onToggleCategory: (id: string) => void;
  direction: Direction;
  onDirectionChange: (d: Direction) => void;
  priceRange: [number, number];
  onPriceRangeChange: (r: [number, number]) => void;
  showSlider: boolean;
  onToggleSlider: () => void;
  dirLabels: { offer: string; seek: string };
}

export default function SearchFilterBar({
  selectedCategories,
  onToggleCategory,
  direction,
  onDirectionChange,
  priceRange,
  onPriceRangeChange,
  showSlider,
  onToggleSlider,
  dirLabels,
}: Props) {
  const isChipActive = (min: number, max: number) => {
    const chipMax = max === Infinity ? SLIDER_MAX : max;
    return priceRange[0] === min && priceRange[1] === chipMax;
  };

  const handlePriceChip = (min: number, max: number) => {
    const chipMax = max === Infinity ? SLIDER_MAX : max;
    const isActive = priceRange[0] === min && priceRange[1] === chipMax;
    onPriceRangeChange(isActive ? [0, SLIDER_MAX] : [min, chipMax]);
  };

  return (
    <div className="border-b border-border-header bg-white">
      <div
        className="mx-auto px-3 sm:px-6 py-3 sm:py-4 flex flex-col gap-3 sm:gap-4"
        style={{ maxWidth: "var(--max-w-hero)" }}
      >
        {/* 카테고리 칩 */}
        <div className="flex gap-2 overflow-x-auto" style={{ scrollbarWidth: "none" }}>
          <FilterChip active={selectedCategories.size === 0} onClick={() => onToggleCategory("all")}>
            전체
          </FilterChip>
          {WRITE_CATEGORIES.map((cat) => (
            <FilterChip key={cat.id} active={selectedCategories.has(cat.id)} onClick={() => onToggleCategory(cat.id)}>
              {cat.label}
            </FilterChip>
          ))}
        </div>

        {/* 글 유형 토글 */}
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-semibold text-text-muted shrink-0">글 유형</span>
          <div className="flex gap-1.5">
            {(
              [
                { id: "all", label: "전체" },
                { id: "offer", label: dirLabels.offer },
                { id: "seek", label: dirLabels.seek },
              ] as { id: Direction; label: string }[]
            ).map(({ id, label }) => (
              <button
                key={id}
                onClick={() => onDirectionChange(id)}
                className={`shrink-0 px-3 py-1 rounded-full text-[12px] font-semibold border cursor-pointer whitespace-nowrap transition-colors ${
                  direction === id
                    ? id === "seek" ? "bg-sky-500 text-white border-sky-500" : "bg-brand text-white border-brand"
                    : "bg-white text-text-muted border-border-base hover:border-brand"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* 가격 칩 */}
        <div className="flex flex-col gap-3">
          <div className="flex gap-2 overflow-x-auto" style={{ scrollbarWidth: "none" }}>
            {PRICE_RANGES.map((r) => (
              <FilterChip key={r.id} active={isChipActive(r.min, r.max)} onClick={() => handlePriceChip(r.min, r.max)}>
                {r.label}
              </FilterChip>
            ))}
            <button
              onClick={onToggleSlider}
              className="shrink-0 text-[12px] font-semibold text-brand border border-brand rounded-full px-3 py-1.5 bg-transparent cursor-pointer hover:bg-brand-bg transition-colors whitespace-nowrap"
            >
              {showSlider ? "닫기" : "직접 입력"}
            </button>
          </div>
          {showSlider && (
            <div style={{ maxWidth: "260px" }}>
              <PriceRangeSlider value={priceRange} onChange={onPriceRangeChange} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
