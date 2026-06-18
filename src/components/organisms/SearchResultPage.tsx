"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/organisms/Header";
import Spinner from "@/components/atom/Spinner";
import SearchFilterBar, { type SortOption } from "@/components/organisms/SearchFilterBar";
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
import {
  isNearbyQuery,
  stripNearbyKeywords,
  haversineKm,
  fmtDist,
  NEARBY_RADIUS_KM,
} from "@/lib/nearbySearch";
import type { LocationEntry } from "@/components/molecules/LocationPicker";

interface SearchResultPageProps {
  initialQuery: string;
  onBack: (query: string) => void;
  onLogoClick: () => void;
}

type GeoState = "idle" | "requesting" | "ready" | "denied";

// 선택 항목 하나를 "단어별 변형(AND 조건) 그룹" 배열로 분해 (예: "수원시 장안구" -> [["수원시","수원"], ["장안구"]])
function entryTermGroups(e: LocationEntry): string[][] {
  const parts = e.dong ? [e.si, e.gu, e.dong] : e.gu ? [e.si, e.gu] : e.si ? [e.si] : [];
  return parts.filter(Boolean).flatMap((p) => p.split(" ")).map(wordVariants);
}

function entryMatches(combinedLower: string, e: LocationEntry): boolean {
  return entryTermGroups(e).every((variants) => variants.some((v) => combinedLower.includes(v.toLowerCase())));
}

// 재검색 시 API에 붙일 가장 구체적인 지역명 (동 > 구 > 시)
function mostSpecificLocLabel(e: LocationEntry): string {
  return e.dong || e.gu || e.si || "";
}

export default function SearchResultPage({ initialQuery, onBack, onLogoClick }: SearchResultPageProps) {
  const router = useRouter();
  const { requireLogin, createPost } = useCreatePost();
  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState<SearchResultItem[]>([]);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [writeOpen, setWriteOpen] = useState(false);

  const [mainCatId, setMainCatId] = useState("all");
  const [subCats, setSubCats] = useState<Set<string>>(new Set());
  const [locationSel, setLocationSel] = useState<LocationEntry[]>([]);
  const [sort, setSort] = useState<SortOption>("latest");
  const [priceRange, setPriceRange] = useState<[number, number]>([0, SLIDER_MAX]);
  const [showSlider, setShowSlider] = useState(false);

  // 근처 검색 상태
  const [isNearby, setIsNearby] = useState(false);
  const [geoState, setGeoState] = useState<GeoState>("idle");
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [nearbyRadius, setNearbyRadius] = useState(NEARBY_RADIUS_KM);

  const queryRef = useRef(initialQuery);
  const { isBookmarked, toggle: toggleBookmark } = useBookmarks();

  const handleSetQuery = (q: string) => { queryRef.current = q; setQuery(q); };
  const handleSearch = (voiceQuery?: string) => {
    const q = voiceQuery ?? queryRef.current;
    if (q.trim()) onBack(q);
  };

  const fetchResults = (apiQuery: string) => {
    setLoading(true);
    fetch("/api/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query: apiQuery }),
    })
      .then((r) => r.json())
      .then((data) => {
        setResults(Array.isArray(data.results) ? data.results : []);
        setSuggestions(Array.isArray(data.suggestions) ? data.suggestions : []);
      })
      .catch(() => { setResults([]); setSuggestions([]); })
      .finally(() => setLoading(false));
  };

  const requestGeo = useCallback(() => {
    if (!navigator.geolocation) { setGeoState("denied"); return; }
    setGeoState("requesting");
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        setUserCoords({ lat: coords.latitude, lng: coords.longitude });
        setGeoState("ready");
      },
      () => setGeoState("denied"),
      { timeout: 8000 },
    );
  }, []);

  // 초기 로드
  useEffect(() => {
    const nearby = isNearbyQuery(initialQuery);
    setIsNearby(nearby);

    // 근처 검색이면 "근처/주변" 키워드 제거 후 쿼리 정제
    const cleanedQuery = nearby ? stripNearbyKeywords(initialQuery) : initialQuery;

    const parsed = parseLocationFromQuery(cleanedQuery);
    if (parsed) {
      setLocationSel([{ si: parsed.si, gu: parsed.gu, dong: parsed.dong }]);
      setQuery(parsed.restQuery);
      queryRef.current = parsed.restQuery;
    } else {
      setQuery(cleanedQuery);
      queryRef.current = cleanedQuery;
    }

    fetchResults(initialQuery);

    if (nearby) requestGeo();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialQuery]);

  const handleReSearch = () => {
    const locVal = locationSel.map(mostSpecificLocLabel).filter(Boolean).join(" ");
    const combined = [queryRef.current.trim(), locVal].filter(Boolean).join(" ");
    fetchResults(combined || initialQuery);
  };

  const handleWriteClick = () => {
    if (requireLogin()) setWriteOpen(true);
  };

  // 검색 화면에서 작성한 글은 바로 상세 화면으로 이동
  const handlePostSubmit = async (draft: PostDraft) => {
    const newPost = await createPost(draft);
    if (newPost) router.push(`/post/${newPost.id}`);
  };

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

  // 근처 검색용 거리 계산 맵
  const distanceMap = new Map<number, number>();
  if (isNearby && geoState === "ready" && userCoords) {
    for (const item of results) {
      if (item.lat && item.lng) {
        distanceMap.set(item.id, haversineKm(userCoords.lat, userCoords.lng, item.lat, item.lng));
      }
    }
  }

  const filtered = results
    .filter((item) => {
      if (mainCatId !== "all" && selectedCat) {
        if (selectedCat.tag && !item.tags.includes(selectedCat.tag)) return false;
        if (selectedCat.direction && item.direction !== selectedCat.direction) return false;
      }

      if (subCats.size > 0) {
        const hasSubCat = [...subCats].some((s) => item.tags.includes(s));
        if (!hasSubCat) return false;
      }

      if (locationSel.length > 0) {
        const combined = [item.location, ...item.locationTags].join(" ").toLowerCase();
        if (!locationSel.some((e) => entryMatches(combined, e))) return false;
      }

      // 근처 검색: 반경 이내만 통과
      if (isNearby && geoState === "ready" && userCoords) {
        const dist = distanceMap.get(item.id);
        if (dist === undefined || dist > nearbyRadius) return false;
      }

      const [lo, hi] = priceRange;
      if (!(lo === 0 && hi === SLIDER_MAX)) {
        const amount = parsePrice(item.price);
        if (lo === NEGOTIABLE_PRICE && hi === NEGOTIABLE_PRICE) {
          if (amount !== NEGOTIABLE_PRICE) return false;
        } else if (amount === NEGOTIABLE_PRICE) {
          return false; // 협의 게시글은 숫자 가격 필터에서 제외
        } else {
          if (lo === 0 && hi === 0) { if (amount !== 0) return false; }
          else if (amount < lo || (hi < SLIDER_MAX && amount > hi)) return false;
        }
      }

      return true;
    })
    .sort((a, b) => {
      // 근처 검색이면 거리순 우선
      if (isNearby && geoState === "ready") {
        const da = distanceMap.get(a.id) ?? Infinity;
        const db = distanceMap.get(b.id) ?? Infinity;
        if (da !== db) return da - db;
      }
      if (sort === "price_low") {
        const pa = parsePrice(a.price); const pb = parsePrice(b.price);
        if (pa === -1 && pb === -1) return 0;
        if (pa === -1) return 1; if (pb === -1) return -1;
        return pa - pb;
      }
      if (sort === "price_high") {
        const pa = parsePrice(a.price); const pb = parsePrice(b.price);
        if (pa === -1 && pb === -1) return 0;
        if (pa === -1) return 1; if (pb === -1) return -1;
        return pb - pa;
      }
      return 0;
    });

  const RADIUS_OPTIONS = [5, 10, 20, 30];

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
        locationSel={locationSel}
        onLocationChange={setLocationSel}
        sort={sort}
        onSortChange={setSort}
        priceRange={priceRange}
        onPriceRangeChange={setPriceRange}
        showSlider={showSlider}
        onToggleSlider={() => setShowSlider((v) => !v)}
        onReSearch={handleReSearch}
      />

      {/* 결과 */}
      <div className="mx-auto px-3 sm:px-6 py-6 sm:py-8 pb-16" style={{ maxWidth: "var(--max-w-hero)" }}>
        <h2 className="text-[19px] sm:text-[23px] font-bold text-text-heading tracking-tight mb-4">
          &ldquo;{initialQuery}&rdquo; 검색 결과
        </h2>

        {/* 근처 검색 상태 배너 */}
        {isNearby && (
          <div className="mb-4 rounded-2xl border border-border-base bg-white px-4 py-3 flex flex-col gap-2">
            {geoState === "requesting" && (
              <div className="flex items-center gap-2 text-[13px] text-text-muted">
                <span className="w-3 h-3 rounded-full border-2 border-brand border-t-transparent animate-spin shrink-0" />
                현재 위치를 확인하는 중...
              </div>
            )}
            {geoState === "ready" && userCoords && (
              <>
                <div className="flex items-center gap-2 text-[13px] font-semibold text-brand">
                  <span>📍</span>
                  <span>현재 위치 기준 {nearbyRadius}km 이내</span>
                </div>
                <div className="flex gap-1.5 flex-wrap">
                  {RADIUS_OPTIONS.map((r) => (
                    <button
                      key={r}
                      onClick={() => setNearbyRadius(r)}
                      className={`h-7 px-3 rounded-full text-[12px] font-semibold border cursor-pointer transition-colors ${
                        nearbyRadius === r
                          ? "bg-brand text-white border-brand"
                          : "bg-white text-text-muted border-border-base hover:border-brand"
                      }`}
                    >
                      {r}km
                    </button>
                  ))}
                </div>
              </>
            )}
            {geoState === "denied" && (
              <div className="flex items-center gap-2">
                <span className="text-[13px] text-text-muted">
                  ⚠️ 위치 권한이 없어 근처 검색을 할 수 없어요.
                </span>
                <button
                  onClick={requestGeo}
                  className="text-[12px] text-brand font-semibold border-none bg-transparent cursor-pointer hover:underline shrink-0"
                >
                  다시 시도
                </button>
              </div>
            )}
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Spinner size="lg" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-text-muted text-[15px] mb-2">검색 결과가 없어요.</p>
            <p className="text-text-placeholder text-[13px] mb-6">
              {isNearby && geoState === "ready"
                ? `현재 위치 ${nearbyRadius}km 이내에 게시글이 없어요. 반경을 늘려보세요.`
                : "다른 검색어를 사용하거나 지역 조건을 넓혀보세요."}
            </p>
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
                const dist = distanceMap.get(item.id);
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
                    distanceLabel={dist !== undefined ? fmtDist(dist) : undefined}
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

      <button
        onClick={handleWriteClick}
        className="fixed bottom-6 right-6 z-10 flex items-center gap-2 bg-brand text-white text-xs font-semibold px-4 rounded-full border-none cursor-pointer hover:opacity-85 transition-opacity shadow-search"
        style={{ height: "44px" }}
      >
        ✦ 글쓰기
      </button>

      <WritePostModal isOpen={writeOpen} onClose={() => setWriteOpen(false)} onSubmit={handlePostSubmit} />
    </div>
  );
}
