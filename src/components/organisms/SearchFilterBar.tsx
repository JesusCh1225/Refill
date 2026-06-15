"use client";

import { useState, useRef, useEffect } from "react";
import FilterChip from "@/components/atom/FilterChip";
import PriceRangeSlider from "@/components/molecules/PriceRangeSlider";
import LocationPicker, { type LocationSelection } from "@/components/molecules/LocationPicker";
import { MAIN_CATEGORIES, INSTRUMENT_SUBCATS, SUBCATS_VISIBLE } from "@/data/Categories";
import { PRICE_RANGES, SLIDER_MAX } from "@/data/postOptions";

export type SortOption = "latest" | "price_low" | "price_high";

interface Props {
  mainCatId: string;
  onMainCatChange: (id: string) => void;
  subCats: Set<string>;
  onToggleSubCat: (id: string) => void;
  locationSel: LocationSelection;
  onLocationChange: (sel: LocationSelection) => void;
  sort: SortOption;
  onSortChange: (s: SortOption) => void;
  priceRange: [number, number];
  onPriceRangeChange: (r: [number, number]) => void;
  showSlider: boolean;
  onToggleSlider: () => void;
  onReSearch: () => void;
}

const SORT_OPTIONS: { id: SortOption; label: string }[] = [
  { id: "latest",     label: "최근순" },
  { id: "price_low",  label: "가격 낮은순" },
  { id: "price_high", label: "가격 높은순" },
];

export default function SearchFilterBar({
  mainCatId, onMainCatChange,
  subCats, onToggleSubCat,
  locationSel, onLocationChange,
  sort, onSortChange,
  priceRange, onPriceRangeChange,
  showSlider, onToggleSlider,
  onReSearch,
}: Props) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const currentCat = MAIN_CATEGORIES.find((c) => c.id === mainCatId) ?? MAIN_CATEGORIES[0];
  const showSubs = SUBCATS_VISIBLE.has(mainCatId);

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
      <div className="mx-auto px-3 sm:px-6 py-3 flex flex-col gap-3" style={{ maxWidth: "var(--max-w-hero)" }}>

        {/* Row 1: 카테고리 + 지역 + 정렬 */}
        <div className="flex flex-wrap items-center gap-2">

          {/* 카테고리 드롭다운 */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setDropdownOpen((v) => !v)}
              className={`flex items-center gap-1.5 h-9 px-3.5 rounded-full border text-[14px] font-semibold cursor-pointer transition-colors whitespace-nowrap ${
                mainCatId !== "all"
                  ? "bg-brand text-white border-brand"
                  : "bg-white text-text-body border-border-base hover:border-brand"
              }`}
            >
              <span>{currentCat.emoji}</span>
              <span>{currentCat.label}</span>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
                className={`transition-transform ${dropdownOpen ? "rotate-180" : ""}`}>
                <path d="M6 9l6 6 6-6" />
              </svg>
            </button>

            {dropdownOpen && (
              <div className="absolute top-full left-0 mt-1 z-50 bg-white rounded-2xl shadow-lg border border-border-base py-1 min-w-40">
                {MAIN_CATEGORIES.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => { onMainCatChange(cat.id); setDropdownOpen(false); }}
                    className={`w-full flex items-center gap-2 px-4 py-2.5 text-[14px] text-left cursor-pointer transition-colors hover:bg-surface-card border-none bg-transparent ${
                      mainCatId === cat.id ? "font-bold text-brand" : "font-medium text-text-body"
                    }`}
                  >
                    <span>{cat.emoji}</span>
                    <span>{cat.label}</span>
                    {mainCatId === cat.id && <span className="ml-auto text-brand text-xs">✓</span>}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* 지역 선택 */}
          <LocationPicker value={locationSel} onChange={onLocationChange} />

          {/* 정렬 */}
          <div className="flex gap-1 ml-auto">
            {SORT_OPTIONS.map(({ id, label }) => (
              <button
                key={id}
                onClick={() => onSortChange(id)}
                className={`h-9 px-3 rounded-full text-[13px] font-semibold border cursor-pointer whitespace-nowrap transition-colors ${
                  sort === id
                    ? "bg-brand text-white border-brand"
                    : "bg-white text-text-muted border-border-base hover:border-brand"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Row 2: 악기 세부 카테고리 */}
        {showSubs && (
          <div className="flex gap-2 overflow-x-auto" style={{ scrollbarWidth: "none" }}>
            <span className="text-[12px] font-semibold text-text-muted shrink-0 self-center">악기</span>
            {INSTRUMENT_SUBCATS.map((sub) => (
              <FilterChip key={sub.id} active={subCats.has(sub.id)} onClick={() => onToggleSubCat(sub.id)}>
                {sub.label}
              </FilterChip>
            ))}
          </div>
        )}

        {/* Row 3: 가격 필터 */}
        <div className="flex flex-col gap-2">
          <div className="flex gap-2 overflow-x-auto" style={{ scrollbarWidth: "none" }}>
            {PRICE_RANGES.map((r) => (
              <FilterChip key={r.id} active={isChipActive(r.min, r.max)} onClick={() => handlePriceChip(r.min, r.max)}>
                {r.label}
              </FilterChip>
            ))}
            <button
              onClick={onToggleSlider}
              className="shrink-0 text-[13px] font-semibold text-brand border border-brand rounded-full px-3 py-1.5 bg-transparent cursor-pointer hover:bg-brand-bg transition-colors whitespace-nowrap"
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

        {/* Row 4: 이 조건으로 검색 */}
        <div className="flex justify-end">
          <button
            onClick={onReSearch}
            className="h-9 px-5 rounded-full text-[13px] font-semibold bg-brand text-white border-none cursor-pointer hover:opacity-85 transition-opacity whitespace-nowrap"
          >
            이 조건으로 검색
          </button>
        </div>
      </div>
    </div>
  );
}
