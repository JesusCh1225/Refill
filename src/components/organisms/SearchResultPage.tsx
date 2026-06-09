"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/organisms/Header";
import SearchFilterBar from "@/components/organisms/SearchFilterBar";
import ResultItem from "@/components/atom/ResultItem";
import SearchBar from "@/components/molecules/SearchBar";
import type { SearchResultItem } from "@/data/sampleMockResults";
import { CATEGORY_TAG_MAP, inferCategoriesFromTokens, getDirectionLabels } from "@/data/Categories";
import { SLIDER_MAX, parsePrice } from "@/data/postOptions";
import { extractKeywords } from "@/lib/mapUtils";
import { useBookmarks } from "@/lib/useBookmarks";

type Direction = "all" | "offer" | "seek";

interface SearchResultPageProps {
  initialQuery: string;
  onBack: (query: string) => void;
  onLogoClick: () => void;
}

export default function SearchResultPage({ initialQuery, onBack, onLogoClick }: SearchResultPageProps) {
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

  const queryRef = useRef(initialQuery);
  const { isBookmarked, toggle: toggleBookmark } = useBookmarks();
  const dirLabels = getDirectionLabels(selectedCategories);

  const handleSetQuery = (q: string) => {
    queryRef.current = q;
    setQuery(q);
  };

  const handleSearch = (voiceQuery?: string) => {
    const q = voiceQuery ?? queryRef.current;
    if (q.trim()) onBack(q);
  };

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
          <SearchBar value={query} onChange={handleSetQuery} onSearch={handleSearch} />
        </div>
      </div>

      <SearchFilterBar
        selectedCategories={selectedCategories}
        onToggleCategory={toggleCategory}
        direction={direction}
        onDirectionChange={setDirection}
        priceRange={priceRange}
        onPriceRangeChange={setPriceRange}
        showSlider={showSlider}
        onToggleSlider={() => setShowSlider((v) => !v)}
        dirLabels={dirLabels}
      />

      {/* 결과 */}
      <div className="mx-auto px-3 sm:px-6 py-6 sm:py-8 pb-16" style={{ maxWidth: "var(--max-w-hero)" }}>
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
