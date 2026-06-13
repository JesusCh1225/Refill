"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/organisms/Header";
import Spinner from "@/components/atom/Spinner";
import SearchFilterBar, { type SortOption } from "@/components/organisms/SearchFilterBar";
import ResultItem from "@/components/atom/ResultItem";
import SearchBar from "@/components/molecules/SearchBar";
import type { SearchResultItem } from "@/data/sampleMockResults";
import { MAIN_CATEGORIES, tagsAndDirToMainCatId } from "@/data/Categories";
import { SLIDER_MAX, parsePrice } from "@/data/postOptions";
import { useBookmarks } from "@/lib/useBookmarks";

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

  const [mainCatId, setMainCatId] = useState("all");
  const [subCats, setSubCats] = useState<Set<string>>(new Set());
  const [location, setLocation] = useState("");
  const [sort, setSort] = useState<SortOption>("latest");
  const [priceRange, setPriceRange] = useState<[number, number]>([0, SLIDER_MAX]);
  const [showSlider, setShowSlider] = useState(false);

  const queryRef = useRef(initialQuery);
  const { isBookmarked, toggle: toggleBookmark } = useBookmarks();

  const handleSetQuery = (q: string) => { queryRef.current = q; setQuery(q); };
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

  const toggleSubCat = (id: string) => {
    setSubCats((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const handleMainCatChange = (id: string) => {
    setMainCatId(id);
    setSubCats(new Set());
  };

  const selectedCat = MAIN_CATEGORIES.find((c) => c.id === mainCatId);

  const filtered = results
    .filter((item) => {
      // 메인 카테고리 필터
      if (mainCatId !== "all" && selectedCat) {
        if (selectedCat.tag && !item.tags.includes(selectedCat.tag)) return false;
        if (selectedCat.direction && item.direction !== selectedCat.direction) return false;
      }

      // 악기 세부 카테고리 필터 (OR — 하나라도 매치)
      if (subCats.size > 0) {
        const hasSubCat = [...subCats].some((s) => item.tags.includes(s));
        if (!hasSubCat) return false;
      }

      // 위치 필터
      if (location.trim()) {
        const loc = location.trim().toLowerCase();
        if (!item.location.toLowerCase().includes(loc)) return false;
      }

      // 가격 필터
      const [lo, hi] = priceRange;
      if (!(lo === 0 && hi === SLIDER_MAX)) {
        const amount = parsePrice(item.price);
        if (amount !== -1) {
          if (lo === 0 && hi === 0) { if (amount !== 0) return false; }
          else if (amount < lo || (hi < SLIDER_MAX && amount > hi)) return false;
        }
      }

      return true;
    })
    .sort((a, b) => {
      if (sort === "price_low") {
        const pa = parsePrice(a.price); const pb = parsePrice(b.price);
        if (pa === -1 && pb === -1) return 0;
        if (pa === -1) return 1;
        if (pb === -1) return -1;
        return pa - pb;
      }
      if (sort === "price_high") {
        const pa = parsePrice(a.price); const pb = parsePrice(b.price);
        if (pa === -1 && pb === -1) return 0;
        if (pa === -1) return 1;
        if (pb === -1) return -1;
        return pb - pa;
      }
      return 0; // latest: keep API order
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
        mainCatId={mainCatId}
        onMainCatChange={handleMainCatChange}
        subCats={subCats}
        onToggleSubCat={toggleSubCat}
        location={location}
        onLocationChange={setLocation}
        sort={sort}
        onSortChange={setSort}
        priceRange={priceRange}
        onPriceRangeChange={setPriceRange}
        showSlider={showSlider}
        onToggleSlider={() => setShowSlider((v) => !v)}
      />

      {/* 결과 */}
      <div className="mx-auto px-3 sm:px-6 py-6 sm:py-8 pb-16" style={{ maxWidth: "var(--max-w-hero)" }}>
        <h2 className="text-[19px] sm:text-[23px] font-bold text-text-heading tracking-tight mb-4">
          &ldquo;{initialQuery}&rdquo; 검색 결과
        </h2>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Spinner size="lg" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-text-muted text-[15px] mb-4">검색 결과가 없어요.</p>
            {suggestions.length > 0 && (
              <div>
                <p className="text-[14px] text-text-muted mb-3">이런 키워드로 검색해볼까요?</p>
                <div className="flex flex-wrap justify-center gap-2">
                  {suggestions.map((s) => (
                    <button
                      key={s}
                      onClick={() => onBack(s)}
                      className="px-3 py-1.5 rounded-full text-[14px] font-semibold bg-brand-bg text-brand border border-brand cursor-pointer hover:bg-brand hover:text-white transition-colors"
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
            <p className="text-[14px] text-text-muted mb-4">총 {filtered.length}개의 결과</p>
            <div className="flex flex-col divide-y divide-border-header">
              {filtered.map((item) => {
                const catId = tagsAndDirToMainCatId(item.tags ?? [], item.direction ?? "offer");
                const cat = MAIN_CATEGORIES.find((c) => c.id === catId);
                return (
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
                    directionLabel={cat ? `${cat.emoji} ${cat.label}` : undefined}
                    bookmarked={isBookmarked(item.id)}
                    onBookmark={() => toggleBookmark(item.id)}
                    onClick={() => router.push(`/post/${item.id}`)}
                  />
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
