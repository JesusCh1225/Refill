"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/organisms/Header";
import Spinner from "@/components/atom/Spinner";
import PageNumbers from "@/components/atom/PageNumbers";
import SearchFilterBar, { type SortOption } from "@/components/organisms/SearchFilterBar";
import NearbySearchBanner, { type GeoState } from "@/components/organisms/NearbySearchBanner";
import ResultItem from "@/components/atom/ResultItem";
import SearchBar from "@/components/molecules/SearchBar";
import WritePostModal from "@/components/organisms/WritePostModal";
import type { SearchResultItem, PostDraft } from "@/data/sampleMockResults";
import { MAIN_CATEGORIES, tagsAndDirToMainCatId } from "@/data/Categories";
import { SLIDER_MAX, NEGOTIABLE_PRICE, parsePrice } from "@/data/postOptions";
import { useBookmarks } from "@/lib/useBookmarks";
import { useCreatePost } from "@/hooks/useCreatePost";
import { wordVariants } from "@/lib/textMatching";
import { parseLocationFromQuery } from "@/lib/locationParser";
import { isNearbyQuery, stripNearbyKeywords, haversineKm, fmtDist, NEARBY_RADIUS_KM } from "@/lib/nearbySearch";
import type { LocationEntry } from "@/components/molecules/LocationPicker";

interface SearchResultPageProps {
  initialQuery: string;
  onBack: (query: string) => void;
  onLogoClick: () => void;
}

function entryTermGroups(e: LocationEntry): string[][] {
  const parts = e.dong ? [e.si, e.gu, e.dong] : e.gu ? [e.si, e.gu] : e.si ? [e.si] : [];
  return parts.filter(Boolean).flatMap((p) => p.split(" ")).map(wordVariants);
}

function entryMatches(combinedLower: string, e: LocationEntry): boolean {
  return entryTermGroups(e).every((variants) => variants.some((v) => combinedLower.includes(v.toLowerCase())));
}

function mostSpecificLocLabel(e: LocationEntry): string {
  return e.dong || e.gu || e.si || "";
}

export default function SearchResultPage({ initialQuery, onBack, onLogoClick }: SearchResultPageProps) {
  const router = useRouter();
  const { requireLogin, createPost } = useCreatePost();
  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState<SearchResultItem[]>([]);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [detectedDirection, setDetectedDirection] = useState<"OFFER" | "SEEK" | null>(null);
  const [loading, setLoading] = useState(true);
  const [writeOpen, setWriteOpen] = useState(false);
  const [displayCount, setDisplayCount] = useState(20);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [mainCatId, setMainCatId] = useState("all");
  const [subCats, setSubCats] = useState<Set<string>>(new Set());
  const [locationSel, setLocationSel] = useState<LocationEntry[]>([]);
  const [sort, setSort] = useState<SortOption>("latest");
  const [priceRange, setPriceRange] = useState<[number, number]>([0, SLIDER_MAX]);
  const [showSlider, setShowSlider] = useState(false);
  const [isNearby, setIsNearby] = useState(false);
  const [geoState, setGeoState] = useState<GeoState>("idle");
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [nearbyRadius, setNearbyRadius] = useState(NEARBY_RADIUS_KM);

  const queryRef = useRef(initialQuery);
  const lastApiQueryRef = useRef("");
  const { isBookmarked, toggle: toggleBookmark } = useBookmarks();

  const handleSetQuery = (q: string) => { queryRef.current = q; setQuery(q); };
  const handleSearch = (voiceQuery?: string) => onBack(voiceQuery ?? queryRef.current);

  const fetchResults = useCallback((apiQuery: string, pageNum = 1) => {
    lastApiQueryRef.current = apiQuery;
    setLoading(true);
    setDisplayCount(20);
    setCurrentPage(pageNum);
    fetch("/api/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query: apiQuery, page: pageNum }),
    })
      .then((r) => r.json())
      .then((data) => {
        setResults(Array.isArray(data.results) ? data.results : []);
        setSuggestions(Array.isArray(data.suggestions) ? data.suggestions : []);
        setDetectedDirection(data.direction ?? null);
        setTotalPages(data.totalPages ?? 1);
      })
      .catch(() => { setResults([]); setSuggestions([]); })
      .finally(() => setLoading(false));
  }, []);

  const requestGeo = useCallback(() => {
    if (!navigator.geolocation) { setGeoState("denied"); return; }
    setGeoState("requesting");
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => { setUserCoords({ lat: coords.latitude, lng: coords.longitude }); setGeoState("ready"); },
      () => setGeoState("denied"),
      { timeout: 8000 },
    );
  }, []);

  useEffect(() => {
    const isEmptyQuery = initialQuery.trim() === "";
    const nearby = isNearbyQuery(initialQuery) || isEmptyQuery;
    setIsNearby(nearby);
    const cleanedQuery = nearby ? stripNearbyKeywords(initialQuery) : initialQuery;
    const parsed = cleanedQuery.trim() ? parseLocationFromQuery(cleanedQuery) : null;
    if (parsed) {
      setLocationSel([{ si: parsed.si, gu: parsed.gu, dong: parsed.dong }]);
      setQuery(parsed.restQuery);
      queryRef.current = parsed.restQuery;
    } else {
      setQuery(cleanedQuery);
      queryRef.current = cleanedQuery;
    }
    fetchResults(initialQuery, 1);
    requestGeo();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialQuery]);

  const handleReSearch = () => {
    const locVal = locationSel.map(mostSpecificLocLabel).filter(Boolean).join(" ");
    const combined = [queryRef.current.trim(), locVal].filter(Boolean).join(" ");
    fetchResults(combined || initialQuery, 1);
  };

  const handleWriteClick = () => { if (requireLogin()) setWriteOpen(true); };
  const handlePostSubmit = async (draft: PostDraft) => {
    const newPost = await createPost(draft);
    if (newPost) router.push(`/post/${newPost.id}`);
  };

  const toggleSubCat = (id: string) =>
    setSubCats((prev) => { const next = new Set(prev); next.has(id) ? next.delete(id) : next.add(id); return next; });

  const handleMainCatChange = (id: string) => { setMainCatId(id); setSubCats(new Set()); };
  const selectedCat = MAIN_CATEGORIES.find((c) => c.id === mainCatId);

  // 거리 계산
  const distanceMap = new Map<number, number>();
  if (geoState === "ready" && userCoords) {
    for (const item of results) {
      if (item.lat && item.lng) distanceMap.set(item.id, haversineKm(userCoords.lat, userCoords.lng, item.lat, item.lng));
    }
  }

  const filtered = results
    .filter((item) => {
      if (mainCatId !== "all" && selectedCat) {
        if (selectedCat.tag && !item.tags.includes(selectedCat.tag)) return false;
        if (selectedCat.direction && item.direction !== selectedCat.direction) return false;
      }
      if (subCats.size > 0 && ![...subCats].some((s) => item.tags.includes(s))) return false;
      if (locationSel.length > 0) {
        const combined = [item.location, ...item.locationTags].join(" ").toLowerCase();
        if (!locationSel.some((e) => entryMatches(combined, e))) return false;
      }
      if (isNearby && geoState === "ready" && userCoords) {
        const dist = distanceMap.get(item.id);
        if (dist === undefined || dist > nearbyRadius) return false;
      }
      const [lo, hi] = priceRange;
      if (!(lo === 0 && hi === SLIDER_MAX)) {
        const amount = parsePrice(item.price);
        if (lo === NEGOTIABLE_PRICE && hi === NEGOTIABLE_PRICE) { if (amount !== NEGOTIABLE_PRICE) return false; }
        else if (amount === NEGOTIABLE_PRICE) return false;
        else if (lo === 0 && hi === 0) { if (amount !== 0) return false; }
        else if (amount < lo || (hi < SLIDER_MAX && amount > hi)) return false;
      }
      return true;
    })
    .sort((a, b) => {
      if (geoState === "ready" && sort === "latest") {
        const da = distanceMap.get(a.id) ?? Infinity;
        const db = distanceMap.get(b.id) ?? Infinity;
        if (da !== db) return da - db;
      }
      if (sort === "price_low" || sort === "price_high") {
        const pa = parsePrice(a.price); const pb = parsePrice(b.price);
        if (pa === -1 && pb === -1) return 0;
        if (pa === -1) return 1; if (pb === -1) return -1;
        return sort === "price_low" ? pa - pb : pb - pa;
      }
      return 0;
    });

  const displayed = filtered.slice(0, displayCount);
  const hasMore = displayCount < filtered.length;

  return (
    <div className="min-h-screen bg-surface-page text-text-body">
      <Header onLogoClick={onLogoClick} />

      <div className="border-b border-border-header bg-white">
        <div className="mx-auto px-3 sm:px-6 py-4" style={{ maxWidth: "var(--max-w-hero)" }}>
          <SearchBar value={query} onChange={handleSetQuery} onSearch={handleSearch} />
        </div>
      </div>

      <SearchFilterBar
        mainCatId={mainCatId} onMainCatChange={handleMainCatChange}
        subCats={subCats} onToggleSubCat={toggleSubCat}
        locationSel={locationSel} onLocationChange={setLocationSel}
        sort={sort} onSortChange={setSort}
        priceRange={priceRange} onPriceRangeChange={setPriceRange}
        showSlider={showSlider} onToggleSlider={() => setShowSlider((v) => !v)}
        onReSearch={handleReSearch}
      />

      <div className="mx-auto px-3 sm:px-6 py-6 sm:py-8 pb-16" style={{ maxWidth: "var(--max-w-hero)" }}>
        <h2 className="text-[19px] sm:text-[23px] font-bold text-text-heading tracking-tight mb-4">
          {initialQuery.trim() ? <>&ldquo;{initialQuery}&rdquo; 검색 결과</> : "내 주변 게시글"}
        </h2>

        {isNearby && (
          <NearbySearchBanner
            geoState={geoState} userCoords={userCoords}
            nearbyRadius={nearbyRadius} onRadiusChange={setNearbyRadius}
            onRetry={requestGeo}
          />
        )}

        {loading ? (
          <div className="flex items-center justify-center py-20"><Spinner size="lg" /></div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-text-muted text-[15px] mb-2">검색 결과가 없어요.</p>
            <p className="text-text-placeholder text-[13px] mb-6">
              {isNearby && geoState === "ready"
                ? `현재 위치 ${nearbyRadius}km 이내에 게시글이 없어요. 반경을 늘려보세요.`
                : "다른 검색어를 사용하거나 지역 조건을 넓혀보세요."}
            </p>
            {suggestions.length > 0 && (
              <div className="mb-6">
                <p className="text-[14px] text-text-muted mb-3">이런 키워드로 검색해볼까요?</p>
                <div className="flex flex-wrap justify-center gap-2">
                  {suggestions.map((s) => (
                    <button key={s} onClick={() => onBack(s)} className="px-3 py-1.5 rounded-full text-[14px] font-semibold bg-brand-bg text-brand border border-brand cursor-pointer hover:bg-brand hover:text-white transition-colors">{s}</button>
                  ))}
                </div>
              </div>
            )}
            <div className="border border-dashed border-border-base rounded-2xl px-6 py-5 inline-block">
              <p className="text-[14px] text-text-muted mb-3">이 지역 첫 번째 글을 올려보세요!</p>
              <button onClick={handleWriteClick} className="px-5 py-2 rounded-full bg-brand text-white text-[13px] font-semibold border-none cursor-pointer hover:opacity-85 transition-opacity">글쓰기</button>
            </div>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-2 mb-4 flex-wrap">
              <p className="text-[14px] text-text-muted">총 {filtered.length}개의 결과</p>
              {sort !== "latest" && <span className="text-[12px] font-semibold px-2.5 py-1 rounded-full bg-surface-card text-text-muted border border-border-base">{sort === "price_low" ? "가격 낮은순" : "가격 높은순"}</span>}
              {detectedDirection && <span className="text-[12px] font-semibold px-2.5 py-1 rounded-full bg-brand-bg text-brand">{detectedDirection === "SEEK" ? "제공자 글 위주 검색" : "구하는 글 위주 검색"}</span>}
            </div>
            <div className="flex flex-col divide-y divide-border-header">
              {displayed.map((item) => {
                const catId = tagsAndDirToMainCatId(item.tags ?? [], item.direction ?? "offer");
                const cat = MAIN_CATEGORIES.find((c) => c.id === catId);
                const dist = distanceMap.get(item.id);
                return (
                  <ResultItem
                    key={item.id}
                    title={item.title} category={item.category} location={item.location}
                    timeAgo={item.timeAgo} price={item.price} imageEmoji={item.imageEmoji}
                    imageUrl={item.imageUrl} direction={item.direction}
                    directionLabel={cat ? `${cat.emoji} ${cat.label}` : undefined}
                    distanceLabel={dist !== undefined ? fmtDist(dist) : undefined}
                    bookmarked={isBookmarked(item.id)} onBookmark={() => toggleBookmark(item.id)}
                    onClick={() => router.push(`/post/${item.id}`)}
                  />
                );
              })}
            </div>
            {hasMore && (
              <div className="flex justify-center pt-6">
                <button onClick={() => setDisplayCount(filtered.length)} className="px-6 py-2.5 rounded-full border border-border-base bg-white text-[13px] font-semibold text-text-body cursor-pointer hover:border-brand hover:text-brand transition-colors">
                  더보기 ({filtered.length - displayCount}개)
                </button>
              </div>
            )}
            {!hasMore && <PageNumbers current={currentPage} total={totalPages} onChange={(page) => { window.scrollTo({ top: 0, behavior: "smooth" }); fetchResults(lastApiQueryRef.current, page); }} />}
          </>
        )}
      </div>

      <button onClick={handleWriteClick} className="fixed bottom-6 right-6 z-10 flex items-center gap-2 bg-brand text-white text-xs font-semibold px-4 rounded-full border-none cursor-pointer hover:opacity-85 transition-opacity shadow-search" style={{ height: "44px" }}>
        ✦ 글쓰기
      </button>

      <WritePostModal isOpen={writeOpen} onClose={() => setWriteOpen(false)} onSubmit={handlePostSubmit} />
    </div>
  );
}
