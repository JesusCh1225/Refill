"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Header from "@/components/organisms/Header";
import type { SearchResultItem, PostDraft } from "@/data/sampleMockResults";
import { CATEGORIES, CATEGORY_TAG_MAP } from "@/data/Categories";
import { REGION_CENTERS } from "@/data/mapConstants";
import { coordsFromLocation, extractKeywords, CoordsMap } from "@/lib/mapUtils";
import { useNaverMap } from "@/hooks/useNaverMap";
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
];

export default function MusicMapPage() {
  const router = useRouter();
  const { status: authStatus } = useSession();
  const mapRef = useRef<HTMLDivElement>(null);
  const coordsRef = useRef<CoordsMap>({});

  const [allPosts, setAllPosts] = useState<SearchResultItem[]>([]);
  const [filteredItems, setFilteredItems] = useState<SearchResultItem[]>([]);
  const filteredItemsRef = useRef<SearchResultItem[]>([]);
  filteredItemsRef.current = filteredItems;

  const [writeModalOpen, setWriteModalOpen] = useState(false);
  const [searchInput, setSearchInput] = useState("");
  const [panelOpen, setPanelOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<SearchResultItem | null>(null);
  const [chipFilter, setChipFilter] = useState("all");

  const handleMarkerClick = useCallback((item: SearchResultItem) => {
    setSelectedItem(item);
    setPanelOpen(true);
  }, []);

  const { mapObjRef, renderMarkers } = useNaverMap({
    containerRef: mapRef,
    coordsRef,
    filteredItemsRef,
    onMarkerClick: handleMarkerClick,
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

  /* ── URL 필터 ── */
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const filter = params.get("filter");
    if (!filter || allPosts.length === 0) return;

    const filtered = allPosts.filter((item) => item.tags.includes(filter));
    if (filtered.length > 0) {
      setFilteredItems(filtered);
      filteredItemsRef.current = filtered;
    }
    const label = CATEGORIES.find((c) => c.id === filter)?.label;
    if (label) setSearchInput(label);
  }, [allPosts]);

  /* ── 새 글 등록 ── */
  const handlePostSubmit = (draft: PostDraft) => {
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
      } catch {}
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

  /* ── 검색 ── */
  const handleSearch = () => {
    const q = searchInput.trim().toLowerCase();
    const base = applyChipFilter(allPosts, chipFilter);
    const tokens = extractKeywords(q);

    const matchesToken = (item: SearchResultItem, token: string) =>
      item.title.toLowerCase().includes(token) ||
      item.category.toLowerCase().includes(token) ||
      item.keywords.some((kw) => kw.toLowerCase().includes(token)) ||
      item.locationTags.some((lt) => lt.toLowerCase().includes(token));

    const result = tokens.length ? base.filter((item) => tokens.every((t) => matchesToken(item, t))) : base;

    setFilteredItems(result);
    filteredItemsRef.current = result;
    setSelectedItem(null);
    setPanelOpen(true);

    if (!mapObjRef.current) return;

    const regionKey = Object.keys(REGION_CENTERS).find((key) => tokens.includes(key) || q.includes(key));
    if (regionKey) {
      const { lat, lng, zoom } = REGION_CENTERS[regionKey];
      mapObjRef.current.setCenter(new window.naver.maps.LatLng(lat, lng));
      mapObjRef.current.setZoom(zoom);
      return;
    }

    if (window.naver?.maps?.Service) {
      window.naver.maps.Service.geocode({ query: searchInput.trim() }, (status: any, response: any) => {
        if (status === window.naver.maps.Service.Status.OK && response.v2.addresses.length > 0) {
          const { x, y } = response.v2.addresses[0];
          mapObjRef.current?.setCenter(new window.naver.maps.LatLng(parseFloat(y), parseFloat(x)));
          mapObjRef.current?.setZoom(14);
        }
      });
    } else {
      renderMarkers(result, mapObjRef.current);
    }
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

  const handleMyLocation = () => {
    if (!navigator.geolocation || !mapObjRef.current) return;
    navigator.geolocation.getCurrentPosition(
      ({ coords: { latitude: lat, longitude: lng } }) => {
        mapObjRef.current.panTo(new window.naver.maps.LatLng(lat, lng));
        mapObjRef.current.setZoom(15);
      },
      () => {},
      { timeout: 5000 },
    );
  };

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
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

        <button
          onClick={handleMyLocation}
          title="내 위치로 이동"
          className="absolute bottom-20 right-6 z-10 w-11 h-11 rounded-full bg-white text-text-body flex items-center justify-center border-none cursor-pointer hover:bg-surface-card transition-colors shadow-search"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="3" />
            <path d="M12 2v3M12 19v3M2 12h3M19 12h3" />
            <path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20z" strokeOpacity="0.2" />
          </svg>
        </button>

        <button
          onClick={() => {
            if (authStatus !== "authenticated") { alert("글을 작성하려면 로그인이 필요해요."); return; }
            setWriteModalOpen(true);
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
          onItemClick={handleItemClick}
          onBackToList={() => setSelectedItem(null)}
          onClose={() => { setPanelOpen(false); setSelectedItem(null); }}
          onDetailClick={(item) => router.push(`/post/${item.id}`)}
        />
      </div>

      <WritePostModal isOpen={writeModalOpen} onClose={() => setWriteModalOpen(false)} onSubmit={handlePostSubmit} />
    </div>
  );
}
