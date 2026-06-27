"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/organisms/Header";
import type { SearchResultItem, PostDraft } from "@/data/sampleMockResults";
import { CATEGORIES, CATEGORY_TAG_MAP } from "@/data/Categories";
import { REGION_CENTERS } from "@/data/mapConstants";
import { coordsFromLocation, extractKeywords, CoordsMap } from "@/lib/mapUtils";
import { useNaverMap } from "@/hooks/useNaverMap";
import { useCreatePost } from "@/hooks/useCreatePost";
import MapPanel from "@/components/organisms/MapPanel";
import MapSearchBar from "@/components/molecules/MapSearchBar";
import WritePostModal from "@/components/organisms/WritePostModal";
import FilterChip from "@/components/atom/FilterChip";

declare global {
  interface Window { naver: any; __naverMapInit?: () => void; }
}

const CHIP_FILTERS = [
  { id: "all", label: "전체" },
  { id: "lesson", label: "레슨" },
  { id: "band", label: "밴드/합주" },
  { id: "instrument", label: "악기거래" },
  { id: "record", label: "음반/LP" },
  { id: "book", label: "악보/교재" },
];

export default function MusicMapPage() {
  const router = useRouter();
  const { requireLogin } = useCreatePost();
  const mapRef = useRef<HTMLDivElement>(null);
  const coordsRef = useRef<CoordsMap>({});
  const writeInProgressRef = useRef(false);

  const [allPosts, setAllPosts] = useState<SearchResultItem[]>([]);
  const [filteredItems, setFilteredItems] = useState<SearchResultItem[]>([]);
  const filteredItemsRef = useRef<SearchResultItem[]>([]);
  filteredItemsRef.current = filteredItems;

  const [writeModalOpen, setWriteModalOpen] = useState(false);
  const [searchInput, setSearchInput] = useState("");
  const [panelOpen, setPanelOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<SearchResultItem | null>(null);
  const [chipFilter, setChipFilter] = useState("all");
  const [geoBlocked, setGeoBlocked] = useState(false);
  const [userLat, setUserLat] = useState<number | undefined>();
  const [userLng, setUserLng] = useState<number | undefined>();
  const [showAreaSearch, setShowAreaSearch] = useState(false);

  const handleMarkerClick = useCallback((item: SearchResultItem) => {
    setSelectedItem(item);
    setPanelOpen(true);
  }, []);

  const handleGeoError = useCallback(() => {
    setGeoBlocked(true);
    setTimeout(() => setGeoBlocked(false), 5000);
  }, []);

  const { mapObjRef, renderMarkers } = useNaverMap({
    containerRef: mapRef,
    coordsRef,
    filteredItemsRef,
    onMarkerClick: handleMarkerClick,
    onGeoError: handleGeoError,
    onBoundsChange: useCallback(() => setShowAreaSearch(true), []),
    onUserLocation: useCallback((lat: number, lng: number) => {
      setUserLat(lat);
      setUserLng(lng);
    }, []),
  });

  /* ── 게시글 로드 ── */
  useEffect(() => {
    fetch("/api/posts")
      .then((r) => r.json())
      .then((posts: SearchResultItem[]) => {
        if (!Array.isArray(posts)) return;
        const coords: CoordsMap = {};
        posts.forEach((post) => {
          coords[post.id] = post.lat && post.lng
            ? { lat: post.lat, lng: post.lng }
            : coordsFromLocation(post.location, post.id);
        });
        coordsRef.current = coords;
        setAllPosts(posts);
        setFilteredItems(posts);
        filteredItemsRef.current = posts;
        if (mapObjRef.current) renderMarkers(posts, mapObjRef.current);
      })
      .catch(() => {});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const matchesToken = useCallback((item: SearchResultItem, token: string) => {
    const t = token.toLowerCase();
    return (
      item.title.toLowerCase().includes(t) ||
      item.category.toLowerCase().includes(t) ||
      item.keywords.some((kw) => kw.toLowerCase().includes(t)) ||
      item.locationTags.some((lt) => lt.toLowerCase().includes(t))
    );
  }, []);

  /* ── URL 필터 ── */
  useEffect(() => {
    if (allPosts.length === 0) return;
    const params = new URLSearchParams(window.location.search);

    // ?filter=lesson 등 카테고리 필터
    const filter = params.get("filter");
    if (filter) {
      const filtered = allPosts.filter((item) => item.tags.includes(filter));
      if (filtered.length > 0) {
        setFilteredItems(filtered);
        filteredItemsRef.current = filtered;
        if (mapObjRef.current) renderMarkers(filtered, mapObjRef.current);
      }
      const label = CATEGORIES.find((c) => c.id === filter)?.label;
      if (label) setSearchInput(label);
      setPanelOpen(true);
    }

    // ?q=바이올린 등 해시태그/키워드 검색
    const q = params.get("q");
    if (q) {
      setSearchInput(q);
      const tokens = extractKeywords(q.toLowerCase());
      const result = tokens.length
        ? allPosts.filter((item) => tokens.every((t) => matchesToken(item, t)))
        : allPosts;
      setFilteredItems(result);
      filteredItemsRef.current = result;
      setPanelOpen(true);
      if (mapObjRef.current) renderMarkers(result, mapObjRef.current);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allPosts]);

  /* ── 새 글 등록 ── */
  const handlePostSubmit = (draft: PostDraft) => {
    if (writeInProgressRef.current) return;
    writeInProgressRef.current = true;

    const savePost = async (lat: number, lng: number) => {
      try {
        const res = await fetch("/api/posts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...draft, lat, lng }),
        });
        if (!res.ok) return;
        const newPost: SearchResultItem = await res.json();
        coordsRef.current[newPost.id] = { lat, lng };
        const updated = [...filteredItemsRef.current, newPost];
        setAllPosts((prev) => [...prev, newPost]);
        setFilteredItems(updated);
        filteredItemsRef.current = updated;
        setPanelOpen(true);
        if (mapObjRef.current) {
          renderMarkers(updated, mapObjRef.current);
          mapObjRef.current.panTo(new window.naver.maps.LatLng(lat, lng));
        }
      } catch {
      } finally {
        writeInProgressRef.current = false;
      }
    };

    if (draft.lat && draft.lng) { savePost(draft.lat, draft.lng); return; }

    if (window.naver?.maps?.Service) {
      window.naver.maps.Service.geocode({ query: draft.location }, (status: any, response: any) => {
        if (status === window.naver.maps.Service.Status.OK && response.v2.addresses.length > 0) {
          const { x, y } = response.v2.addresses[0];
          savePost(parseFloat(y), parseFloat(x));
        } else {
          const approx = coordsFromLocation(draft.location, Date.now());
          savePost(approx.lat, approx.lng);
        }
      });
    } else {
      const approx = coordsFromLocation(draft.location, Date.now());
      savePost(approx.lat, approx.lng);
    }
  };

  /* ── 칩 필터 ── */
  const applyChipFilter = (items: SearchResultItem[], chip: string) =>
    chip === "all" ? items : items.filter((item) =>
      (CATEGORY_TAG_MAP[chip] ?? []).some((tag) => item.tags.includes(tag)),
    );

  const handleChipFilter = (categoryId: string) => {
    setChipFilter(categoryId);
    const result = applyChipFilter(allPosts, categoryId);
    setFilteredItems(result);
    filteredItemsRef.current = result;
    setSelectedItem(null);
    if (mapObjRef.current) renderMarkers(result, mapObjRef.current);
  };

  /* ── 현재 뷰포트 bounds 내 아이템 필터 ── */
  const filterByBounds = useCallback((items: SearchResultItem[]) => {
    if (!mapObjRef.current) return items;
    const bounds = mapObjRef.current.getBounds();
    const inBounds = items.filter((item) => {
      const coords = coordsRef.current[item.id];
      if (!coords) return false;
      return bounds.hasLatLng(new window.naver.maps.LatLng(coords.lat, coords.lng));
    });
    return inBounds.length > 0 ? inBounds : items;
  }, []);

  /* ── 검색 ── */
  const handleSearch = async () => {
    const q = searchInput.trim();
    const base = applyChipFilter(allPosts, chipFilter);

    // AI 파싱으로 오타 교정 + 키워드 정규화
    let keywordFiltered: SearchResultItem[];
    if (q) {
      let instruments: string[] = [];
      let services: string[] = [];
      let rawTokens: string[] = [];
      try {
        const res = await fetch(`/api/search/parse?q=${encodeURIComponent(q)}`);
        const data = await res.json();
        instruments = data.instruments ?? [];
        services = data.services ?? [];
        rawTokens = data.rawTokens ?? [];
      } catch { /* 실패 시 아래 폴백 사용 */ }

      if (instruments.length > 0 || services.length > 0 || rawTokens.length > 0) {
        // 악기/서비스 각각 OR, 둘 사이는 AND
        // rawTokens(미등록 악기 등)는 각각 AND 조건으로 추가
        keywordFiltered = base.filter((item) => {
          const matchInstr = instruments.length === 0 || instruments.some((kw) => matchesToken(item, kw));
          const matchSvc = services.length === 0 || services.some((kw) => matchesToken(item, kw));
          const matchRaw = rawTokens.every((t) => matchesToken(item, t));
          return matchInstr && matchSvc && matchRaw;
        });
      } else {
        // 아무것도 인식 못한 경우: 원문 토큰으로 폴백
        const tokens = extractKeywords(q.toLowerCase());
        keywordFiltered = tokens.length ? base.filter((item) => tokens.every((t) => matchesToken(item, t))) : base;
      }
    } else {
      keywordFiltered = base;
    }

    if (!mapObjRef.current) {
      setFilteredItems(keywordFiltered);
      filteredItemsRef.current = keywordFiltered;
      setSelectedItem(null);
      setPanelOpen(true);
      return;
    }

    // 지역 키워드가 포함된 경우: 해당 지역으로 지도 이동 후 전체 키워드 결과 표시
    const regionKey = Object.keys(REGION_CENTERS).find((key) => q.toLowerCase().includes(key));
    if (regionKey) {
      const { lat, lng, zoom } = REGION_CENTERS[regionKey];
      mapObjRef.current.setCenter(new window.naver.maps.LatLng(lat, lng));
      mapObjRef.current.setZoom(zoom);
      setFilteredItems(keywordFiltered);
      filteredItemsRef.current = keywordFiltered;
      setSelectedItem(null);
      setPanelOpen(true);
      renderMarkers(keywordFiltered, mapObjRef.current);
      setShowAreaSearch(false);
      return;
    }

    // 지역 키워드 없는 경우: 현재 지도 뷰포트 내 결과만 표시
    if (window.naver?.maps?.Service && q) {
      // 주소처럼 보이면 지오코딩 시도 후 새 뷰포트 기준 필터
      window.naver.maps.Service.geocode({ query: searchInput.trim() }, (status: any, response: any) => {
        if (status === window.naver.maps.Service.Status.OK && response.v2.addresses.length > 0) {
          const { x, y } = response.v2.addresses[0];
          mapObjRef.current?.setCenter(new window.naver.maps.LatLng(parseFloat(y), parseFloat(x)));
          mapObjRef.current?.setZoom(14);
          // 지도 이동 후 새 뷰포트로 필터
          setTimeout(() => {
            const result = filterByBounds(keywordFiltered);
            setFilteredItems(result);
            filteredItemsRef.current = result;
            setSelectedItem(null);
            setPanelOpen(true);
            if (mapObjRef.current) renderMarkers(result, mapObjRef.current);
            setShowAreaSearch(false);
          }, 300);
        } else {
          // 지오코딩 실패: 현재 뷰포트 기준으로 표시
          const result = filterByBounds(keywordFiltered);
          setFilteredItems(result);
          filteredItemsRef.current = result;
          setSelectedItem(null);
          setPanelOpen(true);
          renderMarkers(result, mapObjRef.current!);
          setShowAreaSearch(false);
        }
      });
      return;
    }

    // 기본: 현재 뷰포트 기준 필터
    const result = filterByBounds(keywordFiltered);
    setFilteredItems(result);
    filteredItemsRef.current = result;
    setSelectedItem(null);
    setPanelOpen(true);
    renderMarkers(result, mapObjRef.current);
    setShowAreaSearch(false);
  };

  const handleClear = () => {
    const result = applyChipFilter(allPosts, chipFilter);
    setSearchInput("");
    setFilteredItems(result);
    filteredItemsRef.current = result;
    setSelectedItem(null);
    setPanelOpen(false);
    if (mapObjRef.current) renderMarkers(result, mapObjRef.current);
  };

  const handleItemClick = (item: SearchResultItem) => {
    setSelectedItem(item);
    const coords = coordsRef.current[item.id];
    if (coords && mapObjRef.current) {
      mapObjRef.current.panTo(new window.naver.maps.LatLng(coords.lat, coords.lng));
    }
  };

  /* ── 현재 화면 영역 기준 검색 ── */
  const handleAreaSearch = () => {
    if (!mapObjRef.current) return;
    const bounds = mapObjRef.current.getBounds();
    const result = allPosts.filter((item) => {
      const coords = coordsRef.current[item.id];
      if (!coords) return false;
      return bounds.hasLatLng(new window.naver.maps.LatLng(coords.lat, coords.lng));
    });
    const applied = applyChipFilter(result, chipFilter);
    setFilteredItems(applied);
    filteredItemsRef.current = applied;
    renderMarkers(applied, mapObjRef.current);
    setSelectedItem(null);
    setPanelOpen(true);
    setShowAreaSearch(false);
  };

  const handleHashtagClick = useCallback((tag: string) => {
    setSearchInput(`#${tag}`);
    const result = applyChipFilter(allPosts, chipFilter).filter((item) =>
      item.keywords.some((kw) => kw.toLowerCase() === tag.toLowerCase()),
    );
    setFilteredItems(result);
    filteredItemsRef.current = result;
    setSelectedItem(null);
    setPanelOpen(true);
    if (mapObjRef.current) renderMarkers(result, mapObjRef.current);
  }, [allPosts, chipFilter, renderMarkers]);

  const handleMyLocation = () => {
    if (!navigator.geolocation || !mapObjRef.current) return;
    navigator.geolocation.getCurrentPosition(
      ({ coords: { latitude: lat, longitude: lng } }) => {
        setUserLat(lat);
        setUserLng(lng);
        mapObjRef.current.panTo(new window.naver.maps.LatLng(lat, lng));
        mapObjRef.current.setZoom(15);
      },
      handleGeoError,
      { timeout: 5000 },
    );
  };


  return (
    <div className="flex flex-col h-screen overflow-hidden">
      <Header />
      <div className="relative flex-1">
        <div ref={mapRef} className="w-full h-full" />

        <MapSearchBar value={searchInput} onChange={setSearchInput} onSearch={handleSearch} onClear={handleClear} />

        <div className="absolute z-10 left-4 right-16 md:right-auto flex gap-1.5 overflow-x-auto" style={{ top: "72px", scrollbarWidth: "none" }}>
          {CHIP_FILTERS.map(({ id, label }) => (
            <FilterChip key={id} active={chipFilter === id} onClick={() => handleChipFilter(id)}>
              {label}
            </FilterChip>
          ))}
        </div>

        {/* 목록 보기 버튼 */}
        <button
          onClick={() => { setSelectedItem(null); setPanelOpen((v) => !v); }}
          className="absolute bottom-20 left-6 z-10 flex items-center gap-1.5 bg-white text-text-body text-xs font-semibold px-4 rounded-full border border-border-base cursor-pointer hover:bg-surface-card transition-colors shadow-search"
          style={{ height: "40px" }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
            <line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" />
          </svg>
          목록 보기
        </button>

        {/* 이 지역에서 검색 버튼 */}
        {showAreaSearch && (
          <button
            onClick={handleAreaSearch}
            className="absolute z-10 left-1/2 -translate-x-1/2 flex items-center gap-1.5 bg-white text-text-body text-xs font-semibold px-4 rounded-full border border-border-base shadow-search cursor-pointer hover:bg-surface-card transition-colors top-28 md:top-4"
            style={{ height: "36px" }}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
            </svg>
            이 지역에서 검색
          </button>
        )}

        <div className="absolute bottom-20 right-6 z-10 flex flex-col items-end gap-2">
          {geoBlocked && (
            <div className="bg-gray-900 text-white text-[11px] rounded-xl px-3 py-2 whitespace-nowrap shadow-lg leading-relaxed">
              위치 권한이 차단되어 있어요.
              <br />
              주소창 🔒 → <strong>위치 → 허용</strong>
              <span className="absolute right-4 border-4 border-transparent border-t-gray-900" style={{ top: "100%" }} />
            </div>
          )}
          <button
            onClick={handleMyLocation}
            title="내 위치로 이동"
            className="w-11 h-11 rounded-full bg-white text-text-body flex items-center justify-center border-none cursor-pointer hover:bg-surface-card transition-colors shadow-search"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3" />
              <path d="M12 2v3M12 19v3M2 12h3M19 12h3" />
              <path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20z" strokeOpacity="0.2" />
            </svg>
          </button>
        </div>

        <button
          onClick={() => {
            if (requireLogin()) setWriteModalOpen(true);
          }}
          className="absolute bottom-6 right-6 z-10 flex items-center gap-2 bg-brand text-white text-xs font-semibold px-4 rounded-full border-none cursor-pointer hover:opacity-85 transition-opacity shadow-search"
          style={{ height: "44px" }}
        >
          ✦ 글쓰기
        </button>

        <MapPanel
          isOpen={panelOpen}
          items={filteredItems}
          selectedItem={selectedItem}
          userLat={userLat}
          userLng={userLng}
          onItemClick={handleItemClick}
          onBackToList={() => setSelectedItem(null)}
          onClose={() => { setPanelOpen(false); setSelectedItem(null); }}
          onDetailClick={(item) => router.push(`/post/${item.id}`)}
          onHashtagClick={handleHashtagClick}
        />
      </div>

      <WritePostModal isOpen={writeModalOpen} onClose={() => setWriteModalOpen(false)} onSubmit={handlePostSubmit} />
    </div>
  );
}
