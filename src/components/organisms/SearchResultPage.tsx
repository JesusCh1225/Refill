"use client";

import { useState } from "react";
import Header from "@/components/organisms/Header";
import CategoryFilter from "@/components/molecules/CategoryFilter";
import ResultItem from "@/components/atom/ResultItem";
import SearchBar from "@/components/molecules/SearchBar";
import { MOCK_RESULTS } from "@/data/sampleMockResults";
import { CATEGORY_TAG_MAP } from "@/data/Categories";

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
  const [query, setQuery] = useState(initialQuery);
  const [selectedCategory, setSelectedCategory] = useState("all");

  const filtered = MOCK_RESULTS.filter((item) => {
    const q = initialQuery.trim().toLowerCase();
    const matchesQuery =
      q === "" ||
      item.title.toLowerCase().includes(q) ||
      item.category.toLowerCase().includes(q) ||
      item.keywords.some((kw) => kw.toLowerCase().includes(q));

    const matchesCategory =
      selectedCategory === "all" ||
      (CATEGORY_TAG_MAP[selectedCategory] ?? []).some((tag) =>
        item.tags.includes(tag),
      );

    return matchesQuery && matchesCategory;
  });

  return (
    <div className="min-h-screen bg-surface-page text-text-body">
      <Header onLogoClick={onLogoClick} />

      {/* 검색바 */}
      <div className="border-b border-border-header py-4 px-6 bg-white">
        <div className="mx-auto" style={{ maxWidth: "var(--max-w-hero)" }}>
          <SearchBar
            value={query}
            onChange={setQuery}
            onSearch={() => onBack(query)}
          />
        </div>
      </div>

      {/* 결과 타이틀 */}
      <div
        className="mx-auto px-6 pt-8 pb-4"
        style={{ maxWidth: "var(--max-w-hero)" }}
      >
        <h2 className="text-[22px] font-bold text-text-heading tracking-tight">
          &ldquo;{initialQuery}&rdquo; 검색 결과
        </h2>
      </div>

      {/* 본문 레이아웃 */}
      <div
        className="mx-auto px-6 pb-16 flex gap-10"
        style={{ maxWidth: "var(--max-w-hero)" }}
      >
        <aside className="w-44 shrink-0 pt-2">
          <CategoryFilter
            selected={selectedCategory}
            onChange={setSelectedCategory}
          />
        </aside>

        <div className="flex-1">
          <p className="text-[13px] text-text-muted mb-4">
            총 {filtered.length}개의 결과
          </p>
          {filtered.length === 0 ? (
            <div className="py-20 text-center text-text-muted text-[15px]">
              검색 결과가 없어요.
            </div>
          ) : (
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
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
