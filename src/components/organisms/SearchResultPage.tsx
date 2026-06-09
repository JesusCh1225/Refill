"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/organisms/Header";
import FilterChip from "@/components/atom/FilterChip";
import ResultItem from "@/components/atom/ResultItem";
import SearchBar from "@/components/molecules/SearchBar";
import PriceRangeSlider from "@/components/molecules/PriceRangeSlider";
import type { SearchResultItem } from "@/data/sampleMockResults";
import {
  WRITE_CATEGORIES,
  CATEGORY_TAG_MAP,
  inferCategoriesFromTokens,
  getDirectionLabels,
} from "@/data/Categories";
import { PRICE_RANGES, SLIDER_MAX, parsePrice } from "@/data/postOptions";
import { extractKeywords } from "@/lib/mapUtils";
import { useBookmarks } from "@/lib/useBookmarks";

type Direction = "all" | "offer" | "seek";

interface SearchResultPageProps {
  initialQuery: string;
  onBack: (query: string) => void;
  onLogoClick: () => void;
}

export default function SearchResultPage({
  initialQuery,
  onBack,
  onLogoClick,
}: SearchResultPageProps) {
  const router = useRouter();
  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState<SearchResultItem[]>([]);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedCategories, setSelectedCategories] = useState<Set<string>>(
    () => inferCategoriesFromTokens(extractKeywords(initialQuery.trim().toLowerCase())),
  );
  const [priceRange, setPriceRange] = useState<[number, number]>([0, SLIDER_MAX]);
  const [showSlider, setShowSlider] = useState(false);
  const [direction, setDirection] = useState<Direction>("all");

  const { isBookmarked, toggle: toggleBookmark } = useBookmarks();
  const dirLabels = getDirectionLabels(selectedCategories);

  // initialQuery가 변경될 때마다 API에서 검색 결과를 가져옴
  useEffect(() => {
    setLoading(true);
    fetch("/api/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query: initialQuery }),
    })
      .then((r) => r.json())
      .then((data) => {
        setResults(Array.isArray(data.results) ? data.results : []);
        setSuggestions(Array.isArray(data.suggestions) ? data.suggestions : []);
      })
      .catch(() => { setResults([]); setSuggestions([]); })
      .finally(() => setLoading(false));
  }, [initialQuery]);

  const toggleCategory = (id: string) => {
    if (id === "all") { setSelectedCategories(new Set()); return; }
    setSelectedCategories((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const handlePriceChip = (min: number, max: number) => {
    const chipMax = max === Infinity ? SLIDER_MAX : max;
    const isActive = priceRange[0] === min && priceRange[1] === chipMax;
    setPriceRange(isActive ? [0, SLIDER_MAX] : [min, chipMax]);
  };

  const isChipActive = (min: number, max: number) => {
    const chipMax = max === Infinity ? SLIDER_MAX : max;
    return priceRange[0] === min && priceRange[1] === chipMax;
  };

  // API 결과에 대해 카테고리/방향/가격 클라이언트 필터 적용
  const filtered = results.filter((item) => {
    const matchesCategory =
      selectedCategories.size === 0 ||
      [...selectedCategories].some((catId) =>
        (CATEGORY_TAG_MAP[catId] ?? []).some((tag) => item.tags.includes(tag)),
      );

    const matchesPrice = (() => {
      const [lo, hi] = priceRange;
      if (lo === 0 && hi === SLIDER_MAX) return true;
      const amount = parsePrice(item.price);
      if (amount === -1) return true;
      if (lo === 0 && hi === 0) return amount === 0;
      return amount >= lo && (hi >= SLIDER_MAX || amount <= hi);
    })();

    const matchesDirection = direction === "all" || item.direction === direction;

    return matchesCategory && matchesPrice && matchesDirection;
  });

  return (
    <div className="min-h-screen bg-surface-page text-text-body">
      <Header onLogoClick={onLogoClick} />

      {/* 검색바 */}
      <div className="border-b border-border-header bg-white">
        <div className="mx-auto px-3 sm:px-6 py-4" style={{ maxWidth: "var(--max-w-hero)" }}>
          <SearchBar
            value={query}
            onChange={setQuery}
            onSearch={() => { if (query.trim()) onBack(query); }}
          />
        </div>
      </div>

      {/* 필터 바 */}
      <div className="border-b border-border-header bg-white">
        <div
          className="mx-auto px-3 sm:px-6 py-3 sm:py-4 flex flex-col gap-3 sm:gap-4"
          style={{ maxWidth: "var(--max-w-hero)" }}
        >
          {/* 카테고리 칩 */}
          <div className="flex gap-2 overflow-x-auto" style={{ scrollbarWidth: "none" }}>
            <FilterChip active={selectedCategories.size === 0} onClick={() => toggleCategory("all")}>
              전체
            </FilterChip>
            {WRITE_CATEGORIES.map((cat) => (
              <FilterChip
                key={cat.id}
                active={selectedCategories.has(cat.id)}
                onClick={() => toggleCategory(cat.id)}
              >
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
                  { id: "all",   label: "전체" },
                  { id: "offer", label: dirLabels.offer },
                  { id: "seek",  label: dirLabels.seek },
                ] as { id: Direction; label: string }[]
              ).map(({ id, label }) => (
                <button
                  key={id}
                  onClick={() => setDirection(id)}
                  className={`shrink-0 px-3 py-1 rounded-full text-[12px] font-semibold border cursor-pointer whitespace-nowrap transition-colors ${
                    direction === id
                      ? id === "seek"
                        ? "bg-sky-500 text-white border-sky-500"
                        : "bg-brand text-white border-brand"
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
                <FilterChip
                  key={r.id}
                  active={isChipActive(r.min, r.max)}
                  onClick={() => handlePriceChip(r.min, r.max)}
                >
                  {r.label}
                </FilterChip>
              ))}
              <button
                onClick={() => setShowSlider((v) => !v)}
                className="shrink-0 text-[12px] font-semibold text-brand border border-brand rounded-full px-3 py-1.5 bg-transparent cursor-pointer hover:bg-brand-bg transition-colors whitespace-nowrap"
              >
                {showSlider ? "닫기" : "직접 입력"}
              </button>
            </div>
            {showSlider && (
              <div style={{ maxWidth: "260px" }}>
                <PriceRangeSlider value={priceRange} onChange={setPriceRange} />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 결과 */}
      <div
        className="mx-auto px-3 sm:px-6 py-6 sm:py-8 pb-16"
        style={{ maxWidth: "var(--max-w-hero)" }}
      >
        <h2 className="text-[18px] sm:text-[22px] font-bold text-text-heading tracking-tight mb-4">
          &ldquo;{initialQuery}&rdquo; 검색 결과
        </h2>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-6 h-6 rounded-full border-2 border-brand border-t-transparent animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-text-muted text-[15px] mb-4">검색 결과가 없어요.</p>
            {suggestions.length > 0 && (
              <div>
                <p className="text-[13px] text-text-muted mb-3">이런 키워드로 검색해볼까요?</p>
                <div className="flex flex-wrap justify-center gap-2">
                  {suggestions.map((s) => (
                    <button
                      key={s}
                      onClick={() => onBack(s)}
                      className="px-3 py-1.5 rounded-full text-[13px] font-semibold bg-brand-bg text-brand border border-brand cursor-pointer hover:bg-brand hover:text-white transition-colors"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <>
            <p className="text-[13px] text-text-muted mb-4">총 {filtered.length}개의 결과</p>
            <div className="flex flex-col divide-y divide-border-header">
              {filtered.map((item) => (
                <ResultItem
                  key={item.id}
                  title={item.title}
                  category={item.category}
                  location={item.location}
                  timeAgo={item.timeAgo}
                  price={item.price}
                  imageEmoji={item.imageEmoji}
                  imageUrl={item.imageUrl}
                  direction={item.direction}
                  bookmarked={isBookmarked(item.id)}
                  onBookmark={() => toggleBookmark(item.id)}
                  onClick={() => router.push(`/post/${item.id}`)}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
